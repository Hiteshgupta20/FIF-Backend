const Promise = require('promise');
const History = require('../models/pointHistory');
const ProductCatalogue = require('../services/productCatalogue');
const util = require('../controllers/util');
const ActivityLogs = require('./activityLogs');
const StatusMaster = require('../models/statusMaster');
const notification = require('../services/notification');
const userService = require('../services/user');
const logger = require('../config/logging');
module.exports = {

    getAllWalletInfo: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.isExport = payload.isExport || 0;

            data.orderByClause = util.formatOrderByClause(payload, 't2.');

            data.limit = payload.limit || 10;
            if (payload.page) {
                data.offset = payload.page || 0;
            }
            else {
                data.offset = (payload.offset - 1) * payload.limit || 0;
            }


            if (data.offset < 0) {
                data.offset = 0;
            }

            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`t1.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`t1.msisdn ilike '%${searchParams.msisdn}%'`)
                }
                if (searchParams.year) {
                    whereClause.push(`t2.budget_year=(COALESCE('${searchParams.year}',null))`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                History.getAllRecords(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                History.getExportRecords(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    getAllWalletInfoCount: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.isExport = payload.isExport || 0;

            data.orderByClause = util.formatOrderByClause(payload, 't2.');

            data.limit = payload.limit || 10;
            data.offset = (payload.offset - 1) * payload.limit || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`t1.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`t1.msisdn ilike '%${searchParams.msisdn}%'`)
                }
                if (searchParams.year) {
                    whereClause.push(`t2.budget_year=(COALESCE('${searchParams.year}',null))`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            History.getPointHistoryCount(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });

        });
    },


    getDetailWalletInfo: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.offset - 1) * payload.limit || 0;
            // data.offset = payload.offset || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            data.loginId = payload.loginId;

            History.getDetailHistory(data)
                .then(function (result) {
                    if (result['data']) {
                        for (let i = 0; i < result['data'].length; i++) {
                            if (result['data'][i]['product_id'] != 0 && result['data'][i]['activitydesc'] == "Cancelled") {
                                result['data'][i]['type'] = "CR";
                                result['data'][i]['description'] = "Redemption request cancelled";
                            }
                            else if (result['data'][i]['product_id'] != 0 && result['data'][i]['activitydesc'] == "Completed") {
                                result['data'].splice(i, 1);
                                if (result['totalRecords']) {
                                    result['totalRecords'] = result['totalRecords'] - 1;
                                }

                            }

                            result['data'][i]['insertdate'] = util.formatTimeStamp(result['data'][i]['insertdate']);
                        }
                    }
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    addPointsHistory: async function (data) {
        return new Promise(function (resolve, reject) {
            data.sourceApp = data.sourceApp || 'FMC';
            History.addPoints(data)
                .then(async function (result) {
                    if (result[0]) {
                        debugger;
                        let record = {
                            status: data.status,
                            userid: data.loginId,
                            id: result[0].id,
                            remarks: data.remarks,
                            modifyby: data.modifyby || data.loginId,
                            type: data.description || ''
                        }
                        let logs = await createActivityLog(record);
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    pointsBulkUpload: async function (data) {
        return new Promise(async function (resolve, reject) {
            let payload = data;
            for (let k = 0; k < payload.length; k++) {
                let userNo = payload[k].msisdn.toString();
                if (userNo.charAt(0) !== '0') {
                    userNo = '0' + userNo;
                }
                payload[k].msisdn = userNo;
            }
            var bulkPayload = payload.reduce((unique, o) => {
                if (!unique.some(obj => obj.msisdn === o.msisdn)) {
                    unique.push(o);
                }
                return unique;
            }, []);
            let resObj = {
                validUsers: [],
                invalidUsers: []
            }

            for (let k = 0; k < bulkPayload.length; k++) {
                let custLoginIdResult = await History.getUserInfoByPhoneNo(bulkPayload[k].msisdn);
                let userLoginID = custLoginIdResult.loginid || '';
                if (userLoginID) {
                    bulkPayload[k].loginId = userLoginID;
                    let data = bulkPayload[k];
                    let custInfo = await History.getUserInfo(data.loginId);
                    let validUsers = [];
                    if (custInfo.custmainno && !isNaN(custInfo.custmainno)) {
                        let custMainNo = custInfo.custmainno;
                        let userWithCustMainNo = await History.getUsersWithCustMainNo(custMainNo);
                        for (let i = 0; i < userWithCustMainNo.length; i++) {
                            let checkValid = await History.getUserPoints(data);
                            if (data.points <= 0) {
                                resObj.invalidUsers.push(bulkPayload[k]);
                            }
                            else if (data.type == 'DR' && checkValid.cur_bal <= 0) {
                                resObj.invalidUsers.push(bulkPayload[k]);
                            }
                            else {
                                validUsers.push(userWithCustMainNo[i].loginid);
                            }
                        }
                    }
                    else {
                        let checkValid = await History.getUserPoints(data);
                        if (data.points <= 0) {
                            resObj.invalidUsers.push(bulkPayload[k]);
                        }
                        else if (data.type == 'DR' && checkValid.cur_bal <= 0) {
                            resObj.invalidUsers.push(bulkPayload[k]);
                        }
                        else {
                            validUsers.push(data.loginId);
                        }
                    }
                    let resArray = [];
                    for (let i = 0; i < validUsers.length; i++) {
                        data.loginId = validUsers[i];
                        let result = await History.addPoints(data);
                        if (result[0]) {
                            let record = {
                                status: data.status,
                                userid: validUsers[i],
                                id: result[0].id,
                                remarks: data.remarks,
                                modifyby: data.modifyby || validUsers[i],
                                type: data.description || ''
                            }
                            let logs = await createActivityLog(record);
                        }

                        let curPoints = data.points;
                        let totalPoints = 0;
                        let redPoints = 0;
                        let productId = data.productId || 0;

                        if (data.type == 'CR') {
                            if (productId == 0) {
                                curPoints = data.points;
                                totalPoints = data.points;
                            }
                            else {
                                curPoints = data.points;
                                redPoints = '-' + data.points;
                            }
                        }
                        else {
                            if (productId == 0) {
                                curPoints = '-' + data.points;
                                totalPoints = '-' + data.points;
                            }
                            else {
                                curPoints = '-' + data.points;
                                redPoints = data.points;
                                data.productValue = '-1';
                                await ProductCatalogue.manageProducts(data);
                            }
                        }

                        data.curPoints = curPoints;
                        data.redPoints = redPoints;
                        data.totalPoints = totalPoints;

                        let walletInfo = await History.getUserPoints(data);
                        if (walletInfo.login_id) {
                            let pointsData = await History.managePoints(data);
                            if (data.sendNotification) {
                                sendPointCorrectionNotification(data);
                            }

                            resObj.validUsers.push(pointsData[0]);
                            // if (resArray.length == validUsers.length) {
                            //     resolve(resArray);
                            // }

                        }
                        else {
                            let initEntry = await History.initialEntry(data);
                            if (initEntry) {
                                let pointsData = await History.managePoints(data);
                                // resolve(pointsData);
                                resObj.validUsers(pointsData[0]);
                                // if (resArray.length == validUsers.length) {
                                //     resolve(resArray);
                                // }
                            }
                            else {
                                reject(new Error('User does not exist'));
                            }
                        }
                    }
                }
                else {
                    resObj.invalidUsers.push(bulkPayload[k]);
                }

                if (k == (bulkPayload.length - 1)) {
                    if (resObj.validUsers.length > 0) {
                        resolve(resObj);
                    }
                    else {
                        reject(new Error('Please enter valid data.'))
                    }

                }
            }

        });
    },

    equateSameCustMainNoPoints: async function (data) {
        return new Promise(async function (resolve, reject) {
            data.sourceApp = data.sourceApp || 'FMC';
            data.productId = data.productId || '0';
            let custInfo = await History.getUserInfo(data.loginId);


            let result = await History.addPoints(data);
            if (result[0]) {
                let record = {
                    status: data.status,
                    userid: data.loginId,
                    id: result[0].id,
                    remarks: data.remarks,
                    modifyby: data.modifyby,
                    type: data.description || ''
                }
                let logs = await createActivityLog(record);
            }
            let curPoints = data.points;
            let totalPoints = 0;
            let redPoints = 0;

            curPoints = data.points;
            totalPoints = data.points;

            data.curPoints = curPoints;
            data.redPoints = redPoints;
            data.totalPoints = totalPoints;

            let pointsData = await History.managePoints(data);
            resolve(pointsData);

        });
    },

    equateSameCustMainNoPointsNew: async function (data) {
        return new Promise(async function (resolve, reject) {
            data.sourceApp = data.sourceApp || 'FMC';
            data.productId = data.productId || '0';
            let custInfo = await History.getUserInfo(data.loginId);


            let result = await History.addPoints(data);
            if (result[0]) {
                let record = {
                    status: data.status,
                    userid: data.loginId,
                    id: result[0].id,
                    remarks: data.remarks,
                    modifyby: data.modifyby,
                    type: data.description || ''
                }
                let logs = await createActivityLog(record);
            }
            let curPoints = data.points;

            data.curPoints = curPoints;
            let pointsData = await History.managePoints(data);
            resolve(pointsData);

        });
    },

    addPoints: async function (data) {
        return new Promise(async function (resolve, reject) {
            data.sourceApp = data.sourceApp || 'FMC';
            let custInfo = await History.getUserInfo(data.loginId);
            let validUsers = [];
            if (custInfo.custmainno && !isNaN(custInfo.custmainno)) {
                let custMainNo = custInfo.custmainno;
                let userWithCustMainNo = await History.getUsersWithCustMainNo(custMainNo);
                for (let i = 0; i < userWithCustMainNo.length; i++) {
                    validUsers.push(userWithCustMainNo[i].loginid);
                }
            }
            else {
                validUsers.push(data.loginId);
            }
            let resArray = [];
            let pointData = data.points;
            for (let i = 0; i < validUsers.length; i++) {
                data.loginId = validUsers[i];
                let result = await History.addPoints(data);
                if (result[0]) {
                    let record = {
                        status: data.status,
                        userid: validUsers[i],
                        id: result[0].id,
                        remarks: data.remarks,
                        modifyby: data.modifyby || validUsers[i],
                        type: data.description || ''
                    }
                    let logs = await createActivityLog(record);
                }

                let curPoints = pointData;
                let totalPoints = 0;
                let redPoints = 0;
                let productId = data.productId || 0;
                if (data.type == 'CR') {

                    if (productId == 0) {
                        curPoints = pointData;
                        totalPoints = pointData;
                    }
                    else {
                        curPoints = pointData;
                        redPoints = '-' + pointData;
                    }
                }
                else {
                    if (productId == 0) {
                        curPoints = '-' + pointData;
                        totalPoints = '-' + pointData;
                    }
                    else {
                        curPoints = '-' + pointData;
                        redPoints = pointData;
                        if (i == 0) {
                            data.productValue = '-1';
                            await ProductCatalogue.manageProducts(data);
                        }
                    }
                }

                data.curPoints = curPoints;
                data.redPoints = redPoints;
                data.totalPoints = totalPoints;

                let walletInfo = await History.getUserPoints(data);
                if (walletInfo.login_id) {
                    let pointsData = await History.managePoints(data);
                    if (data.sendNotification) {
                        sendPointCorrectionNotification(data);
                    }

                    resArray.push(pointsData[0]);
                    if (resArray.length == validUsers.length) {
                        resolve(resArray);
                    }

                }
                else {
                    let initEntry = await History.initialEntry(data);
                    if (initEntry) {
                        let pointsData = await History.managePoints(data);
                        // resolve(pointsData);
                        resArray.push(pointsData[0]);
                        if (resArray.length == validUsers.length) {
                            resolve(resArray);
                        }
                    }
                    else {
                        reject(new Error('User does not exist'));
                    }
                }
            }

        });
    },

    syncPointHistory: function () {
        return new Promise(async function (resolve, reject) {
            debugger;
            await History.getAllWalletHistory()
                .then(async function (result) {
                    if (result) {
                        result.forEach(async function (record) {
                            let isExist = await History.checkInLogs(record);
                            if (isExist) {
                                if (isExist.length > 0) {

                                } else {
                                    let newData = {
                                        userid: record.login_id,
                                        id: record.id.toString(),
                                        modifyby: record.login_id,
                                        type: record.description || ''
                                    }
                                    let logs = await createActivityLogSyncing(newData);
                                }
                            }
                        })
                        resolve(true);
                    } else {
                        resolve(true);
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    pointCorrection: function () {
        return new Promise(async function (resolve, reject) {
            debugger;
            await History.getIncorrectHistory()
                .then(async function (result) {
                    if (result) {
                        logger.info(result);
                        result.forEach(async function (record, index) {
                            logger.info(record);
                            if (record.login_id) {
                                logger.info(record);
                                if (record.total_point > record.sum) {
                                    let data = {
                                        loginId: record.login_id,
                                        curBal: record.total_point - record.sum,
                                        totalPoint: record.total_point - record.sum,
                                        redeemPoint: 0
                                    }
                                    await History.pointsCorrection(data);
                                }
                            }
                        })
                        resolve(true);
                    } else {
                        resolve(true);
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteAfterPointCorrection: function () {
        return new Promise(async function (resolve, reject) {
            debugger;
            await History.deleteAfterPointsCorrection()
                .then(async function (result) {
                    resolve(true);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    initialEntry: async function (data) {
        return new Promise(function (resolve, reject) {
            History.initialEntry(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    checkRegistrationPoints: async function (data) {
        return new Promise(function (resolve, reject) {
            History.checkRegistrationPoints(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserPoints: async function (data) {
        return new Promise(function (resolve, reject) {
            History.getUserPoints(data)
                .then(function (result) {

                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    expireUserPoints: async function (data) {
        return new Promise(function (resolve, reject) {
            History.expireUserPoints(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    changeStatus: async function (data) {
        return new Promise(function (resolve, reject) {
            History.changeStatus(data)
                .then(async function (result) {


                    let walletHistoryById = await History.getWalletHistoryById(data);
                    let record = {
                        status: data.status,
                        userid: data.loginid,
                        id: walletHistoryById.id,
                        remarks: data.remarks,
                        modifyby: data.lastModifiedBy
                    }
                    let logs = await createActivityLog(record);
                    data.productCatalogueId = data.productcatalogueid;
                    let productDetails = await ProductCatalogue.getProductById(data);
                    if (data.status == 4) {

                        data.productValue = 1;
                        data.productId = data.productcatalogueid;

                        await ProductCatalogue.manageProducts(data);

                        let payload = {};
                        payload.curPoints = walletHistoryById.amount;
                        payload.redPoints = '-' + walletHistoryById.amount;
                        payload.totalPoints = 0;
                        payload.insertBy = data.lastModifiedBy;
                        payload.loginId = walletHistoryById.login_id;
                        await History.managePoints(payload);
                    }
                    result.status = data.status;
                    if (productDetails && productDetails[0]) {
                        result.productName = productDetails[0]['productname'];
                    }

                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    changeMulitpleStatus: async function (data) {
        return new Promise(function (resolve, reject) {
            let productsData = data.productArr
            // for (let i = 0; i <= productData.length - 1; i++) {
            productsData.forEach(async function (productData) {
                History.changeMultipleStatus(productData, data)
                    .then(async function (result) {
                        let walletHistoryById = await History.getWalletMultipleHistoryById(productData);
                        let record = {
                            status: data.status,
                            userid: productData.loginid,
                            id: walletHistoryById.id,
                            remarks: data.remarks,
                            modifyby: productData.lastModifiedBy
                        }
                        let logs = await createActivityLog(record);
                        productData.productCatalogueId = productData.productcatalogueid;
                        let productDetails = await ProductCatalogue.getProductById(productData);

                        if (data.status == 4) {
                            productData.productValue = 1;
                            productData.productId = productData.productcatalogueid;

                            await ProductCatalogue.manageProducts(productData);

                            let payload = {};
                            payload.curPoints = walletHistoryById.amount;
                            payload.redPoints = '-' + walletHistoryById.amount;
                            payload.totalPoints = 0;
                            payload.insertBy = data.lastModifiedBy;
                            payload.loginId = walletHistoryById.login_id;
                            await History.managePoints(payload);
                        }
                        result.status = data.status;
                        if (productDetails && productDetails[0]) {
                            result.productName = productDetails[0]['productname'];
                        }
                        sendMultipleNotification(result)
                        resolve(result)
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })


        });
    },


};

async function createActivityLog(record) {
    debugger;
    let data = {};
    let status = record.status || 3;
    try {
        status = await getStatusName({ statusid: status, module: 'CustomerRedemption' });
        data.loginid = record.userid;
        data.activitydesc = status;
        data.activitytype = record.type || '';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
        data.modifyby = record.modifyby || null;
        await ActivityLogs.createActivityLog(data);
    } catch (err) {
        console.log(err);
    }
}

async function createActivityLogSyncing(record) {
    debugger;
    let data = {};
    try {

        data.loginid = record.userid;
        data.activitydesc = 'Completed';
        data.activitytype = record.type || '';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
        data.modifyby = record.modifyby || null;
        await ActivityLogs.createActivityLog(data);
    } catch (err) {
        console.log(err);
    }
}

function getStatusName(payload) {
    return new Promise(function (resolve, reject) {

        let data = {};
        let whereClause = []
        let searchParams = payload;
        if (searchParams) {
            if (searchParams.statusid) {
                whereClause.push(`status_id = '${searchParams.statusid}'`)
            }
            if (searchParams.module) {
                whereClause.push(`module = '${searchParams.module}'`)
            }
        }
        whereClause = whereClause.join(" and ");
        if (whereClause.length > 0) {
            whereClause = "where " + whereClause;
        }
        data.whereClause = whereClause;
        StatusMaster.getStatusName(data)
            .then(function (result) {
                resolve(result);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function sendPointCorrectionNotification(data) {
    let type = "";
    if (data.type == 'CR') {
        type = "POINT_ADDED";
    }
    else {
        type = "POINT_REDUCED";
    }
    let notData = JSON.parse(JSON.stringify(data)) || {};
    notData.type = type;
    notData.desc = data.points;
    notData.refid = new Date().getTime();
    let user = {
        loginid: data.loginId
    }
    // data.sendnotification = data.loginId;
    notification.sendNotification(notData, user, false, true, false, true);
}

function sendMultipleNotification(data) {
    if (data.status == 1) {
        data.type = "CR_SUBMITTED";
        data.refid = new Date().getTime();
    }
    if (data.status == 2) {
        data.type = "CR_IN_PROGRESS";
        data.refid = new Date().getTime();
    }
    if (data.status == 3) {
        data.type = "CR_COMPLETED";
        data.refid = new Date().getTime();
    }
    if (data.status == 4) {
        data.type = "CR_CANCELLED";
        data.refid = new Date().getTime();
    }
    notification.sendNotification(data, { loginid: data[0].login_id }, false, true, false);
}

