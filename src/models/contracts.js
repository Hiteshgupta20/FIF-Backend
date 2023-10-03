const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addHistory = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_ma_sync_contract_history
                    (loginid, insertdate, ktpno, contractno)
                    VALUES($1, now(), $2, $3) returning *;`,
            [data.loginId, data.ktpNo, data.contractNo])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.addInstallmentsPointsData = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_rm_installments_points
                    (contractno, loginid, custno, installmentno, seqNo, paiddate, totalcustpaid, paidstatus,
                        pointeligible, insertdate)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *;`,
            [data.contractno, data.loginid, data.custno, data.installmentno, data.seqNo,
            data.paiddate, data.totalcustpaid, data.paidstatus, data.pointeligible, data.insertdate
            ])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.checkIfPointsCreditedForInstallmentOnTime = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT loginid from ${db.schema}.t_rm_installments_points
                    where contractno = $1 and installmentno = $2 and seqno= $3`,
            [data.contractNo, data.installmentNo, data.seqNo])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getSyncContractsHistory = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT loginid, insertdate, ktpno FROM ${db.schema}.t_ma_sync_contract_history WHERE loginid=$1 ORDER BY "insertdate"::timestamp DESC LIMIT $2 OFFSET $3;`,
            [data.loginId, 10, 0])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

// module.exports.checkIfPointsCreditedForInstallmentOnTime = function (data) {
//     return new Promise(function(resolve, reject) {

//         db.query(`SELECT loginid from ${db.schema}.t_rm_installments_points
//                     where loginid = $1 and contractno = $2 and duedate= $3`,
//             [data.loginid, data.contractno, data.duedate])
//             .then(function(results) {

//                 resolve(results);
//             })
//             .catch(function(err) {
//                 reject(err);
//             });
//     });
// }

module.exports.getLastSyncContractsHistory = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT loginid, insertdate, ktpno, contractno FROM ${db.schema}.t_ma_sync_contract_history WHERE loginid=$1 ORDER BY "insertdate"::timestamp DESC LIMIT 1 OFFSET 0;`,
            [data.loginId])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getInstallmentsPointsData = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_rm_installments_points WHERE loginid=$1 AND contractno=$2 AND duedate=$3;`,
            [data.loginid, data.contractno, data.duedate])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getSyncedCustomers = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT loginid, insertdate, custmainno FROM ${db.schema}.t_lm_app_login_detail WHERE custmainno IS NOT NULL;`,
            [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}