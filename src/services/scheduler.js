const Promise = require('promise');
const Scheduler = require('../models/scheduler');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');

module.exports = {

    createScheduler: async function (payload) {
        return new Promise(async function(resolve, reject) {
            
            try{
                let date = util.getTimestamp();
                let data = {
                    name : payload.name || ""
                };

                Scheduler.create
                Scheduler(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            catch(err){

            }
        });
    },

    updateScheduler: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                name : payload.name || ""
            };

            Scheduler.updateSchedulerStartTime(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateSchedulerStatus: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                name : payload.name || "" ,
                status : payload.status || ""
            };

            Scheduler.updateScheduler(data)
                .then(function (result) {
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findScheduler: async function (payload) {
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
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                Scheduler.findScheduler(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Scheduler.findAllScheduler(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    statusHistory: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {
                activitymodule :payload.name,
                activitytype : "SCHEDULER"
            }
            ActivityLogService.findActivityLogsWithoutLoginId(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getSchedulerFrequency: async function(name) {
        return new Promise(function(resolve, reject) {
            let data = {
                activitymodule :name.toUpperCase()
            }
            Scheduler.findSchedulerFrequency(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
        });
    }
};

async function createActivityLog(record) {
    let data = {};
    let status = record.status || "";
    try{
        data.loginid = 1 ;
        data.activitydesc =  status;
        data.activitytype = 'Scheduler run for '+record.name;
        data.activitymodule = record.name;
        data.remarks = record.remarks || '';
        ActivityLogService.createActivityLog(data);
    }catch (err){
        logger.error(err);
    }
}
