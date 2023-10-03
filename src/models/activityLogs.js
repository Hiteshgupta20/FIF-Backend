const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for auction detail table
module.exports.createActivityLog = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_lm_activity_logs (loginid, activitydesc, activitytype, activitymodule, insertdate, remarks, modifyby)
             VALUES($1, $2, $3, $4, $5, $6, $7) returning activityid;`,
            [data.loginid, data.activitydesc, data.activitytype, data.activitymodule, data.insertdate, data.remarks, data.modifyby])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                logger.info(err);
                reject(err);
            });
    });
}
module.exports.findActivityLogs = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT t1.activityid, t1.loginid, t1.activitydesc, t1.activitytype, t1.activitymodule, t1.insertdate, t1.remarks , t2.name
                    FROM ${db.schema}.t_lm_activity_logs t1 
                    INNER JOIN ${db.schema}.t_lm_app_login_detail t2 on t1.loginid = t2.loginid 
                    ${data.whereClause} ORDER BY t1.insertdate::timestamp DESC ;`, [])
            .then(async function (results) {

                resolve(results);
            })
            .catch(function (err) {
                logger.info(err);
                reject(err);
            });
    });
}
module.exports.findActivityLogsWithoutLoginId = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT t1.activityid, t1.loginid, t1.activitydesc, t1.activitytype, t1.activitymodule, t1.insertdate, t1.remarks 
                    FROM ${db.schema}.t_lm_activity_logs t1 
                    ${data.whereClause} ORDER BY t1.insertdate::timestamp DESC ;`, [])
            .then(async function (results) {

                resolve(results);
            })
            .catch(function (err) {
                logger.info(err);
                reject(err);
            });
    });
}
