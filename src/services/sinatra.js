const Promise = require('promise');
const Sinatra = require('../models/sinatra');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const UserModel = require('../models/user');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');
const notification = require('../services/notification');
const PointManagement = require('../services/pointManagement');

module.exports = {
    createSinatra: async function (payload) {
        return new Promise(function (resolve, reject) {
            
            let date = util.getTimestamp();
            let dob = payload.dob || "";
            if(dob.indexOf("/") > 0){
                let d = dob.split("/");
                if(d[0].length == 2){
                    dob = d[2]+"-"+d[1]+"-"+d[0];
                }
                else{
                    dob = d[0]+"-"+d[1]+"-"+d[2];
                }
            }
            let data = {
                name: payload.name || "",
                description: payload.description || "",
                dob: dob || "",
                status: payload.status || 1,
                request_for: payload.requestFor || {},
                remarks: payload.remarks || "",
                insertdate: date,
                insertby: payload.insertBy || null,
                lastmodifyby: payload.insertBy || null,
                ktp_id: payload.ktpId || "",
                village: payload.village || "",
                place_of_birth: payload.placeOfBirth || payload.placOfBirth ||  "",
                gender: payload.gender || "",
                address: payload.address || "",
                districts: payload.district || "",
                province: payload.province || "",
                city: payload.city || "",
                rt: payload.rt || "",
                rw: payload.rw || "",
                post_code: payload.postCode || "",
                phone: payload.phone || ""

            };
            Sinatra.createSinatra(data)
                .then(async function (result) {
                    let userPoints = await addActivityPoints(data);
                    if (userPoints){
                        result.pointsAdded = userPoints;
                    }
                    createActivityLog(result);
                    sendNotification(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateSinatra: async function (payload) {
        return new Promise(function (resolve, reject) {
            
            let date = util.getTimestamp();
            let dob = payload.dob ||"";
            if(dob.indexOf("/") > 0){
                let d = dob.split("/");
                dob = d[2]+"-"+d[1]+"-"+d[0];
            }
            let data = {
                name: payload.name || "",
                description: payload.description || "",
                dob: dob || "",
                status: payload.status || 1,
                request_for: payload.requestFor || {},
                remarks: payload.remarks || "",
                lastmodifydate: date,
                lastmodifyby: payload.insertBy || null,
                ktp_id: payload.ktpId || "",
                village: payload.village || "",
                place_of_birth: payload.placeOfBirth || "",
                gender: payload.gender || "",
                address: payload.address || "",
                province: payload.province || "",
                city: payload.city || "",
                rt: payload.rt || "",
                rw: payload.rw || "",
                post_code: payload.postCode || "",
                phone: payload.phone || "",
                id: payload.id
            };

            Sinatra.updateSinatra(data)
                .then(function (result) {
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateSinatraStatus: async function (payload) {
        return new Promise(function (resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                status: payload.status || "",
                remarks: payload.remarks || "",
                lastmodifyby: payload.modifyBy ||payload.insertBy || null,
                lastmodifydate: date,
                id: payload.id
            };

            Sinatra.updateSinatraStatus(data)
                .then(function (result) {
                    sendNotification(result);
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findSinatra: async function (payload) {
        return new Promise(function (resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.isExport = payload.isExport || 0;
            data.limit = payload.limit || 10;
            if (payload.offset) {
                data.offset = payload.offset;
            }
            else {
                data.offset = (payload.page - 1) * payload.limit || 0;
            }

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
                if (searchParams.status) {
                    whereClause.push(`status = '${searchParams.status}'`)
                }
                if (searchParams.date && searchParams.date.from && searchParams.date.to) {
                    whereClause.push(`date_trunc('day',insertdate) between to_date('${searchParams.date.from}','DD-MM-YYYY') and to_date('${searchParams.date.to}','DD-MM-YYYY')`)
                }
                if (searchParams.dob && searchParams.dob.from && searchParams.dob.to) {
                    whereClause.push(`date_trunc('day',dob) between to_date('${searchParams.dob.from}','DD-MM-YYYY') and to_date('${searchParams.dob.to}','DD-MM-YYYY')`)
                }

            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            if (data.isExport == 0) {
                Sinatra.findSinatra(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Sinatra.findAllSinatra(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    findSinatraCount: async function (payload) {
        return new Promise(function (resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.isExport = payload.isExport || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
                if (searchParams.status) {
                    whereClause.push(`status = '${searchParams.status}'`)
                }
                if (searchParams.date && searchParams.date.from && searchParams.date.to) {
                    whereClause.push(`date_trunc('day',insertdate) between to_date('${searchParams.date.from}','DD-MM-YYYY') and to_date('${searchParams.date.to}','DD-MM-YYYY')`)
                }
                if (searchParams.dob && searchParams.dob.from && searchParams.dob.to) {
                    whereClause.push(`date_trunc('day',dob) between to_date('${searchParams.dob.from}','DD-MM-YYYY') and to_date('${searchParams.dob.to}','DD-MM-YYYY')`)
                }

            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            Sinatra.getSinatraCount(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });

        });
    },

    deleteSinatra: async function (stnkId) {
        return new Promise(function (resolve, reject) {
            
            Sinatra.deleteSinatra(stnkId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findSinatraById: async function (stnkId) {
        return new Promise(function (resolve, reject) {
            
            Sinatra.findSinatraById(stnkId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findSinatraByLoginid: async function (loginId) {
        return new Promise(function (resolve, reject) {
            
            Sinatra.findSinatraByLoginid(loginId)
                .then(function (result) {
                    let response = {
                        isAlreadyRequested :false
                    };
                    result.forEach(function (sinatra) {
                        if(sinatra.status == 1){
                            response.isAlreadyRequested = true;
                        }
                    });
                    resolve(response);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getStatusList: async function () {
        return new Promise(function (resolve, reject) {
            Sinatra.getStatusList()
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
            let data = {
                activitymodule: payload.id,
                activitytype: "Sinatra"
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
            loginid: data.insertby,
            activityappid: 'SINATRA INSURANCE',
            description: 'Sinatra Insurance Request'
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
    try {
        status = await getStatusName({statusid: status, module: 'SM_Sinatra'});
        data.loginid = record.lastmodifyby;
        data.activitydesc = status;
        data.activitytype = 'Sinatra Insurance Request';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
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
                console.log(searchParams.statusid);
                whereClause.push(`status_id = '${searchParams.statusid}'`)
            }
            if (searchParams.module) {
                console.log(searchParams.module);
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

function sendNotification(data) {

    console.log("data from sinatra : ",data);
    if(data.status == 1){
        //In Progress
        data.type = "SINATRA_SUBMITTED";
    }if(data.status == 2){
        //In Progress
        data.type = "SINATRA_IN_PROGRESS";
    } if(data.status == 3){
        //Completed
        data.type = "SINATRA_COMPLETED";
    } if(data.status == 4){
        //Cancelled
        data.type = "SINATRA_CANCELLED";
    }
    notification.sendNotification(data,{loginid : data.insertby},false,true,false);
}
