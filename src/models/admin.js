const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addBank = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_bank_info
                    (bankname, bankdesc, accountno, accountname, accounttype, banklogo, instruction, insertdate,
                     insertby, lastmodifydate, lastmodifyby)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *;`,
            [data.bankname, data.bankdesc, data.accountno, data.accountname, data.accounttype ,data.banklogo, data.instruction, data.insertdate,
                data.insertby, data.lastmodifydate, data.lastmodifyby])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getBankList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT bankid, bankname, banklogo FROM ${db.schema}.t_ma_bank_info;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getBankDetail = function (bankId) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT bankid, bankname, bankdesc, accountno, accountname, accounttype, banklogo, instruction, insertdate,
                    insertby, lastmodifydate, lastmodifyby
                    FROM ${db.schema}.t_ma_bank_info
                    WHERE bankid = $1;`,
            [bankId])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.deleteBank = function (bankId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_ma_bank_info 
            WHERE bankid = $1 returning bankid;`,
            [bankId])
            .then(async function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateBankDetail = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_ma_bank_info
                SET  bankname= $1, bankdesc= $2, accountno=$3, accountname=$4, accounttype=$5, banklogo=$6, instruction=$7, lastmodifydate=$8, lastmodifyby=$9
                WHERE bankid = $10 returning bankid;`,
            [data.bankname, data.bankdesc, data.accountno, data.accountname, data.accounttype ,data.banklogo, data.instruction, data.lastmodifydate, data.lastmodifyby,data.bankid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

