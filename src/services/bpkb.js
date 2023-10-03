const Promise = require('promise');
const BPKB = require('../models/bpkb');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const notification = require('../services/notification');
const UserModel= require('../models/user');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');
const PointManagement = require('../services/pointManagement');

module.exports = {

    createBpkb: async function (payload) {
        return new Promise(async function(resolve, reject) {
            
           try{
               let date = util.getTimestamp();
               let data = {
                   name : payload.name || "" ,
                   stnk_bpkb_name : payload.stnkBpkbName || "" ,
                   mgmt_method : payload.managementMethod || "" ,
                   description : payload.description || "",
                   email : payload.email || "",
                   msisdn : payload.msisdn || "",
                   contractNo : payload.contractNo || "",
                   branch : payload.branch || "1",
                   category : payload.category || "",
                   status : payload.status || "",
                   remarks : payload.remarks || "",
                   insertdate : date,
                   insertby : payload.insertby || payload.insertBy || null,
                   lastmodifyby : payload.insertby || payload.insertBy || null,
                   lastmodifydate : date
               };
               let pendingBPKB = await BPKB.pendingBpkb(data.insertby);
               if(pendingBPKB.length == 0){
                   BPKB.createBpkb(data)
                       .then(async function (result) {
                           let userPoints = await addActivityPoints(payload);
                           if (userPoints){
                               result.pointsAdded = userPoints;
                           }
                           sendBPKBNotification(result);
                           createActivityLog(result);
                           resolve(result);
                       })
                       .catch(function (err) {
                           reject(err);
                       });
               }
               else{
                   reject(new Error("Your previous request for BPKB is still in progress."))
               }
           }
           catch(err){

           }
        });
    },

    updateBpkb: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                name : payload.name || "" ,
                description : payload.description || "",
                email : payload.email || "",
                msisdn : payload.msisdn || "",
                contractNo : payload.contractNo || "",
                branch : payload.branch || "1",
                category : payload.category || "",
                status : payload.status || "",
                remarks : payload.remarks || "",
                lastmodifyby : payload.modifyBy || null,
                lastmodifydate : date,
                id : payload.id
            };

            BPKB.updateBpkb(data)
                .then(function (result) {
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateBpkbStatus: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                status : payload.status || "",
                remarks : payload.remarks || "",
                lastmodifyby : payload.modifyBy ||payload.insertBy|| null,
                lastmodifydate : date,
                id : payload.id
            };

            BPKB.updateBpkbStatus(data)
                .then(function (result) {
                    sendBPKBNotification(result);
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findBpkb: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            if (payload.offset) {
                data.offset = payload.offset;
            }
            else {
                data.offset = (payload.page - 1)* payload.limit || 0;
            }
            
            data.isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
                if (searchParams.contractNo) {
                    whereClause.push(`contract_no ILIKE '%${searchParams.contractNo}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`phn_no ILIKE '%${searchParams.msisdn}%'`)
                }
                if (searchParams.email) {
                    whereClause.push(`email ILIKE '%${searchParams.email}%'`)
                }
                if (searchParams.branch) {
                    whereClause.push(`branch ILIKE '%${searchParams.branch}%'`)
                }

            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                BPKB.findBpkb(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                BPKB.findAllBpkb(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    findBpkbCount: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            data.isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
                if (searchParams.contractNo) {
                    whereClause.push(`contract_no ILIKE '%${searchParams.contractNo}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`phn_no ILIKE '%${searchParams.msisdn}%'`)
                }
                if (searchParams.email) {
                    whereClause.push(`email ILIKE '%${searchParams.email}%'`)
                }
                if (searchParams.branch) {
                    whereClause.push(`branch ILIKE '%${searchParams.branch}%'`)
                }

            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            BPKB.getBpkbCount(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });

        });
    },

    deleteBpkb: async function (bpkbId) {
        return new Promise(function(resolve, reject) {
            
            BPKB.deleteBpkb(bpkbId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findBpkbById: async function (bpkbId) {
        return new Promise(function(resolve, reject) {
            
            BPKB.findBpkbById(bpkbId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getStatusList: async function () {
        return new Promise(function(resolve, reject) {
            BPKB.getStatusList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    statusHistory: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {
                activitymodule :payload.id,
                activitytype : "BPKB"
            }
            ActivityLogService.findActivityLogs(data)
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
    return new Promise(async function (resolve,reject) {
        let pointsData = {
            loginid: data.insertby || data.insertBy,
            activityappid: 'BPKB',
            description: 'BPKB Request'
        }
        try{
            let toAddPoints = await PointManagement.addPointsForActivity(pointsData);
            let pointsAdded = 0;
            if (toAddPoints.currentPoints){
                pointsAdded = toAddPoints.currentPoints;
            }
            resolve(pointsAdded);
        }catch (err){
            logger.error(err);
        }
    });
}


async function createActivityLog(record) {
    let data = {};
    let status = record.status;
    try{
        status = await getStatusName({statusid:status,module:'SM_BPKB'});
        data.loginid = record.lastmodifyby ;
        data.activitydesc =  status;
        data.activitytype = 'BPKB Request Submitted';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
        ActivityLogService.createActivityLog(data);
    }catch (err){
        logger.error(err);
    }
}

function getStatusName(payload) {
    return new Promise(function(resolve, reject) {
        
        let data = {};
        let whereClause = []
        let searchParams = payload;
        if (searchParams) {
            if (searchParams.statusid) {
                console.log(searchParams.statusid);
                whereClause.push(`status_id = '${searchParams.statusid}'`)
            }
            if (searchParams.module) {
                console.log(searchParams.module);
                whereClause.push(`module = '${searchParams.module}'`)
            }
        }
        whereClause = whereClause.join(" and ");
        if(whereClause.length > 0){
            whereClause = "where "+ whereClause;
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


function sendBPKBNotification(data) {

    if(data.status == 1){
        data.type = "BPKB_SUBMITTED";
    }
    if(data.status == 2){
        data.type = "BPKB_IN_PROGRESS";
    }
    if(data.status == 3){
        data.type = "BPKB_COMPLETED";
    }
    if(data.status == 4){
        data.type = "BPKB_CANCELLED";
    }
    notification.sendNotification(data,{loginid : data.insertby},false,true,false);
}
