const Promise = require('promise');
const ActivityLog = require('../models/activityLogs');
const util = require('../controllers/util');
const user = require('../services/user');

module.exports.createActivityLog = async function (payload) {
        return new Promise(function (resolve, reject) {
            console.log('in act log service');
            let data = {};
            let date = util.getTimestamp();
            data.loginid = payload.loginid || '';
            data.activitydesc = payload.activitydesc || '';
            data.activitytype = payload.activitytype || '';
            data.activitymodule = payload.activitymodule || '';
            data.insertdate = date;
            data.remarks = payload.remarks || '';
            data.modifyby = payload.modifyby;

            ActivityLog.createActivityLog(data)
                .then(async function (result) {
                    let actPayload = {
                        loginId: payload.loginid,
                        lastActivity: payload.activitytype
                    }
                    await user.updateLastActivity(actPayload)
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    };

module.exports.findActivityLogs =  async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let whereClause = []
            let searchParams = payload;
            if (searchParams) {
                if (searchParams.activitytype) {
                    whereClause.push(`activitytype = '${searchParams.activitytype}'`)
                }
                if (searchParams.loginid) {
                    whereClause.push(`t1.loginid = '${searchParams.loginid}'`);
                }
                if (searchParams.activitymodule) {
                    whereClause.push(`activitymodule = '${searchParams.activitymodule}'`)
                }

            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;
            ActivityLog.findActivityLogs(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    };

module.exports.findActivityLogsWithoutLoginId = async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let whereClause = []
            let searchParams = payload;
            if (searchParams) {
                if (searchParams.activitytype) {
                    whereClause.push(`activitytype = '${searchParams.activitytype}'`)
                }
                if (searchParams.loginid) {
                    whereClause.push(`t1.loginid = '${searchParams.loginid}'`);
                }
                if (searchParams.activitymodule) {
                    whereClause.push(`activitymodule = '${searchParams.activitymodule}'`)
                }

            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;
            ActivityLog.findActivityLogsWithoutLoginId(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    };
