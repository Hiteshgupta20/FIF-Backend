const Promise = require('promise');
const Claim = require('../models/claimInsurance');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const notification = require('../services/notification');
const UserModel= require('../models/user');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');
const PointManagement = require('../services/pointManagement');

module.exports = {

    createClaim: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                eventdate : getformattedDate(payload.eventDate) || null,
                username : payload.userName || "",
                purpose : payload.purpose || "",
                drivername : payload.driverName || "",
                incidentlocation : payload.incidentLocation || "",
                useraddress : payload.userAddress || "",
                cause : payload.cause || "",
                simnumber : payload.simNumber || "",
                simvalidity : getformattedDate(payload.simValidity) || null,
                phoneno : payload.phoneNo || "",
                type : payload.type || "",
                contract_no : payload.contractNo || "",
                status : payload.status || "",
                remarks : payload.remarks || "",
                insertdate : date,
                insertby : payload.insertBy || null,
                lastmodifyby : payload.insertBy || null,
                lastmodifydate : date
            };
            Claim.createClaim(data)
                .then(function (result) {
                    addActivityPoints(payload);
                    createActivityLog(result);
                    sendNotification(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },



    updateClaimStatus: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                status : payload.status || "",
                remarks : payload.remarks || "",
                lastmodifyby : payload.modifyBy  || payload.insertBy || null,
                lastmodifydate : date,
                id : payload.id
            };

            Claim.updateClaimStatus(data)
                .then(function (result) {
                    createActivityLog(result);
                    sendNotification(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findClaim: async function (payload) {
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

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.userName) {
                    whereClause.push(`username ILIKE '%${searchParams.userName}%'`)
                }
                if (searchParams.contractNo) {
                    whereClause.push(`contract_no ILIKE '%${searchParams.contractNo}%'`)
                }
                if (searchParams.status) {
                    console.log(searchParams.status);
                    whereClause.push(`status = '${searchParams.status}'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            var isExport = payload.isExport || 0;
            if(isExport == 1){
                data.whereClause ="";
                Claim.findAllClaim(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
            else{
                Claim.findClaim(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        });
    },

    findClaimCount: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.userName) {
                    whereClause.push(`username ILIKE '%${searchParams.userName}%'`)
                }
                if (searchParams.contractNo) {
                    whereClause.push(`contract_no ILIKE '%${searchParams.contractNo}%'`)
                }
                if (searchParams.status) {
                    console.log(searchParams.status);
                    whereClause.push(`status = '${searchParams.status}'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            var isExport = payload.isExport || 0;
            Claim.getClaimCount(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
        });
    },

    deleteClaim: async function (CIId) {
        return new Promise(function(resolve, reject) {
            
            Claim.deleteClaim(CIId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findClaimById: async function (CIId) {
        return new Promise(function(resolve, reject) {
            
            Claim.findClaimById(CIId)
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
            Claim.getStatusList()
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
                activitymodule :payload.claimrequestid,
                activitytype : "Claim"
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
        activityappid: 'CLAIM INSURANCE'
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
        status = await getStatusName({statusid:status,module:'SM_Claim'});
        data.loginid = record.lastmodifyby ;
        data.activitydesc =  status;
        data.activitytype = 'Claim Insurance Request Submitted';
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
function getformattedDate(date) {
    if(date.indexOf("/") > 0){
        let d = date.split("/");
        if(d[0].length == 2){
            date = d[2]+"-"+d[1]+"-"+d[0];
        }
        else{
            date = d[0]+"-"+d[1]+"-"+d[2];
        }
    }
    return date || null;
}


async function sendNotification(data) {
    try{
        if(data.status == 1){
            data.type = "CI_SUBMITTED";
        }
        if(data.status == 2){
            data.type = "CI_IN_PROGRESS";
        }
        if(data.status == 3){
            data.type = "CI_COMPLETED";
        }
        if(data.status == 4){
            data.type = "CI_CANCELLED";
        }
        notification.sendNotification(data,{loginid : data.insertby},false,true,false);

    }
    catch (err){
        logger.error(err);
    }
}
