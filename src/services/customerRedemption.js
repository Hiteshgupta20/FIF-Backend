const Promise = require('promise');
const PointHistory = require('../services/pointHistory');
const CustomerRedemption = require('../models/customerRedemption');
const ProductCatalogue = require('../services/productCatalogue');
const notification = require('../services/notification');
const util = require('../controllers/util');
const logger = require('../config/logging');
const ActivityLogService = require('../services/activityLogs');
const StatusMaster = require('../models/statusMaster');
const PointManagement = require('../services/pointManagement');

module.exports = {

    pointsRedeem: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                var productDetailsData = await ProductCatalogue.checkProductAvailability(payload);

                if (productDetailsData) {
                    var userPointDetail = await PointHistory.getUserPoints(payload);
                    if (userPointDetail && userPointDetail.cur_bal >= productDetailsData.points) {
                        resolve("User is appicable to buy the product");

                        let data = {};
                        data.loginId = payload.loginId;
                        data.name = productDetailsData.productname;
                        data.description = 'Product purchased';
                        data.sourceApp = 'FMC';
                        data.type = "DR";
                        data.points = productDetailsData.points;
                        data.productId = productDetailsData.productcatalogueid;
                        data.status = 1;
                        data.remarks = 'Request received for points redemption';
                        data.insertBy = payload.loginId;
                        data.modifyby = payload.loginId

                        let result = {
                            type: "NEW",
                            login_id: payload.loginId
                        }

                        PointHistory.addPoints(data).then(async (result) => {
                            if (result) {
                                addActivityPoints(payload);
                                if (result && result[0]) {
                                    result[0].productName = data.name;
                                    result[0].status = 1;
                                    sendNotification(result[0]);
                                }

                            }
                        }).catch(function (err) {
                            logger.error(err);
                        });;
                    } else {
                        resolve("Sorry, insufficient points");
                    }
                } else {
                    reject(new Error("Sorry, product is not available"));
                }
            }
            catch (err) {
                reject(err);
            }
        });
    },

    getRedemptionData: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            if (payload.offset) {
                data.offset = payload.offset;
            }
            else {
                data.offset = (payload.page - 1) * payload.limit || 0;
            }
            let isExport = payload.isExport || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            data.orderByClause = util.formatOrderByClause(payload, 't2.');

            let whereClause = [];
            let searchParams = payload.searchParams;

            // whereClause.push(`(t2.status='IN_PROGRESS' or t2.status='Cancelled')`);

            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`t3.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`t3.msisdn ilike '%${searchParams.msisdn}%'`)
                }
                if (searchParams.productValue) {
                    whereClause.push(`t1.points=${searchParams.productValue}`)
                }
                if (searchParams.redeemDate) {
                    if (searchParams.redeemDate.from && searchParams.redeemDate.to) {
                        whereClause.push(`date_trunc('day',t2.insertdate) between
                         to_date('${searchParams.redeemDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.redeemDate.to}','DD-MM-YYYY')`)
                    }
                }
                if (searchParams.status) {

                    whereClause.push(`t2.status ilike '%${searchParams.status}%'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            if (isExport == 0) {
                CustomerRedemption.getRedemptionData(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                CustomerRedemption.getAllRedemptionData(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    getRedemptionDataCount: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = payload.offset || 0;
            let isExport = payload.isExport || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            data.orderByClause = util.formatOrderByClause(payload, 't2.');

            let whereClause = [];
            let searchParams = payload.searchParams;

            // whereClause.push(`(t2.status='IN_PROGRESS' or t2.status='Cancelled')`);

            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`t3.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`t3.msisdn ilike '%${searchParams.msisdn}%'`)
                }
                if (searchParams.productValue) {
                    whereClause.push(`t1.points=${searchParams.productValue}`)
                }
                if (searchParams.redeemDate) {
                    if (searchParams.redeemDate.from && searchParams.redeemDate.to) {
                        whereClause.push(`date_trunc('day',t2.insertdate) between
                         to_date('${searchParams.redeemDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.redeemDate.to}','DD-MM-YYYY')`)
                    }
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            CustomerRedemption.getCount(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });

        });
    },

    updateStatus: async function (payload) {
        return new Promise(async function (resolve, reject) {

            PointHistory.changeStatus(payload)
                .then(function (result) {
                    sendNotification(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateMulitpleStatus: async function (payload) {
        return new Promise(async function (resolve, reject) {

            PointHistory.changeMulitpleStatus(payload)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    statusHistory: async function (payload) {
        return new Promise(function (resolve, reject) {
            let productId = payload.productId;
            let data = {
                loginId: payload.loginId,
                productId: productId.toString(),
                id: payload.id
            }
            CustomerRedemption.statusHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

};

async function addActivityPoints(data) {

    let pointsData = {
        loginid: data.loginId || null,
        activityappid: 'REDEEM',
        description: 'Redeem'
    }
    try {
        await PointManagement.addPointsForActivity(pointsData);
    } catch (err) {
        logger.error(err);
    }
}

function sendNotification(data) {
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
    notification.sendNotification(data, { loginid: data.login_id }, false, true, false);
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

async function createActivityLog(record) {
    let data = {};
    let status = record.status;
    try {
        status = await getStatusName({ statusid: status, module: 'CustomerRedemption' });
        data.loginid = record.userid;
        data.activitydesc = status;
        data.activitytype = 'customer_redemption';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
        data.modifyby = record.modifyby
        ActivityLogService.createActivityLog(data);
    } catch (err) {
        logger.error(err);
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

