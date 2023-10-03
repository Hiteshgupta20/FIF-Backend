var express = require('express');
var router = express.Router();
var basePath = '/';
var AppsCenter = require('../models/appsCenter');
var Categories = require('../models/appCategories');
var Notification = require('../models/notification');
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const PointService = require('../services/pointHistory');
const FGC = require('../models/fgcMemeber');
const UserModel = require('../models/user');
const FGCContent = require('../services/fgc');
const ContractsService = require('../services/contracts');
const appConstants = require('../config/appConstants');
const crmAuthService = require('../services/crmAuth');
const FgcService = require('../services/fgcMember');
const request = require('request');
const activityLogs = require('../services/activityLogs');
const UsersService = require('../services/user');
const fgcMember = require('../services/fgcMember');
const AstraPayService = require('../services/astraPay');

router.get('/getHomeScreenData/:userId', auth.isAuthenticated, async (req, res) => {
    var currentAppVersion = req.headers['appversion'];
    var platform = req.headers['platform'] || '';
    debugger;
    try {
        var homeScreenData = {
            notificationCount: 0,
            astraPaystatus: 0,
            astraPayBalance: 0,
            totalPoints: 0,
            isMember: 0,
            qrCode: "",
            remainingMonthInstallments: 0,
            totalMonthInstallments: 0,
            appsCenter: [],
            memberInfo: null,
            astraPayMobileNo: "",
            custMainNo: "",
            lastSyncDate: null,
            isUpdateAvailable: false,
            isForceUpdate: false
        };
        let fgcSetting = await FGCContent.getFGCSetting();
        homeScreenData.isCheckBalanceAllowed = JSON.parse(fgcSetting.value) || false;
        let userId = req.params.userId;
        let data = {
            loginId: userId
        }
        if (userId) {
            if (currentAppVersion) {
                let latestVersion = '';
                if (platform == 'Android') {
                    latestVersion = appConstants.latestAndroidVersion;
                } else if (platform == 'iOS') {
                    latestVersion = appConstants.latestIosVersion;
                }
                if (latestVersion != currentAppVersion) {
                    homeScreenData.isUpdateAvailable = true;
                    homeScreenData.isForceUpdate = false;
                } else {
                    homeScreenData.isUpdateAvailable = false;
                    homeScreenData.isForceUpdate = false;
                }
                let appUpdateData = {
                    loginId: userId,
                    appVersion: currentAppVersion
                }
                if (userId) {
                    try {
                        await UsersService.updateAppVersion(appUpdateData);
                    }
                    catch (err) {
                        logger.error('Error updating app version' + err);
                    }
                }
            }


            let result = await Notification.getUnreadNotificationCountByUserId(userId);
            homeScreenData.notificationCount = parseInt(result.count);
            // let memberInfo = await FGC.getMemberInfo(userId);


            // if(memberInfo){
            //     homeScreenData.isMember = parseInt(memberInfo.status);
            // }
            // if(memberInfo && memberInfo.member_info && memberInfo.member_info.custNo){
            //     homeScreenData.memberInfo = memberInfo.member_info;
            //     if(!memberInfo.qrcode){
            //         let qrData = {
            //             loginId : userId,
            //             data : [memberInfo.member_info]
            //         }
            //         FgcService.generateQRcode(qrData);
            //     }
            //     else{
            //         homeScreenData.qrCode = memberInfo.qrcode;
            //     }
            // }
            let userData = await UserModel.findUserByLoginId(userId);
            if (userData) {
                homeScreenData.custMainNo = userData["custmainno"] || "";
                homeScreenData.ktpNo = userData["ktp_no"] || "";
                homeScreenData.totalMonthInstallments = userData["custtotalinstallments"] || 0;
                homeScreenData.totalMonthInstallmentsDate = userData["custtotalinstallmentsdatetime"] || null;
            }
            //adding value of Remaining Installment for Month and Total Installments this month
            if (homeScreenData.custMainNo) {
                homeScreenData.userId = userId;
                homeScreenData = await updateInstallmentData(homeScreenData);
                let memberInfo = await fgcMember.getCustomerFGCInfo(homeScreenData);
                console.log(memberInfo);
                if (memberInfo && memberInfo['success']) {
                    homeScreenData.memberInfo = memberInfo;
                    let memberObj = {
                        loginId: userId,
                        memberInfo: memberInfo,
                        custNo: memberInfo.custNo,
                        idNo: homeScreenData.ktpNo
                    }
                    await fgcMember.updateUserFGCDetails(memberObj);
                }

            }

        }
        let userPoints = await PointService.getUserPoints(data);
        let astraPayReq = {
            loginId: userId
        }
        let astraPayData = await AstraPayService.getAstraPayDetails(astraPayReq);
        if (astraPayData.length != 0) {
            let userAstraPayData = astraPayData[0];
            homeScreenData.astraPaystatus = userAstraPayData.status;
            homeScreenData.astraPayBalance = userAstraPayData.balance;
            homeScreenData.astraPayMobileNo = userAstraPayData.astrapaymobileno;
        }

        if (userPoints) {
            if (userPoints.cur_bal) {
                homeScreenData.totalPoints = parseInt(userPoints.cur_bal);
            }
            if (userPoints.exp_date) {
                homeScreenData.expiryDate = util.formatTimeStamp(userPoints.exp_date);
            }
        }
        let syncContractDetailData = {
            loginId: userId
        }
        let syncContractDetails = await ContractsService.getLastSyncContractsHistory(syncContractDetailData);
        if (syncContractDetails && syncContractDetails.length > 0) {
            homeScreenData.lastSyncDate = util.formatTimeStamp(syncContractDetails[0].insertdate);
        }

        // res.json(util.success(homeScreenData));
        getAppsCenterData(homeScreenData, req, res, async function (err, appsCenterData) {
            try {
                if (err) {
                    res.json(util.failed(err));
                    return;
                }


                if (appsCenterData) {
                    homeScreenData.appsCenter = appsCenterData;
                    try {
                        let activityData = util.prepareActivityLogsData(userId, 'Viewed home screen', 'Viewed home screen');
                        let actLoginId = await activityLogs.createActivityLog(activityData);
                        if (actLoginId) {
                            res.json(util.success(homeScreenData));
                        }
                        else {
                            res.json(util.failed('User does not exist.'));
                        }
                    } catch (err) {
                        res.json(util.failed(err));
                    }
                }
                else {
                    // res.json(util.success(homeScreenData));
                    return res.json(util.failed(null, null));
                }
            }
            catch (err) {
                res.json(util.failed(err));
            }

        });
    }
    catch (err) {
        res.json(util.failed(err));
    }
});

function getCategoryObj(category, request, response, cb) {
    var query = { "categoryName": category.categoryName };

    Categories.findOne(query, {}).exec(function (err, result) {
        if (!err) {
            cb(null, result);
        } else {
            return false;
        }
    });
}

function getAppsCenterData(comment, request, response, cb) {
    let platform = request.headers.platform;
    if (platform) {
        var category = {
            categoryName: platform
        };
        getCategoryObj(category, request, response, function (err, categoryObj) {
            if (err) {
                return false;
            }
            if (categoryObj) {
                var query = { "status": 1, "sequenceNo": { $exists: true, $ne: null } };
                AppsCenter.find(query)
                    .sort({ "sequenceNo": 1 })
                    .populate({ path: 'category', select: 'categoryName' })
                    .exec(function (err, result) {
                        if (!err) {
                            let appCenterData = [];

                            if (result) {
                                for (let i = 0; i < result.length; i++) {
                                    if ((result[i]['category'] && result[i]['category']._id && (result[i]['category']._id).toString() == (categoryObj._id).toString()) || result[i]['subCategories'].indexOf(categoryObj._id) != -1) {
                                        appCenterData.push(result[i]);
                                    }
                                }
                            }

                            cb(null, appCenterData);
                        } else {
                            return false;
                        }
                    });
            }
            else {
                return response.json(util.failed(null, "No Apps found"));
            }
        });
    }
    else {
        var query = {};
        AppsCenter.find(query)
            .sort({ "sequenceNo": 1 })
            .populate({ path: 'category', select: 'categoryName' })
            .exec(function (err, result) {
                if (!err) {
                    cb(null, result);
                } else {
                    return false;
                }
            });
    }
}

async function updateInstallmentData(data) {
    return new Promise(async function (resolve, reject) {
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
            let historyData = {
                loginId: parseInt(data.userId)
            }
            let total = 0;
            let customerContractData = await ContractsService.getContractDetails(payload, headersObj);

            try {
                let obj = await getContracts(payload);
                //if (data.totalMonthInstallmentsDate && new Date(data.totalMonthInstallmentsDate && obj.totalMonthlyInstallments)) {
                if (new Date(data.totalMonthInstallmentsDate) && obj.totalMonthlyInstallments >= 0) {

                    let currMonth = new Date().getTime();
                    let resMonth = new Date(data.totalMonthInstallmentsDate).getTime();
                    if (resMonth <= currMonth) {
                        let installmentData = {
                            loginId: data.userId,
                            custTotalInstallments: obj.totalMonthlyInstallments
                        }
                        await UsersService.updateCustTotalInstallments(installmentData);
                        data.totalMonthInstallments = obj.totalMonthlyInstallments || 0;
                    }
                }
                //data.totalMonthInstallments = obj.totalMonthlyInstallments;
                data.remainingMonthInstallments = obj.remainingMonthlyInstallments || 0;

                resolve(data);
            }
            catch (err) {
                resolve(data);
            }
        }
        catch (err) {
            logger.error(err);
            resolve(data);
        }
    });


}

function getContracts(payload) {
    return new Promise(function (resolve, reject) {
        let headersObj = {
            "Authorization": "bearer " + payload.accessToken,
            "Content-Type": "application/json"
        }
        request({
            headers: headersObj,
            url: appConstants.creditApplicationBaseUrl + 'cust/installments/main/duedate?cust_main_no=' + payload.custMainNo,
        }, function (err, response, body) {
            if (err) {
                console.error('API failed:', err);
                reject(0);
            }

            let total_tagihan = 0;
            let coll_fee = 0;
            let penalty = 0;
            let final_Val = 0;
            let remainingMonthlyInstallments = 0;
            let totalangsuran = 0;

            let currentContracts = [];
            if (body) {
                try {
                    let contracts = JSON.parse(body);
                    if (contracts && contracts.length && contracts.length > 0) {
                        contracts.forEach((contract) => {
                            let tagihan = contract.total_tagihan.replace(/,/g, '').trim() || 0;
                            coll_fee = contract.coll_fee.replace(/,/g, '').trim() || 0;
                            penalty = contract.penalty.replace(/,/g, '').trim() || 0;
                            totalangsuran = contract.total_angsuran.replace(/,/g, '').trim() || 0;
                            let status = contract['contract_status'];
                            //total_tagihan = total_tagihan + parseInt(tagihan); 
                            // STATUS PT = CL , JADI HARUSNYA GAK MUNCUL DAN SISA TAGIHAN BULAN INI DAN TOTAL TAGIHAN BULAN INI 0
                            if (status != 'PT') {

                                total_tagihan = total_tagihan + parseInt(tagihan);
                            }
                            if (status == 'AC' || status == 'PP' || status == 'RP' || status == 'WO') {
                                final_Val = parseInt(coll_fee) + parseInt(penalty) + parseInt(totalangsuran);
                                remainingMonthlyInstallments += parseInt(final_Val);
                            }
                        })
                    }
                    else {
                        total_tagihan = null;
                        remainingMonthlyInstallments = null;
                    }

                }
                catch (err) {
                    logger.error(err);
                    resolve({});
                }

            }
            else {
                total_tagihan = null;
                remainingMonthlyInstallments = null;
            }
            resolve({ totalMonthlyInstallments: total_tagihan, remainingMonthlyInstallments: remainingMonthlyInstallments });
        });
    });
}

module.exports = router;
