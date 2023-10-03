const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for STNK detail table
module.exports.createStnk = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_sm_stnk_verification
                (reg_no,contract_no, owner_name, brand_name, "type", model, chasis_no, image_url,color,machine_no, 
                status, remarks, userid, valid_until, insertdate, insertby, lastmodifydate, lastmodifyby)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 ,$14,$15 ,$16,$17,$18) returning *;`,
            [data.reg_no, data.contract_no, data.owner_name, data.brand_name, data.type, data.model, data.chasis_no ,data.image_url,data.color,data.machine_no,
                data.status, data.remarks,data.userid, data.valid_until,data.insertdate, data.insertby, data.lastmodifydate, data.lastmodifyby])
            .then(function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
},
module.exports.findStnk = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`Select * from ${db.schema}.t_sm_stnk_verification
            where contract_no = $1 and userid = $2;`,
            [data.contract_no,data.loginid])
            .then(function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}