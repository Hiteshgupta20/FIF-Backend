const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

// methods for otp detail table

module.exports.createOtp = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_otp_details (entity,otp, otptype, insertdate, expirydate, resendotpvaliddate)
                    VALUES( $1, $2, $3, $4 ,$5, $6 ) returning *;`,
            [data.msisdn, data.otp, data.otptype, data.insertdate, data.expirydate, data.resendotpvaliddate])
            .then(function (result) {
                resolve(result[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateOtp = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_otp_details SET otp=$1, otptype=$2, insertdate= $3, expirydate= $4, resendotpvaliddate= $5 WHERE entity= $6 returning *;`,
            [data.otp, data.otptype, data.insertdate, data.expirydate, data.resendotpvaliddate, data.msisdn])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateOtpEmail = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_otp_details SET otp=$1, otptype=$2, insertdate= $3, expirydate= $4 WHERE entity= $5 returning *;`,
            [data.otp, data.otptype, data.insertdate, data.expirydate, data.msisdn])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.createOtpLimitDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_otp_limit_details (msisdn, insertdate, module, count)
                    VALUES( $1, $2, $3, $4 ) returning *;`,
            [data.msisdn, data.insertdate, data.module, 1])
            .then(function (result) {
                resolve(result[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateOtpLimitDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_otp_limit_details SET count= count + 1, insertdate = $3 WHERE 
                msisdn = $1 AND module = $2 and insertdate::date = $3 returning *;`,
            [data.msisdn, data.module, data.insertdate])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getOtpLimitDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count from ${db.schema}.t_otp_limit_details WHERE 
                msisdn = $1 and module=$2 and insertdate::date = $3;`,
            [data.msisdn,data.module, data.insertdate])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteOtp = function (msisdn) {
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_otp_details WHERE entity=$1 returning entity;`,
            [msisdn])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}



module.exports.getOtpByMsisdn = function (data,payload) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_otp_details where "entity" = $1`,
            [data])
            .then(function(results) {
                //byPassOTP(payload,resolve);
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function byPassOTP(payload,resolve) {
    if(true && payload){
        var today = new Date();
        today.setYear(today.getFullYear()+1);
        let record = {
            otp : payload.token,
            expirydate : util.getTimestamp(today)
        }
        return resolve(record);
    }
}
