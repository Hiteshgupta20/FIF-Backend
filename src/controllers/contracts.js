var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const pool = require('../config/postgreDB');
const request = require('request');
const bcrypt = require('bcrypt');
const v = require('node-input-validator');
const multiparty = require('multiparty');
const querystring = require('querystring');
const FormData = require('form-data');
const fs = require('fs-extra');
const UsersService = require('../services/user');
const ContractsService = require('../services/contracts');
const CrmAuthService = require('../services/crmAuth');
const AppConstants = require('../config/appConstants');
const PointsHistory = require('../services/pointHistory');
const PointManagement = require('../services/pointManagement');
const NotificationService = require('../services/notification');
const crmAuthService = require('../services/crmAuth');
const UserModel = require('../models/user');
const activityLogs = require('../services/activityLogs');
const moment = require('moment');
const PointService = require('../services/pointManagement');

router.post('/syncContract', auth.isAuthenticated, (req, res) => {

  console.log(req.body);

  let validator = new v(req.body, {
    loginId: 'required',
    mobileNo: 'required',
  });

  let syncContractsData = req.body;


  validator.check().then(async function(matched) {
    if (!matched || (!syncContractsData.identityNo && !syncContractsData.contractNo)) {
      res.json(util.failed({}, 'Mandatory parameters are missing.'));
    }

    try {
      let currHours = moment().tz('Asia/Jakarta').format('HH').trim();
      let currMinutes = moment().tz('Asia/Jakarta').format('MM').trim();
      console.log(currHours)
      if ((currHours >= 6 && currHours < 21) || (currHours == 21 && currMinutes == 0)) {


        let loginData = await CrmAuthService.getCRMAuthToken();
        syncContractsData.accessToken = loginData.accessToken;


        let headersObj = {
          "Authorization": "bearer " + syncContractsData.accessToken,
          "Content-Type": "application/json"
        }


        let formReqData = {
          identityNo: syncContractsData.identityNo,
          mobileNo: syncContractsData.mobileNo,
          contractNo: syncContractsData.contractNo
        }

        try {
          let result = await ContractsService.getCustomerMainNo(formReqData, headersObj);
          console.log("result", result)
          let data = {
            loginId: req.body.loginId,
            custMainNo: result.custMainNo,
            ktpNo: req.body.identityNo || null,
            contractNo: req.body.contractNo || null,
            branchName: result.branchName || null,
            branchId: result.branchId || null
          }
          try {
            let existingCustDetails = await UsersService.getUserDetails(data.loginId);
            let firstTimeUser = true;
            console.log("existing customer", existingCustDetails)
            if (existingCustDetails && existingCustDetails.custmainno) {
              firstTimeUser = false;
            }

            let resObj = {
              'custMainNo': result.custMainNo
            }
            if (result != "NA") {
              await UsersService.updateCustMainNo(data);
              try {
                let contractFormReqData = {
                  custMainNo: resObj.custMainNo
                }
                await ContractsService.addSyncContractHistory(data);
                console.log(firstTimeUser)
                if (firstTimeUser) {
                  try {
                    let contracts = await ContractsService.getContracts(contractFormReqData, headersObj);
                    console.log("contracts ", contracts)
                    let userTotalInstallments = 0;
                    contracts.forEach(async function(contract) {
                      let tagihan = contract.total_tagihan.replace(/,/g, '').trim() || 0;
                      userTotalInstallments = userTotalInstallments + parseInt(tagihan);

                    });


                    let installmentData = {
                      loginId: req.body.loginId,
                      custTotalInstallments: userTotalInstallments,
                    }
                    if (userTotalInstallments > 0) {
                      await UsersService.updateCustTotalInstallments(installmentData);
                    }
                    let points = 0;
                    let existingUsers = await UsersService.getUserPointsByCustMainNo(contractFormReqData.custMainNo);
                    if (existingUsers.length > 1) {
                      const maxPointsUser = existingUsers.reduce((prev, current) => (prev.cur_bal > current.cur_bal) ? prev : current);
                      for (let i = 0; i < existingUsers.length; i++) {
                        if (existingUsers[i].loginid !== maxPointsUser.loginid) {
                          let pointDiff = maxPointsUser.cur_bal - existingUsers[i].cur_bal;
                          console.log(pointDiff);
                          let pdata = {
                            type: 'CR',
                            points: pointDiff,
                            loginId: existingUsers[i].loginid,
                            modifyby: existingUsers[i].loginid,
                            insertby: existingUsers[i].loginid,
                            remarks: 'Points equated for Sync Contract',
                            description: 'Points equated for Sync Contract',
                            name: 'Points added'
                          }
                          try {
                            await PointsHistory.equateSameCustMainNoPoints(pdata);
                          } catch (err) {
                            reject(err);
                          }
                        }
                      }
                    } else {
                      let pointsData = {
                        loginid: data.loginId,
                        activityappid: 'SYNC CONTRACT',
                        description: 'Contracts Synced'
                      }
                      let pointsRes = await PointManagement.addPointsForActivity(pointsData);

                      if (pointsRes.currentPoints) {
                        points = pointsRes.currentPoints;
                      }
                    }
                    let loginId = req.body.loginId;
                    let activityData = util.prepareActivityLogsData(loginId, 'Contracts Synced', 'Contracts Synced');
                    await activityLogs.createActivityLog(activityData);
                    res.json(util.success(resObj, '', '', points));
                  } catch (err) {
                    res.json(util.failed(err));
                  }
                } else {
                  res.json(util.success(resObj));
                }
              } catch (err) {
                res.json(util.failed(err));
              }
            } else {
              let currHours = moment().tz('Asia/Jakarta').format('HH').trim();
              let currMinutes = moment().tz('Asia/Jakarta').format('MM').trim();

              if ((currHours >= 6 && currHours < 21) || (currHours == 21 && currMinutes == 0)) {
                // if (firstTimeUser) {
                //     res.json(util.failed({},'Nomor Kontrak/KTP Tidak Ditemukan \n \n 1. Pastikan nomor HP yang teregister di FMC sama dengan nomor kontrak yang teregister di kontrak kredit FIFGROUP. \n 2. Pastikan nomor KTP yang diketik sama dengan nomor KTP yang teregister di kontrak kredit FIFGROUP. \n 3. Pastikan nomor kontrak yang diketik sama dengan nomor di copy kontrak kredit FIFGROUP. \n \n Hubungi HaloFIF jika ada perubahan data dan register FIFGROUP kembali dengan menggunakan data terbaru.'));
                // }
                // else {
                //     res.json(util.failed({},'Sinkronisasi belum berhasil dilakukan. Silahkan mencoba kembali'));
                // }
                res.json(util.failed({}, 'Nomor Kontrak/KTP Tidak Ditemukan \n \n 1. Pastikan nomor HP yang teregister di FMC sama dengan nomor kontrak yang teregister di kontrak kredit FIFGROUP. \n 2. Pastikan nomor KTP yang diketik sama dengan nomor KTP yang teregister di kontrak kredit FIFGROUP. \n 3. Pastikan nomor kontrak yang diketik sama dengan nomor di copy kontrak kredit FIFGROUP. \n \n Hubungi HaloFIF jika ada perubahan data dan register FIFGROUP kembali dengan menggunakan data terbaru.'));

              } else {
                if (firstTimeUser) {
                  res.json(util.failed({}, 'Saat ini sistem sudah tidak bisa diakses, silahkan coba kembali pada jam 06.00 - 21.00. Terima kasih.'));
                } else {
                  res.json(util.failed({}, 'Saat ini sistem sudah tidak bisa diakses, silahkan coba kembali pada jam 06.00 - 21.00. Terima kasih.'));
                }
              }
            }
          } catch (err) {
            res.json(util.failed(err));
          }
        } catch (err) {
          res.json(util.failed(err));
        }
      } else {
        res.json(util.failed({}, 'Saat ini sistem sudah tidak bisa diakses, silahkan coba kembali pada jam 06.00 - 21.00. Terima kasih.'));

      }
    } catch (err) {
      res.json(util.failed(err));
    }
  });
});

router.post('/getInstallments', auth.isAuthenticated, (req, res) => {
  debugger;
  let validator = new v(req.body, {
    custMainNo: 'required',
  });

  validator.check().then(async function(matched) {
    if (!matched) {
      res.json(util.failed({}, 'Please sync your contracts.'));
    }
    let getInstallmentsData = req.body;
    let loginId = req.body.loginId || 0;
    let contractsSynced = req.body.contractsSynced || false;
    let userData = await UserModel.findUserByCustMainNo(req.body.custMainNo);
    if (userData) {
      try {
        let loginData = await CrmAuthService.getCRMAuthToken();
        getInstallmentsData.accessToken = loginData.accessToken;
        let headersObj = {
          "Authorization": "bearer " + getInstallmentsData.accessToken,
          "Content-Type": "application/json"
        }

        let status = "";
        if (req.body.status === 1 || req.body.status === "1") {
          status = 1;
        } else if (req.body.status === 0 || req.body.status === "0") {
          status = 0;
        } else if (req.body.status === "") {
          status = "";
        }


        let formReqData = {
          custMainNo: getInstallmentsData.custMainNo,
          reqStatus: status,
          reqType: getInstallmentsData.type || ''
        }
        try {
          let allContracts = [];
          let currentContracts = [];
          let paidContracts = [];
          let vehicleContracts = [];
          let fundContracts = [];
          let otherContracts = [];
          let contracts = await ContractsService.getContracts(formReqData, headersObj);
          console.log(contracts)

          if (contracts) {

            let data = {
              "data": []
            }
            let contractJson = contracts;
            let total = 0;
            let total_tagihan = 0;

            for (let i = 0; i < contractJson.length; i++) {
              // let jmlterakhirbayar = contractJson[i].jmlterakhirbayar.replace(/,/g, '').trim() || 0;
              // total = total + parseInt(jmlterakhirbayar);
              let tagihan = contractJson[i].total_tagihan.replace(/,/g, '').trim() || 0;
              total_tagihan = total_tagihan + parseInt(tagihan);
              let status = contractJson[i]['contract_status'];
              contractJson[i]['cust_dp'] = util.formatAmountFields(contractJson[i]['cust_dp']);
              contractJson[i]['total_dp'] = util.formatAmountFields(contractJson[i]['total_dp']);
              contractJson[i]['tot_prod_price'] = util.formatAmountFields(contractJson[i]['tot_prod_price']);
              contractJson[i]['month_inst'] = util.formatAmountFields(contractJson[i]['month_inst']);
              contractJson[i]['total_angsuran'] = util.formatAmountFields(contractJson[i]['total_angsuran']);
              contractJson[i]['sisa_angsuran'] = util.formatAmountFields(contractJson[i]['sisa_angsuran']);
              contractJson[i]['total_tagihan'] = util.formatAmountFields(contractJson[i]['total_tagihan']);
              contractJson[i]['total_hutang'] = util.formatAmountFields(contractJson[i]['total_hutang']);
              contractJson[i]['coll_fee'] = util.formatAmountFields(contractJson[i]['coll_fee']);
              contractJson[i]['penalty'] = util.formatAmountFields(contractJson[i]['penalty']);
              contractJson[i]['overdue'] = util.formatAmountFields(contractJson[i]['overdue']);
              contractJson[i]['contract_status_desc'] = AppConstants.contractStatusMapping[status];
              if (contractJson[i]['termination_date'] && new Date(contractJson[i]['termination_date'])) {
                contractJson[i]['termination_date'] = util.formatTimeStamp(new Date(contractJson[i]['termination_date']));
              }
              if (formReqData.reqType != '') {
                if (contractJson[i].faqcategory == formReqData.reqType) {
                  allContracts.push(contractJson[i]);
                }
              } else {
                allContracts.push(contractJson[i]);
              }
              // allContracts.push(contractJson[i]);
              if (status == 'AC' || status == 'PP' || status == 'RP' || status == 'WO') {
                if (formReqData.reqType != '') {
                  if (contractJson[i].faqcategory == formReqData.reqType) {
                    currentContracts.push(contractJson[i]);
                  }
                } else {
                  currentContracts.push(contractJson[i]);
                }

              } else {
                // paidContracts.push(contractJson[i]);
                if (formReqData.reqType != '') {
                  if (contractJson[i].faqcategory == formReqData.reqType) {
                    paidContracts.push(contractJson[i]);
                  }
                } else {
                  paidContracts.push(contractJson[i]);
                }
              }
              // else if (status == 'PT' || status == 'CL' || status == 'RP' || status == 'CN' || status == 'PB' || status == 'CR') {
              //     // paidContracts.push(contractJson[i]);
              //     if (formReqData.reqType != '') {
              //         if (contractJson[i].faqcategory == formReqData.reqType) {
              //             paidContracts.push(contractJson[i]);
              //         }
              //     }
              //     else {
              //         paidContracts.push(contractJson[i]);
              //     }
              // }
            }

            if (formReqData.reqStatus === "1" || formReqData.reqStatus === 1) {
              data['data'] = currentContracts;
            } else if (formReqData.reqStatus === "0" || formReqData.reqStatus === 0) {
              data['data'] = paidContracts;
            } else if (formReqData.reqStatus === "") {
              data['data'] = allContracts;
            }


            let remainingMonthInstallments = 0;
            currentContracts.forEach((contract) => {
              if (contract['contract_status'] == 'AC' || contract['contract_status'] == 'PP' || contract['contract_status'] == 'RP' || contract['contract_status'] == 'WO') {
                let total_tagihan = contract.total_tagihan.replace(/,/g, '').trim() || 0;
                let coll_fee = contract.coll_fee.replace(/,/g, '').trim() || 0;
                let penalty = contract.penalty.replace(/,/g, '').trim() || 0;
                let totalangsuran = contract.total_angsuran.replace(/,/g, '').trim() || 0;
                remainingMonthInstallments = remainingMonthInstallments + parseInt(coll_fee) + parseInt(penalty) + parseInt(totalangsuran);
              }

            });
            data.remainingMonthInstallments = remainingMonthInstallments;
            data.totalMonthInstallments = userData["custtotalinstallments"] || 0;

            // if (contractsSynced){
            //     let historyData = {
            //         loginId: getInstallmentsData.loginId,
            //         ktpNo: userData.ktp_no || null
            //     }
            //     let syncHistory = await ContractsService.addSyncContractHistory(historyData);
            // }

            if (loginId) {
              let activityData = util.prepareActivityLogsData(loginId, 'Viewed Contracts', 'Viewed Contracts');
              await activityLogs.createActivityLog(activityData);
            }

            res.json(util.success(data));


          } else {
            res.json(util.failed("No Details Found"));
          }
        } catch (err) {
          res.json(util.failed(err));
        }
      } catch (err) {
        res.json(util.failed(err));
      }
    } else {
      res.json(util.failed('Contracts not synced'));
    }

  });
});


router.post('/getInstallmentPaymentHistory', auth.isAuthenticated, (req, res) => {

  let validator = new v(req.body, {
    custMainNo: 'required',
    contractNo: 'required'
  });

  validator.check().then(async function(matched) {
    if (!matched) {
      res.json(util.failed({}, 'Please sync your contracts.'));
    }
    let getContractDetails = req.body;

    try {
      let loginData = await CrmAuthService.getCRMAuthToken();
      getContractDetails.accessToken = loginData.accessToken;
      let headersObj = {
        "Authorization": "bearer " + getContractDetails.accessToken,
        "Content-Type": "application/json"
      }

      let formReqData = {
        custMainNo: getContractDetails.custMainNo
      }
      try {
        let contractDetails = await ContractsService.getContractDetails(formReqData, headersObj);
        if (contractDetails) {
          let contractArr = JSON.parse(contractDetails);
          let resArr = [];
          for (let i = 0; i < contractArr.length; i++) {
            if (contractArr[i]['contract_no'] == getContractDetails.contractNo) {
              contractArr[i]['jmlterakhirbayar'] = util.formatAmountFields(contractArr[i]['jmlterakhirbayar']);
              contractArr[i]['angsuran'] = util.formatAmountFields(contractArr[i]['angsuran']);
              contractArr[i]['penalty'] = util.formatAmountFields(contractArr[i]['penalty']);
              contractArr[i]['coll_fee'] = util.formatAmountFields(contractArr[i]['coll_fee']);
              resArr.push(contractArr[i]);
            }
          }
          resArr.sort(function(a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.paid_date) - new Date(a.paid_date);
          });
          let slicedArr = [];
          slicedArr = resArr.slice(0, 3);
          res.json(util.success(slicedArr));

        } else {
          res.json(util.failed("No Details Found"));
        }
      } catch (err) {
        res.json(util.failed(err));
      }
    } catch (err) {
      res.json(util.failed(err));
    }
  });
});

router.post('/getSyncContractsHistory', auth.isAuthenticated, (req, res) => {

  let validator = new v(req.body, {
    loginId: 'required'
  });

  validator.check().then(async function(matched) {
    if (!matched) {
      res.json(util.failed({}, 'Login ID is missing'));
    }
    let getSyncHistory = req.body;

    let formReqData = {
      loginId: getSyncHistory.loginId
    }
    try {
      let contractHistory = await ContractsService.getSyncContractsHistory(formReqData);
      for (let i = 0; i < contractHistory.length; i++) {
        contractHistory[i].insertdate = util.formatTimeStamp(contractHistory[i].insertdate);
      }
      res.json(util.success(contractHistory));
    } catch (err) {
      res.json(util.failed(err));
    }
  });
});



router.post('/changeStatusofPaidContracts', auth.isAuthenticated, (req, res) => {

  let validator = new v(req.body, {
    custMainNo: 'required',
    custNo: 'required',
    contractNo: 'required',
    installmentNo: 'required',
    seqNo: 'required',
    paidDate: 'required',
    totalCustPaid: 'required',
    paidStatus: 'required',
    pointEligible: 'required'
  });

  validator.check().then(async function(matched) {
    if (!matched) {
      res.json(util.failed({}, 'Login ID is missing'));
    }
    let contractData = req.body;
    let custMainNo = req.body.custMainNo;
    let singleFlag = false;
    let notificationMonth = moment(contractData.paidDate, "DD-MM-YYYY").format("MM") || 0
    if (notificationMonth.length < 2) {
      notificationMonth = '0' + notificationMonth;
    }
    try {
      let contractUser = await UsersService.getAllUsersDetailsByCustMainNo(custMainNo);
      for (let i = 0; i <= contractUser.length - 1; i++) {
        if (contractUser && contractUser[i].loginid) {
          contractData.loginId = contractUser[i].loginid;
          let dupRecord = await ContractsService.checkIfPointsCreditedForInstallmentOnTime(contractData);
          if (dupRecord && dupRecord.length === contractUser.length) {
            res.json(util.failed("Record Already Exist"))
          } else if (dupRecord && dupRecord.length > 0) {
            await ContractsService.addInstallmentsPointsData(contractData);
            let notificationData = {
              type: 'INSTALLMENT_PAYMENT_ON_TIME',
              refid: new Date().getTime(),
              paidDate: contractData.paidDate,
              contractNo: contractData.contractNo,
              amountPaid: contractData.totalCustPaid,
              notificationMonth: notificationMonth
            }
            await NotificationService.sendNotification(notificationData, contractUser[i], false, true, false);
          } else {
            await ContractsService.addInstallmentsPointsData(contractData);
            let notificationData = {
              type: 'INSTALLMENT_PAYMENT_ON_TIME',
              refid: new Date().getTime(),
              paidDate: contractData.paidDate,
              contractNo: contractData.contractNo,
              amountPaid: contractData.totalCustPaid,
              notificationMonth: notificationMonth
            }
            await NotificationService.sendNotification(notificationData, contractUser[i], false, true, false);
            if (contractData.pointEligible == 'Y') {
              let pointsData = {
                loginid: contractData.loginId,
                activityappid: 'INSTALLMENT PAYMENT',
                description: 'Installment paid on time'
              }
              let pointsAdded = await PointManagement.addPointsForActivity(pointsData);
            } else {
              res.json(util.failed('Something went wrong, please try again.', 'Something went wrong, please try again.'));
            }
          }
        } else {
          //res.jon("Hwll")
          res.json(util.failed('User with this customer main number not found.', 'User with this customer main number not found.'));
        }
      }
      res.json(util.success(contractData, 'Request Successful'));
    } catch (err) {
      res.json(util.failed(err, 'Something went wrong, please try again.'));
    }
  });
});

router.post('/getOrdersForTracking', auth.isAuthenticated, (req, res) => {

  let validator = new v(req.body, {
    loginId: 'required'
  });

  validator.check().then(async function(matched) {
    if (!matched) {
      res.json(util.failed({}, 'Mandatory params missing'));
    }
    try {
      let ordersData = req.body;
      let loginId = req.body.loginId;
      let reqKtpNumber = req.body.ktpNumber || "";
      let userInfo = await UsersService.getUserDetails(loginId);
      if (userInfo) {
        let loginData = await CrmAuthService.getCRMAuthToken();
        try {
          let headersObj = {
            "Authorization": "bearer " + loginData.accessToken,
            "Content-Type": "application/json"
          }

          let formReqData;

          if (reqKtpNumber) {
            formReqData = {
              ktpNo: reqKtpNumber,
              phoneNumber: userInfo.msisdn
            }
          } else {
            formReqData = {
              ktpNo: userInfo.ktp_no,
              phoneNumber: userInfo.msisdn
            }
          }

          let ordersArr = [];
          try {
            ordersArr = await ContractsService.getOrdersForTracking(formReqData, headersObj);
            let errMsg = '';
            if (ordersArr.length == 0) {
              errMsg = 'Maaf kontrak tidak ditemukan. Pastikan data KTP dan handphone sama dengan yang teregister di kontrak anda atau hubungi Customer Service untuk melakukan pembaharuan data KTP dan Handphone';
            }
            if (ordersArr) {
              let activityData = util.prepareActivityLogsData(loginId, 'Viewed Tracking Order Screen', 'Viewed Tracking Order Screen');
              await activityLogs.createActivityLog(activityData);
            }
            res.json(util.success(ordersArr, errMsg));
          } catch (err) {
            res.json(util.failed('Something went wrong!'));
          }

        } catch (err) {
          res.json(util.failed(err));
        }
      } else {
        res.json(util.failed('User does not exist.'));
      }
    } catch (err) {
      res.json(util.failed(err));
    }

  });
});

async function updateInstallmentData(data) {
  return new Promise(async function(resolve, reject) {
    try {
      let loginData = await crmAuthService.getCRMAuthToken();

      let payload = {
        accessToken: loginData.accessToken,
        custMainNo: data.custMainNo
      }
      //get custNo and idNo from main no.
      let headersObj = {
        "Authorization": "bearer " + payload.accessToken,
        "Content-Type": "application/json"
      }

      let customerContractData = await ContractsService.getContractDetails(payload, headersObj);

      customerContractData = JSON.parse(customerContractData);
      let total = 0;
      customerContractData.forEach((contract) => {
        let jmlterakhirbayar = contract.jmlterakhirbayar.replace(/,/g, '').trim() || 0;
        total = total + parseInt(jmlterakhirbayar);
      })

      let total_tagihan = await getContracts(payload);
      let remainingMonthInstallments = total_tagihan - total;
      if (remainingMonthInstallments < 0) {
        remainingMonthInstallments = 0;
      }
      data.remainingMonthInstallments = remainingMonthInstallments;
      data.totalMonthInstallments = total_tagihan;
      resolve(data);
    } catch (err) {
      logger.error(err);
      resolve(data);
    }
  });


}

function getContracts(payload) {
  return new Promise(function(resolve, reject) {
    let headersObj = {
      "Authorization": "bearer " + payload.accessToken,
      "Content-Type": "application/json"
    }
    request({
      headers: headersObj,
      url: AppConstants.creditApplicationBaseUrl + 'fifcrm/cust/installments/main/duedate?cust_main_no=' + payload.custMainNo,
    }, function(err, response, body) {
      if (err) {
        logger.error('API failed:', err);
        reject(0);
      }
      let contracts = JSON.parse(body);
      let total_tagihan = 0;
      contracts.forEach((contract) => {
        let tagihan = contract.total_tagihan.replace(/,/g, '').trim() || 0;
        total_tagihan = total_tagihan + parseInt(tagihan);
      })
      resolve(total_tagihan);
    });
  });
}

module.exports = router;
