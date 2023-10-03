const Promise = require('promise');
const PointManagement = require('../models/pointManagement');
const PointService = require('../services/pointHistory');
const util = require('../controllers/util');
const logger = require('../config/logging');
const ActivityLogService = require('../services/activityLogs');
const PointHistory = require('../services/pointHistory');

module.exports = {

    getAllActivity: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            data.isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload,'p.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.activity) {
                    whereClause.push(`p.activityid='${searchParams.activity}'`)
                }
                if (searchParams.points) {
                    whereClause.push(`p.points='${searchParams.points}'`)
                }
                if (searchParams.activityId) {
                    whereClause.push(`p.activityid='${searchParams.activityId}'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;
            console.log("where clause="+whereClause);

            if (data.isExport == 0) {
                PointManagement.getAllActivity(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                PointManagement.getExportAllActivity(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    addActivity: async function (data) {
        return new Promise(function(resolve, reject) {
            PointManagement.addActivity(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateActivity: async function (data) {
        return new Promise(function(resolve, reject) {
            PointManagement.updateActivity(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteActivity: async function (data) {
        return new Promise(function(resolve, reject) {
            PointManagement.deleteActivity(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

     getPointsForActivity: async function (data) {
        return new Promise(function(resolve, reject) {
            PointManagement.getActivityPointData(data)
                .then(async function (result) {
                    try{
                        if (result[0]){
                            let pointObj = result[0];
                            let pointsToAdd = 0;
                            let pointsStartDateTime = pointObj.startdate.getTime();
                            let pointEndDateTime = pointObj.enddate.getTime();
                            let currDateTime = Date.now();
                            if (currDateTime > pointsStartDateTime && currDateTime < pointEndDateTime) {
                                pointsToAdd = pointsToAdd+parseInt(pointObj.points);
                            }

                            if (pointObj.bpstartdate && pointObj.bpenddate) {
                                let bonusPointsStartDateTime = pointObj.bpstartdate.getTime();
                                let bonusPointEndDateTime = pointObj.bpenddate.getTime();
                                if (currDateTime > bonusPointsStartDateTime && currDateTime < bonusPointEndDateTime) {
                                    pointsToAdd = pointsToAdd+parseInt(pointObj.bonuspoints);
                                }
                            }
                            resolve(pointsToAdd);
                        }
                        else {
                            resolve(0);
                        }
                    }
                    catch(err){
                        console.log(err);
                        reject(err);
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    addPointsForActivity: async function (data) {
        return new Promise(function(resolve, reject) {
            PointManagement.getActivityPointData(data)
                .then(async function (result) {

                    try{
                        if (result[0]){
                            let pointObj = result[0];
                            let pointsToAdd = 0;
                            let pointsStartDateTime = pointObj.startdate.getTime();
                            let pointEndDateTime = pointObj.enddate.getTime();
                            let currDateTime = Date.now();
                            if (currDateTime > pointsStartDateTime && currDateTime < pointEndDateTime) {
                                pointsToAdd = pointsToAdd+parseInt(pointObj.points);
                            }

                            if (pointObj.bpstartdate && pointObj.bpenddate) {
                                let bonusPointsStartDateTime = pointObj.bpstartdate.getTime();
                                let bonusPointEndDateTime = pointObj.bpenddate.getTime();
                                if (currDateTime > bonusPointsStartDateTime && currDateTime < bonusPointEndDateTime) {
                                    pointsToAdd = pointsToAdd+parseInt(pointObj.bonuspoints);
                                }
                            }

                            if (pointsToAdd > 0){
                                let pdata = {
                                    type: 'CR',
                                    productId: 0,
                                    points: pointsToAdd,
                                    loginId: data.loginid,
                                    insertBy: data.loginid,
                                    description: data.description ||data.activityappid || '',
                                    name: 'Points added'
                                }
                                try {
                                    let pointsAdded = await PointService.addPoints(pdata);
                                    pointsAdded.currentPoints = pointsToAdd;
                                    resolve(pointsAdded);
                                }
                                catch(err) {
                                    reject(err);
                                }
                            }
                            else {
                                resolve(true);
                            }
                        }
                        else {
                            resolve(true);
                        }
                    }
                    catch(err){
                        console.log(err);
                        reject(err);
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    expirePointsScheduler: async function (data) {
        return new Promise(async function(resolve, reject) {
            try {
                logger.info('expire points scheduler run');
                let data = {
                    isExport: 1
                }
                let wallets = await PointHistory.getAllWalletInfo(data);
                if (wallets && wallets['data'] && wallets['data'].length > 0){
                    var walletData = wallets['data'];
                    for (let i =0; i < walletData.length; i++) {
                        let wallet = walletData[i];
                        logger.info(wallet.login_id);
                            let currentDate = new Date(util.getTimestamp()).getTime();
                            if (wallet.exp_date && wallet.total_points > 0) {
                                let expiryDate = new Date(util.getTimestamp(wallet.exp_date)).getTime();
                                    let pointsData = {
                                        loginId: wallet.login_id,
                                        totalPoints: wallet.total_points
                                    }
                                    try {
                                        PointHistory.expireUserPoints(pointsData);
                                        let pdata = {
                                            type: 'DR',
                                            productId: 0,
                                            points: pointsData.totalPoints,
                                            loginId: pointsData.loginId,
                                            insertBy: pointsData.loginId,
                                            description: 'Total Points Expired',
                                            name: 'Points expired'
                                        }
                                        try {
                                            PointService.addPointsHistory(pdata);
                                        }
                                        catch(err) {
                                            reject(new Error(err));
                                        }
                                    }
                                    catch(err){
                                        reject(new Error(err));
                                    }
                            }
                    }
                }
                resolve(true);
            }
            catch(err){
                reject(err);
            }

        });
    },

};
