const Promise = require('promise');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');
const request = require('request');
const Contracts = require('../models/contracts');
const ContractsService = require('../services/contracts');
const CrmAuthService = require('../services/crmAuth');
const NotificationService = require('../services/notification');
const FCMNotificationService = require("../services/fcmPushNotification");
const eContract = require("../models/eContract");

const _ = require('lodash');
module.exports.eContractReminder = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            logger.info("-------E Contract Scheduler running ----------");

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
                                let allContractArray = []
                                if (allContracts) {
                                    allContractArray = JSON.parse(allContracts);
                                }
                                let toSendReminder = false;

                                allContractArray.forEach(async (allContractsData) => {
                                    if (allContractsData['contract_status'] == "AC" && allContractsData['buss_unit'] == 'NMC') {
                                        let contractActiveDate = new Date(allContractsData.contract_active_date);
                                        const currentDate = new Date();

                                        if (allContractsData['contract_active_date'] && contractActiveDate) {
                                            var diff = 0;
                                            diff = Math.ceil((contractActiveDate.getTime() - currentDate.getTime()) / 86400000);
                                            if (Math.abs(diff) >= 4 && Math.abs(diff) <= 7) {
                                                var url = allContractsData['contract_url'];
                                                var path = url.split("uuid=");
                                                if (allContractsData['contract_url'] !== null && path[1] !== 'null') {
                                                    let notificationFlag = await eContract.getNotificationFlag(allContractsData)
                                                    if (notificationFlag != 1) {
                                                        toSendReminder = true;
                                                    } else {
                                                        resolve(true)
                                                    }
                                                }
                                            }
                                        }
                                        if (toSendReminder) {
                                            logger.info("\n\n Sending E-Contract Reminder .. \n\n");

                                            let notificationData = {
                                                type: 'E_CONTRACT_REMINDER',
                                                refid: new Date().getTime(),
                                                contract_url: allContractsData['contract_url'],
                                                contract_No: allContractsData['contract_no'],
                                                flag: 1

                                            }
                                            await NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                        }
                                    }
                                    else if (allContractsData['contract_status'] == "AC" && allContractsData['buss_unit'] == 'MPF') {
                                        let contractActiveDate = new Date(allContractsData.contract_active_date);
                                        const currentDate = new Date();

                                        if (allContractsData['contract_active_date'] && contractActiveDate) {
                                            var diff = 0;
                                            diff = Math.ceil((contractActiveDate.getTime() - currentDate.getTime()) / 86400000);
                                            if (Math.abs(diff) >= 4 && Math.abs(diff) <= 7) {
                                                var url = allContractsData['contract_url'];
                                                var path = url.split("uuid=");
                                                if (allContractsData['contract_url'] !== null && path[1] !== 'null') {
                                                    let notificationFlag = await eContract.getNotificationFlag(allContractsData)
                                                    if (notificationFlag != 1) {
                                                        toSendReminder = true;
                                                    } else {
                                                        resolve(true)
                                                    }
                                                }
                                            }
                                        }
                                        if (toSendReminder) {
                                            logger.info("\n\n Sending E-Contract Reminder .. \n\n");

                                            let notificationData = {
                                                type: 'E_CONTRACT_REMINDER',
                                                refid: new Date().getTime(),
                                                contract_url: allContractsData['contract_url'],
                                                contract_No: allContractsData['contract_no'],
                                                flag: 1

                                            }
                                            await NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                        }
                                    }
                                    else if (allContractsData['contract_status'] == "AC" && allContractsData['buss_unit'] == 'UFI') {
                                        let contractActiveDate = new Date(allContractsData.contract_active_date);
                                        const currentDate = new Date();

                                        if (allContractsData['contract_active_date'] && contractActiveDate) {
                                            var diff = 0;
                                            diff = Math.ceil((contractActiveDate.getTime() - currentDate.getTime()) / 86400000);
                                            if (Math.abs(diff) >= 4 && Math.abs(diff) <= 7) {
                                                var url = allContractsData['contract_url'];
                                                var path = url.split("uuid=");
                                                if (allContractsData['contract_url'] !== null && path[1] !== 'null') {
                                                    let notificationFlag = await eContract.getNotificationFlag(allContractsData)
                                                    if (notificationFlag != 1) {
                                                        toSendReminder = true;
                                                    } else {
                                                        resolve(true)
                                                    }
                                                }
                                            }
                                        }
                                        if (toSendReminder) {
                                            logger.info("\n\n Sending E-Contract Reminder .. \n\n");

                                            let notificationData = {
                                                type: 'E_CONTRACT_REMINDER',
                                                refid: new Date().getTime(),
                                                contract_url: allContractsData['contract_url'],
                                                contract_No: allContractsData['contract_no'],
                                                flag:1

                                            }
                                            await NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                        }
                                    }
                                    else if (allContractsData['contract_status'] == "AC" && allContractsData['buss_unit'] == 'MMU') {
                                        let contractActiveDate = new Date(allContractsData.contract_active_date);
                                        const currentDate = new Date();

                                        if (allContractsData['contract_active_date'] && contractActiveDate) {
                                            var diff = 0;
                                            diff = Math.ceil((contractActiveDate.getTime() - currentDate.getTime()) / 86400000);
                                            if (Math.abs(diff) >= 4 && Math.abs(diff) <= 7) {
                                                var url = allContractsData['contract_url'];
                                                var path = url.split("uuid=");
                                                if (allContractsData['contract_url'] !== null && path[1] !== 'null') {
                                                    let notificationFlag = await eContract.getNotificationFlag(allContractsData)
                                                    if (notificationFlag != 1) {
                                                        toSendReminder = true;
                                                    } else {
                                                        resolve(true)
                                                    }
                                                }
                                            }
                                        }
                                        if (toSendReminder) {
                                            logger.info("\n\n Sending E-Contract Reminder .. \n\n");

                                            let notificationData = {
                                                type: 'E_CONTRACT_REMINDER',
                                                refid: new Date().getTime(),
                                                contract_url: allContractsData['contract_url'],
                                                contract_No: allContractsData['contract_no'],
                                                flag:1

                                            }
                                            await NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                        }
                                    }
                                    else if (allContractsData['contract_status'] == "AC" && allContractsData['buss_unit'] == 'REFI') {
                                        let contractActiveDate = new Date(allContractsData.contract_active_date);
                                        const currentDate = new Date();

                                        if (allContractsData['contract_active_date'] && contractActiveDate) {
                                            var diff = 0;
                                            diff = Math.ceil((contractActiveDate.getTime() - currentDate.getTime()) / 86400000);
                                            if (Math.abs(diff) >= 4 && Math.abs(diff) <= 7) {
                                                var url = allContractsData['contract_url'];
                                                var path = url.split("uuid=");
                                                if (allContractsData['contract_url'] !== null && path[1] !== 'null') {
                                                    let notificationFlag = await eContract.getNotificationFlag(allContractsData)
                                                    if (notificationFlag != 1) {
                                                        toSendReminder = true;
                                                    } else {
                                                        resolve(true)
                                                    }
                                                }
                                            }
                                        }
                                        if (toSendReminder) {
                                            logger.info("\n\n Sending E-Contract Reminder .. \n\n");

                                            let notificationData = {
                                                type: 'E_CONTRACT_REMINDER',
                                                refid: new Date().getTime(),
                                                contract_url: allContractsData['contract_url'],
                                                contract_No: allContractsData['contract_no'],
                                                flag:1

                                            }
                                            await NotificationService.sendNotification(notificationData, userArr[k], false, true, false);
                                        }
                                    }

                                })
                                resolve(true)
                            } catch {
                                reject();
                            }
                        }

                    }, 1500 + offset);
                    offset += 1500;
                })
            } catch {
                reject();
            }
            resolve(true)
        } catch {
            console.log()
        }
    })

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