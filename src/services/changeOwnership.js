const Promise = require('promise');
const ChangeOwnership = require('../models/changeOwnership');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const UserModel= require('../models/user');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');
const notification = require('../services/notification');
const PointManagement = require('../services/pointManagement');

module.exports = {

    createChangeOwnership: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                name : payload.name || "" ,
                stnk_bpkb_name : payload.stnkBpkbName || "" ,
                description : payload.description || "",
                email : payload.email || "",
                msisdn : payload.msisdn || "",
                contractNo : payload.contractNo || "",
                branch : payload.branch || "1",
                category : payload.category || "",
                status : payload.status || "",
                remarks : payload.remarks || "",
                insertdate : date,
                insertby : payload.insertby || null,
                lastmodifyby : payload.insertby || null,
                lastmodifydate : date
            };
            ChangeOwnership.createChangeOwnership(data)
                .then(function (result) {
                    sendSTNKNotification(result);
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateChangeOwnership: async function (payload) {
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

            ChangeOwnership.updateChangeOwnership(data)
                .then(function (result) {
                    addActivityPoints(payload);
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateChangeOwnershipStatus: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                status : payload.status || "",
                remarks : payload.remarks || "",
                lastmodifyby : payload.modifyBy ||payload.insertBy|| null,
                lastmodifydate : date,
                id : payload.id
            };

            ChangeOwnership.updateChangeOwnershipStatus(data)
                .then(function (result) {
                    sendSTNKNotification(result);
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findChangeOwnership: async function (payload) {
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
                ChangeOwnership.findChangeOwnership(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                ChangeOwnership.findAllChangeOwnership(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    findChangeOwnershipCount: async function (payload) {
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

            ChangeOwnership.getChangeOwnershipCount(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });

        });
    },

    deleteChangeOwnership: async function (changeOwnershipId) {
        return new Promise(function(resolve, reject) {
            
            ChangeOwnership.deleteChangeOwnership(changeOwnershipId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findChangeOwnershipById: async function (changeOwnershipId) {
        return new Promise(function(resolve, reject) {
            
            ChangeOwnership.findChangeOwnershipById(changeOwnershipId)
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
            ChangeOwnership.getStatusList()
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
                activitytype : "ChangeOwnership"
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

    let pointsData = {
        loginid: data.insertby || data.insertBy,
        activityappid: 'BALIK NAMA',
        description: 'Balik Nama'
    }
    try{
        await PointManagement.addPointsForActivity(pointsData);
    }catch (err){
        logger.error(err);
    }
}


async function createActivityLog(record) {
    let data = {};
    let status = record.status;
    try{
        status = await getStatusName({statusid:status,module:'SM_ChangeOwnership'});
        data.loginid = record.lastmodifyby ;
        data.activitydesc =  status;
        data.activitytype = 'Change Ownership Request Submitted';
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

function sendSTNKNotification(data) {

    if(data.status == 1){
        data.type = "CO_SUBMITTED";
    }
    if(data.status == 2){
        data.type = "CO_IN_PROGRESS";
    }
    if(data.status == 3){
        data.type = "CO_COMPLETED";
    }
    if(data.status == 4){
        data.type = "CO_CANCELLED";
    }
    notification.sendNotification(data,{loginid : data.insertby},false,false,false);
}
