const Promise = require('promise');
const utils = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');
const request = require('request');
const Contracts = require('../models/contracts');
const ContractsService = require('../services/contracts');
const CrmAuthService = require('../services/crmAuth');
const PointManagement = require('../services/pointManagement');
const NotificationService = require('../services/notification');
const FCMNotificationService = require("../services/fcmPushNotification");
const CreditApplicationService = require('../services/creditApplication');
const _ = require('lodash');

module.exports = {
    getCustomerMainNo: async function (reqData, headersData) {
        return new Promise(function (resolve, reject) {
            if (reqData.identityNo) {
                console.log("reqData.identityNo", reqData.identityNo)
                try {
                    request({
                        headers: headersData,
                        url: appConstants.creditApplicationBaseUrl + 'cust/main/no?identity_no=' + reqData.identityNo + '&mobile_phone=' + reqData.mobileNo,
                    }, function (err, response, body) {
                        console.log(body);
                        if (err || response.statusCode !== 200) {
                            resolve('NA');
                            //logger.error('Syncing failed:', err);
                            //reject(new Error("Saat ini system sudah tidak bisa diakses, silahkan coba kembali pada jam 06.00-21.00. Terima Kasih"));
                        }
                        let custMainNoData = JSON.parse(body);
                        // if (custMainNoData.custMainNo && custMainNoData.status == "success") {
                        //     resolve(custMainNoData)
                        // }
                        resolve(custMainNoData)
                    });
                } catch (err) {
                    logger.error('Sync Contract API failed:', err);
                    reject(err);
                }
            } else if (reqData.contractNo) {
                try {
                    request({
                        headers: headersData,
                        url: appConstants.creditApplicationBaseUrl + 'cust/main/no/contract?contract_no=' + reqData.contractNo + '&mobile_phone=' + reqData.mobileNo,
                    }, function (err, response, body) {
                        if (err || response.statusCode !== 200) {
                            resolve('NA');
                            //logger.error('Syncing failed:', err);
                            //reject(new Error("Saat ini system sudah tidak bisa diakses, silahkan coba kembali pada jam 06.00-21.00. Terima Kasih"));
                        }
                        let result = JSON.parse(body)
                        resolve(result);
                    });
                } catch (err) {
                    logger.error('Sync Contract API failed:', err);
                    reject(err);
                }
            } else {
                logger.error('Sync Contract Data missing');
                reject('Sync Contract Data missing');
            }
        });
    },
    getContracts: async function (reqData, headersData) {
        return new Promise(function (resolve, reject) {
            try {
                request({
                    headers: headersData,
                    url: appConstants.creditApplicationBaseUrl + 'cust/installments/main/duedate?cust_main_no=' + reqData.custMainNo,
                }, function (err, response, body) {
                    if (err) {
                        logger.error('API failed:', err);
                        reject(err);
                    }
                    let type = reqData.reqType;
                    let filteredContracts = [];
                    try {
                        let contracts = JSON.parse(body);
                        for (let i = 0; i < contracts.length; i++) {
                            let bu = contracts[i]['buss_unit'];
                            contracts[i].faqcategory = "";
                            if (bu == "NMC" || bu == "UMC" || bu == "CMF" || bu == "NEC" ||
                                bu == "REFI" || bu == "UCF" || bu == "UVF" || bu == "O01" ||
                                bu == "O02" || bu == "O05") {
                                contracts[i].faqcategory = "vehicle";
                                filteredContracts.push(contracts[i]);
                            }
                            if (bu == "UFI") {
                                contracts[i].faqcategory = "funds";
                                filteredContracts.push(contracts[i]);
                            }
                            if (bu != "UFI" && bu != "REFI" && bu != "NMC" && bu != "UMC" &&
                                bu != "CMF" && bu != "NEC" && bu != "UCF" && bu != "UVF" &&
                                bu != "O01" && bu != "O02" && bu != "O05") {
                                contracts[i].faqcategory = "electronics";
                                filteredContracts.push(contracts[i]);
                            }
                            // if (type == "vehicle"){
                            //     if (bu == "NMC" || bu == "UMC" || bu == "CMF") {
                            //         contracts[i].faqcategory = "vehicle";
                            //         filteredContracts.push(contracts[i]);
                            //     }
                            // }
                            // else if (type == "funds") {
                            //     if (bu == "UFI" || bu == "REFI") {
                            //         contracts[i].faqcategory = "funds";
                            //         filteredContracts.push(contracts[i]);
                            //     }
                            // }
                            // else if (type == "electronics" || type == "furniture") {
                            //     if (bu != "UFI" && bu != "REFI" && bu != "NMC" && bu != "UMC" && bu != "CMF" ) {
                            //         contracts[i].faqcategory = "electronics";
                            //         filteredContracts.push(contracts[i]);
                            //     }
                            // }
                            // else if (type == ''){
                            //     filteredContracts.push(contracts[i]);
                            // }
                        }
                    } catch (err) {
                        logger.error('API failed Contract Due Date:', err);
                        reject(new Error("Something went wrong"));
                    }
                    resolve(filteredContracts);
                });
            } catch (err) {
                logger.error('API failed Contract Due Date:', err);
                reject(err);
            }
        });
    },
    getContractDetails: async function (reqData, headersData) {
        debugger;
        return new Promise(function (resolve, reject) {
            request({
                headers: headersData,
                url: appConstants.creditApplicationBaseUrl + 'cust/installments/main/dtl?cust_main_no=' + reqData.custMainNo,
            }, function (err, response, body) {
                if (err) {
                    logger.error('API failed:', err);
                    reject(err);
                }
                resolve(body);
            });
        });
    },
    getOrdersForTracking: async function (reqData, headersData) {
        return new Promise(async function (resolve, reject) {
            try {
                request({
                    headers: headersData,
                    url: appConstants.orderTrackingBaseUrl + 'fifapps/v1/tracking/order/nik/?nik=' + reqData.ktpNo + '&phoneNumber=' + reqData.phoneNumber,
                }, async function (err, response, body) {
                    try {
                        if (err) {
                            logger.error('API failed Order Tracking:' + err);
                            reject(err);
                        }
                        let ordersJson = JSON.parse(body);
                        logger.info(ordersJson);
                        let orders = [];
                        if (!ordersJson.error && !ordersJson.errors) {
                            let dataArr = ordersJson['dataList'];
                            let formattedDataArr = [];
                            let currentStatus = "";
                            for (const item of dataArr) {
                                if (item['product_list'] && item['product_list'][0]) {
                                    item['product_name'] = item['product_list'][0]['product'];
                                }
                                for (let j = 0; j < item['status_dtl'].length; j++) {
                                    if (item['status_dtl'][j]['status_time']) {
                                        item['status_dtl'][j]['status_time'] = item['status_dtl'][j]['status_time'].replace(" ", "T");
                                        item['status_dtl'][j]['status_time'] = item['status_dtl'][j]['status_time'].replace(".0", ".000Z");
                                        item['status_dtl'][j]['to_show'] = true;
                                        item['status_dtl'][j]['is_complete'] = true;
                                    }
                                    if (j + 1 == item['status_dtl'].length) {
                                        currentStatus = item['status_dtl'][j]['status'];
                                        item['status'] = currentStatus;
                                    }
                                }
                                if (item['status_dtl'].length == 1) {
                                    if (item['status_dtl'][0]['status'] == "On Progress") {
                                        let approvedStatusObj = {
                                            "seq": "2",
                                            "status": "Approve",
                                            "status_time": "",
                                            "to_show": true,
                                            "is_complete": false
                                        }
                                        let nomorStatusObj = {
                                            "seq": "3",
                                            "status": "Nomor kontrak sudah muncul",
                                            "status_time": "",
                                            "to_show": true,
                                            "is_complete": false
                                        }
                                        item['status_dtl'].push(approvedStatusObj);
                                        item['status_dtl'].push(nomorStatusObj);
                                    }
                                } else if (item['status_dtl'].length == 2) {
                                    if (item['status_dtl'][1]['status'] == "Approve") {
                                        let nomorStatusObj = {
                                            "seq": "3",
                                            "status": "Nomor kontrak sudah muncul",
                                            "status_time": "",
                                            "to_show": true,
                                            "is_complete": false
                                        }
                                        item['status_dtl'].push(nomorStatusObj);
                                    }
                                }
                                if (item['reff_no']) {
                                    let refNoAppl = item['reff_no'];
                                    let data = {
                                        refNo: refNoAppl
                                    }
                                    let creditAppDetails = await CreditApplicationService.findCreditApplicationByReferenceNo(data);
                                    if (creditAppDetails && creditAppDetails[0]) {
                                        let appDetails = creditAppDetails[0];
                                        let newStatusObj = {
                                            "seq": "0",
                                            "status": "New",
                                            "status_time": appDetails['insertdate'],
                                            "to_show": true,
                                            "is_complete": true
                                        }
                                        // item['status_dtl'].unshift(newStatusObj);
                                    }
                                } else {
                                    let newStatusObj = {
                                        "seq": "0",
                                        "status": "New",
                                        "status_time": "",
                                        "to_show": false,
                                        "is_complete": false
                                    }
                                    // item['status_dtl'].unshift(newStatusObj);
                                }
                                formattedDataArr.push(item);
                            }
                            resolve(formattedDataArr);
                        } else {
                            let err = ordersJson.error || ordersJson.errors || "Error";
                            logger.error('API failed Order Tracking:' + err);
                            reject(err)
                        }
                    } catch (err) {
                        logger.error('API failed Order Tracking:' + err);
                        reject(err);
                    }
                });
            } catch (err) {
                logger.error('API failed Order Tracking:' + err);
                reject(err);
            }
        });
    },
    addSyncContractHistory: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            let date = utils.getTimestamp();
            data.loginId = payload.loginId;
            data.ktpNo = payload.ktpNo;
            data.contractNo = payload.contractNo;
            data.insertdate = date;
            Contracts.addHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getSyncContractsHistory: async function (data) {
        return new Promise(function (resolve, reject) {
            Contracts.getSyncContractsHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getLastSyncContractsHistory: async function (data) {
        return new Promise(function (resolve, reject) {
            Contracts.getLastSyncContractsHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    installmentPaymentTestScheduler: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                logger.info("Installment Test Payment scheduler running ...");
                let loginData = await CrmAuthService.getCRMAuthToken();
                let accessToken = loginData.accessToken;
                let headersObj = {
                    "Authorization": "bearer " + accessToken,
                    "Content-Type": "application/json"
                }
                let users = await Contracts.getSyncedCustomers();
                let validUsers = [];
                users.forEach(function (user) {
                    if (user.custmainno) {
                        validUsers.push(user);
                    }
                });
                const chunks = _.chunk(validUsers, 50);
                try {
                    let offset = 0;
                    chunks.forEach(function (userArr) {
                        setTimeout(async function () {
                            for (let k = 0; k < userArr.length; k++) {
                                try {
                                    let formReqData = {
                                        custMainNo: userArr[k].custmainno
                                    }
                                    let contractDetails = await getContractDetails(formReqData, headersObj);
                                    if (contractDetails) {
                                        let contractArr = JSON.parse(contractDetails);
                                        contractArr.forEach(async function (cont) {
                                            let dueDate;
                                            let paidDate;
                                            if (cont['due_date'] && new Date(cont['due_date']) && cont['paid_date'] && new Date(cont['paid_date'])) {
                                                let dueDateMonth = new Date(cont['due_date']).getMonth() + 1;
                                                let currentMonth = new Date().getMonth() + 1;
                                                let dueDateYear = new Date(cont['due_date']).getFullYear();
                                                let currentYear = new Date().getFullYear();
                                                dueDate = new Date(cont['due_date']).getTime();
                                                paidDate = new Date(cont['paid_date']).getTime();
                                                if (paidDate <= dueDate && dueDateMonth == currentMonth && dueDateYear == currentYear) {
                                                    let getData = {
                                                        loginid: userArr[k].loginid,
                                                        contractno: cont.contract_no,
                                                        duedate: utils.getTimestamp(cont.due_date),
                                                        paiddate: cont.paid_date,
                                                        insertdate: utils.getTimestamp()
                                                    }
                                                    let addData = {
                                                        loginid: userArr[k].loginid,
                                                        contractno: cont.contract_no,
                                                        duedate: cont.due_date,
                                                        paiddate: cont.paid_date,
                                                        insertdate: utils.getTimestamp()
                                                    }
                                                    try {
                                                        let recordExists = await Contracts.checkIfPointsCreditedForInstallmentOnTime(addData);
                                                        if (recordExists && recordExists.length == 0) {
                                                            let pointsData = {
                                                                loginid: userArr[k].loginid,
                                                                activityappid: 'INSTALLMENT PAYMENT',
                                                                description: 'Installment paid on time'
                                                            }
                                                            logger.info('Add Contract Points for: ' + userArr[k].loginid);
                                                            let pointsAdded = await PointManagement.addPointsForActivity(pointsData);
                                                            if (pointsAdded) {
                                                                await Contracts.addInstallmentsPointsData(addData);
                                                            }
                                                        }
                                                    } catch (err) {
                                                        logger.info(err);
                                                        reject(new Error(err));
                                                    }
                                                }
                                            }
                                        })
                                    }
                                } catch (err) {
                                    reject(new Error(err));
                                }
                            }
                        }, 1500 + offset);
                        offset += 1500;
                    });
                } catch (err) {
                    reject(new Error(err));
                }
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
    },
    installmentPaymentScheduler: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                logger.info("Installment Payment scheduler running ...");
                let users = await Contracts.getSyncedCustomers();
                let validUsers = [];
                users.forEach(function (user) {
                    if (user.custmainno) {
                        validUsers.push(user);
                    }
                });
                try {
                    let loginData = await CrmAuthService.getCRMAuthToken();
                    let accessToken = loginData.accessToken;
                    let headersObj = {
                        "Authorization": "bearer " + accessToken,
                        "Content-Type": "application/json"
                    }
                    validUsers.forEach(async function (user) {
                        try {
                            let formReqData = {
                                custMainNo: user.custmainno
                            }
                            let contractDetails = await getContractDetails(formReqData, headersObj);
                            if (contractDetails) {
                                let contractArr = JSON.parse(contractDetails);
                                contractArr.forEach(async function (cont) {
                                    let dueDate;
                                    let paidDate;
                                    if (cont['due_date'] && new Date(cont['due_date']) && cont['paid_date'] && new Date(cont['paid_date'])) {
                                        let dueDateMonth = new Date(cont['due_date']).getMonth() + 1;
                                        let currentMonth = new Date().getMonth() + 1;
                                        let dueDateYear = new Date(cont['due_date']).getFullYear();
                                        let currentYear = new Date().getFullYear();
                                        dueDate = new Date(cont['due_date']).getTime();
                                        paidDate = new Date(cont['paid_date']).getTime();
                                        if (paidDate <= dueDate && dueDateMonth == currentMonth && dueDateYear == currentYear) {
                                            let getData = {
                                                loginid: user.loginid,
                                                contractno: cont.contract_no,
                                                duedate: utils.getTimestamp(cont.due_date),
                                                paiddate: cont.paid_date,
                                                insertdate: utils.getTimestamp()
                                            }
                                            let addData = {
                                                loginid: user.loginid,
                                                contractno: cont.contract_no,
                                                duedate: cont.due_date,
                                                paiddate: cont.paid_date,
                                                insertdate: utils.getTimestamp()
                                            }
                                            try {
                                                let recordExists = await Contracts.checkIfPointsCreditedForInstallmentOnTime(addData);
                                                if (recordExists && recordExists.length == 0) {
                                                    let pointsData = {
                                                        loginid: user.loginid,
                                                        activityappid: 'INSTALLMENT PAYMENT',
                                                        description: 'Installment paid on time'
                                                    }
                                                    let pointsAdded = await PointManagement.addPointsForActivity(pointsData);
                                                    if (pointsAdded) {
                                                        await Contracts.addInstallmentsPointsData(addData);
                                                    }
                                                }
                                            } catch (err) {
                                                console.log(err);
                                            }
                                        }
                                    }
                                })
                            }
                        } catch (err) {
                            return reject(new Error(err));
                        }
                    })
                } catch (err) {
                    return reject(new Error(err));
                }
                resolve(true);
            } catch (err) {
                return reject(err);
            }
        });
    },
    addInstallmentsPointsData: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {
                contractno: payload.contractNo,
                loginid: payload.loginId,
                custno: payload.custNo,
                installmentno: payload.installmentNo,
                seqNo: payload.seqNo,
                paiddate: payload.paidDate,
                totalcustpaid: payload.totalCustPaid,
                paidstatus: payload.paidStatus,
                pointeligible: payload.pointEligible,
                insertdate: utils.getTimestamp()
            };
            Contracts.addInstallmentsPointsData(data)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
    checkIfPointsCreditedForInstallmentOnTime: async function (data) {
        return new Promise(function (resolve, reject) {
            Contracts.checkIfPointsCreditedForInstallmentOnTime(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getDuplicateInstallmentsPointsData: async function (data) {
        return new Promise(function (resolve, reject) {
            Contracts.getSyncContractsHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getInstallmentsPointsData: async function (data) {
        return new Promise(function (resolve, reject) {
            Contracts.getSyncContractsHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    installmentPaymentReminderTestScheduler: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                logger.info("Installment Payment Reminder test scheduler running ...");
                let users = await Contracts.getSyncedCustomers();
                let validUsers = [];
                let loginData = await CrmAuthService.getCRMAuthToken();
                let accessToken = loginData.accessToken;
                let headersObj = {
                    "Authorization": "bearer " + accessToken,
                    "Content-Type": "application/json"
                }
                users.forEach(function (user) {
                    if (user.custmainno) {
                        validUsers.push(user);
                    }
                });
                const chunks = _.chunk(validUsers, 50);
                try {
                    let offset = 0;
                    chunks.forEach(function (userArr) {
                        setTimeout(async function () {
                            for (let k = 0; k < userArr.length; k++) {
                                try {
                                    let formReqData = {
                                        custMainNo: userArr[k].custmainno
                                    }
                                    let allContracts = await getAllContracts(formReqData, headersObj);
                                    console.log(allContracts)
                                    let allContractsArr = [];
                                    let contractDetails = await getContractDetails(formReqData, headersObj);
                                    // console.log(contractDetails)
                                    let contractArr = [];
                                    if (allContracts) {
                                        allContractsArr = JSON.parse(allContracts);
                                    }
                                    if (contractDetails) {
                                        contractArr = JSON.parse(contractDetails);
                                    }
                                    var singleFlag = false;
                                    var beforeflag = false;
                                    var afterflag = false;
                                    allContractsArr.forEach(async function (contract) {

                                        if (contract['contract_status'] == 'AC' || contract['contract_status'] == 'PP' || contract['contract_status'] == 'WO') {
                                            let contractNo = contract.contract_no;
                                            let nextInstNo = contract.next_inst_no;
                                            if (contract['next_due_date'] && new Date(contract['next_due_date'])) {
                                                let nextDueDate = new Date(contract['next_due_date']);
                                                let currentDate = new Date();
                                                var diff = 0;
                                                diff = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / 86400000);
                                                let toSendReminder = false;
                                                let instNoArr = [];
                                                if (nextInstNo > '0') {
                                                    toSendReminder = true;
                                                } else {
                                                   
                                                    contractArr.forEach(async function (detail) {
                                                        if (contract.contract_no == detail.contract_no) {
                                                            instNoArr.push(detail.inst_no);
                                                        }
                                                       
                                                    })
                                                    if (instNoArr.length > 0) {
                                                        let maxInstNo = Math.max.apply(Math, instNoArr);
                                                        if (nextInstNo > maxInstNo) {
                                                            toSendReminder = true;
                                                        }
                                                    }
                                                }
                                                if (toSendReminder) {
                                                    logger.info("\n\n sending installment reminder .. \n\n");
                                                    let notificationData = {}
                                                    if (currentDate.getTime() <= nextDueDate.getTime() && diff <= 7) {
                                                        notificationData = {
                                                            type: 'INSTALLMENT_PAYMENT_REMINDER_BEFORE',
                                                            refid: new Date().getTime(),
                                                            itemDays: diff
                                                        }
                                                        // beforeflag = true;
                                                    } else if (nextDueDate.getTime() < currentDate.getTime()) {
                                                        notificationData = {
                                                            type: 'INSTALLMENT_PAYMENT_REMINDER_AFTER',
                                                            refid: new Date().getTime(),
                                                            itemDays: diff
                                                        }
                                                        // afterflag = true;
                                                    }


                                                    if (contract['overdue'] == 0 && beforeflag == false && diff <= 7) {
                                                        NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                                        beforeflag = true;
                                                    } else if (contract['overdue'] != 0 && afterflag == false) {
                                                        NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                                        afterflag = true;
                                                    }

                                                }
                                            }
                                        }
                                    })
                                } catch (err) { //till
                                    reject(new Error(err));
                                }
                            }
                        }, 1500 + offset);
                        offset += 1500;
                    });
                } catch (err) {
                    reject(new Error(err));
                }
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
    },
    installmentPaymentReminderScheduler: async function (payload) {
        return new Promise(async function (resolve, reject) {
            debugger;
            try {
                logger.info("Installment Payment Reminder scheduler running ...");
                let users = await Contracts.getSyncedCustomers();
                let validUsers = [];
                let loginData = await CrmAuthService.getCRMAuthToken();
                let accessToken = loginData.accessToken;
                let headersObj = {
                    "Authorization": "bearer " + accessToken,
                    "Content-Type": "application/json"
                }
                users.forEach(function (user) {
                    if (user.custmainno) {
                        validUsers.push(user);
                    }
                });
                try {
                    validUsers.forEach(async function (user) {
                        try {
                            let formReqData = {
                                custMainNo: user.custmainno
                            }
                            let allContracts = await getAllContracts(formReqData, headersObj);
                            // console.log(allContracts);
                            let allContractsArr = [];
                            let contractDetails = await getContractDetails(formReqData, headersObj);
                            // console.log(contractDetails);
                            let contractArr = [];
                            if (allContracts) {
                                allContractsArr = JSON.parse(allContracts);
                            }
                            if (contractDetails) {
                                contractArr = JSON.parse(contractDetails);
                            }

                            allContractsArr.forEach(async function (contract) {
                                if (contract['contract_status'] == 'AC' || contract['contract_status'] == 'PP' || contract['contract_status'] == 'WO') {
                                    let contractNo = contract.contract_no;
                                    let nextInstNo = contract.next_inst_no;
                                    if (contract['next_due_date'] && new Date(contract['next_due_date'])) {
                                        let nextDueDate = new Date(contract['next_due_date']);
                                        let currentDate = new Date();
                                        var diff = 0;
                                        diff = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / 86400000);
                                        let toSendReminder = false;
                                        let instNoArr = [];
                                        contractArr.forEach(async function (detail) {
                                            if (contract.contract_no == detail.contract_no) {
                                                instNoArr.push(detail.inst_no);
                                            }
                                        })
                                        if (instNoArr.length > 0) {
                                            let maxInstNo = Math.max.apply(Math, instNoArr);
                                            if (nextInstNo > maxInstNo) {
                                                toSendReminder = true;
                                            }
                                        }
                                        if (toSendReminder) {
                                            logger.info("\n\n sending installment reminder .. \n\n");
                                            let notificationData = {}
                                            if (currentDate.getTime() <= nextDueDate.getTime() && diff <= 7) {
                                                notificationData = {
                                                    type: 'INSTALLMENT_PAYMENT_REMINDER_BEFORE',
                                                    refid: new Date().getTime(),
                                                    itemDays: diff
                                                }
                                            } else if (nextDueDate.getTime() < currentDate.getTime()) {
                                                notificationData = {
                                                    type: 'INSTALLMENT_PAYMENT_REMINDER_AFTER',
                                                    refid: new Date().getTime(),
                                                    itemDays: diff
                                                }
                                            }
                                            NotificationService.sendNotification(notificationData, user, false, true, false);
                                        }
                                    }
                                }
                            })
                        } catch (err) {
                            reject(new Error(err));
                        }
                    })
                } catch (err) {
                    reject(new Error(err));
                }
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
    }
}
async function getAllContracts(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.creditApplicationBaseUrl + 'cust/installments/main/duedate?cust_main_no=' + reqData.custMainNo,
            }, function (err, response, body) {
                if (err) {
                    logger.info('API failed Installments due date:', err);
                    reject(err);
                }
                logger.info('API successful Installments due date');
                resolve(body);
            });
        } catch (err) {
            logger.info('API failed Installments due date:', err);
            reject(err);
        }
    });
}
async function getContractDetails(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.creditApplicationBaseUrl + 'cust/installments/main/dtl?cust_main_no=' + reqData.custMainNo,
            }, function (err, response, body) {
                if (err) {
                    logger.info('API failed Installments Details:', err);
                    return reject(err);
                }
                logger.info('API successful for Installments Details');
                resolve(body);
            });
        } catch (err) {
            logger.info('API failed Installments Details:', err);
            reject(err);
        }
    });
}