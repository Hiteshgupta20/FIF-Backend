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

module.exports.bankDetailsList = function(data){
    var self = this;
    return new Promise(function(resolve,reject){
        let basicQuery = `select bankid,bankname,accountno,accountname,banklogo,instruction from ${db.schema}.t_ma_bank_info`;
        let finalQuery = {
            name : `list-bank-details-all`,
            text : `${basicQuery} ${data.orderByClause} LIMIT $1 OFFSET $2;`,
            values: [data.limit,data.offset]
        };

        if(data.searchParams){
            let searchParams = data.searchParams;

            if(searchParams.bankName){
                finalQuery = {
                    name : `list-bank-details-bank-name`,
                    text : `${basicQuery} where LOWER(bankname) ilike LOWER($1) ${data.orderByClause} LIMIT $2 OFFSET $3`,
                    values: [searchParams.bankName+"%",data.limit,data.offset]
                }
            }
        }

        db.query(finalQuery)
            .then(async function(results) {
                
                let count = await self.getBankDetailsListCount(data);

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

module.exports.allBankDetailsList = function(data){
    var self = this;
    return new Promise(function(resolve,reject){
        let basicQuery = `select bankid,bankname,accountno,accountname,banklogo,instruction from ${db.schema}.t_ma_bank_info`;
        let finalQuery = {
            name : `list-bank-details-all`,
            text : `${basicQuery};`,
            values: [data.limit,data.offset]
        };

        if(data.searchParams){
            let searchParams = data.searchParams;

            if(searchParams.bankName){
                finalQuery = {
                    name : `list-bank-details-bank-name`,
                    text : `${basicQuery} where LOWER(bankname) ilike LOWER($1)`,
                    values: [searchParams.bankName+"%",data.limit,data.offset]
                }
            }
        }

        db.query(finalQuery)
            .then(async function(results) {

                let count = await self.getBankDetailsListCount(data);

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

module.exports.getBankDetailsListCount = function(data){

    return new Promise(function(resolve,reject){
        let basicQuery = `select count(*) from ${db.schema}.t_ma_bank_info`;
        let finalQuery = {
            name : `list-bank-details-all-count`,
            text : `${basicQuery}`
        };

        if(data.searchParams){
            let searchParams = data.searchParams;

            if(searchParams.bankName){
                finalQuery = {
                    name : `list-bank-details-bank-name-count`,
                    text : `${basicQuery} where LOWER(bankname) ilike LOWER($1)`,
                    values: [searchParams.bankName+"%"]
                }
            }
        }

        db.query(finalQuery)
        .then(function(results) {
            resolve(results[0].count);
        })
        .catch(function(err) {
            reject(0);
        });
    });
}

module.exports.checkBankNameUnique = function(data){
    return new Promise(function(resolve,reject){
        let basicQuery = `select count(*) from ${db.schema}.t_ma_bank_info where LOWER(bankname)=LOWER($1)`;
        let finalQuery = {
            name : `check-unique-bank-name-add-new`,
            text : `${basicQuery};`,
            values: [data.bankname]
        };

        if(data.bankid){
            finalQuery = {
                name : `check-unique-bank-name-update-bank`,
                text : `${basicQuery} AND bankid!=$2`,
                values: [data.bankname,data.bankid]
            }
        }

        db.query(finalQuery)
        .then(function(results) {
            resolve(results[0].count);
        })
        .catch(function(err) {
            reject(0);
        });
    });
}
