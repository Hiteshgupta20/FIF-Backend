const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.getRedemptionData = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select t2.id,t3.name,t3.msisdn,t1.productname,t1.productcatalogueid,t2.insertdate,t2.login_id,
        t1.points,t4.cur_bal,t2.status,t2.lastmodifydate
        from ${db.schema}.t_pm_product_management t1
        join  ${db.schema}.t_wm_wallet_hist t2 
        ON t2.product_id=t1.productcatalogueid
        JOIN ${db.schema}.t_lm_app_login_detail t3
        on t3.loginid=t2.login_id
        join ${db.schema}.t_wm_wallet_info t4
        on t4.login_id=t2.login_id
        ${data.whereClause}
        ${data.orderByClause}
        LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getCount(data);
                console.log("count="+count);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAllRedemptionData = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select t2.id,t3.name,t3.msisdn,t1.productname,t1.productcatalogueid,t2.insertdate,t2.login_id,
        t1.points,t4.cur_bal,t2.status,t2.lastmodifydate
        from ${db.schema}.t_pm_product_management t1
        join  ${db.schema}.t_wm_wallet_hist t2 
        ON t2.product_id=t1.productcatalogueid
        JOIN ${db.schema}.t_lm_app_login_detail t3
        on t3.loginid=t2.login_id
        join ${db.schema}.t_wm_wallet_info t4
        on t4.login_id=t2.login_id
        ${data.whereClause};`,[])
            .then(async function(results) {
                let count = await self.getCount(data);
                console.log("count="+count);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


module.exports.getCount = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`select count(*)
        from ${db.schema}.t_pm_product_management t1
        join  ${db.schema}.t_wm_wallet_hist t2 
        ON t2.product_id=t1.productcatalogueid
        JOIN ${db.schema}.t_lm_app_login_detail t3
        on t3.loginid=t2.login_id
        join ${db.schema}.t_wm_wallet_info t4
        on t4.login_id=t2.login_id
        ${data.whereClause}
        ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

// module.exports.statusHistory = function (data) {
//     return new Promise(function(resolve, reject) {
//         db.query(`SELECT t1.status, t1.login_id, t2.name, t1.product_id, t1.insertdate, t1.remarks
//         FROM ${db.schema}.t_wm_wallet_hist t1
//         JOIN ${db.schema}.t_lm_app_login_detail t2
//         on t1.login_id=t2.loginid
//         where t1.login_id = $1 and t1.product_id = $1;`,
//             [data.loginId,data.productId])
//             .then(function(results) {
//
//                 resolve(results);
//             })
//             .catch(function(err) {
//                 reject(err);
//             });
//     });
// }


module.exports.statusHistory = function (data) {
    console.log(data);
    return new Promise(function(resolve, reject) {
        db.query(`SELECT t1.activitydesc, t1.loginid, t1.activitymodule,
         t1.insertdate, t1.modifyby, t1.remarks, t2.name
        FROM ${db.schema}.t_lm_activity_logs t1
        JOIN ${db.schema}.t_lm_app_login_detail t2
        on t1.modifyby=t2.loginid
        where t1.loginid = $1 and t1.activitymodule = $2 ;`,
            [data.loginId,data.productId])
            .then(function(results) {

                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
