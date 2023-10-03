const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addAstraPayDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_lm_astra_pay
                    (loginid, msisdn, status, balance, insertdate, modifydate )
                    VALUES($1, $2, $3, $4, $5, $6) returning *;`,
            [data.loginId, data.msisdn, data.status, data.balance, data.insertDate, data.modifyDate])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.modifyAstraPayDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_lm_astra_pay
                   SET balance = $1, modifydate = $2
                   WHERE loginid = $3 returning loginid;`,
            [data.balance, data.modifyDate,data.loginId])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.resynchAstraPayDetails = function (data) {
    return new Promise(function(resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_lm_astra_pay
                   SET balance = $1, modifydate = $2
                   WHERE loginid = $3 returning loginid;`,
            [data.balance, data.modifyDate, data.loginId])
            .then(function(results) {

                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.changeAstraPayStatus = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_lm_astra_pay
                   SET status = $1, astrapaymobileno = $2, modifydate = $3
                   WHERE loginid = $4 returning *;`,
            [data.status,data.astrapaymobileno, data.modifyDate, data.loginId])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAstraPayDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_lm_astra_pay WHERE 
        loginid=$1;`,
            [data.loginId])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
