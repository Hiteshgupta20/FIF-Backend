const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addCreditApplicationData = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_customer_credit_applications
                    (status, insertdate, insertby, userid, refno)
                    VALUES($1, $2, $3, $4, $5) returning *;`,
            [data.status, data.insertdate, data.insertby, data.userid, data.refno])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getMemberInfo = function (userId) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT member_info
                    FROM ${db.schema}.t_fgc_member_details 
                    WHERE userid = $1;`,
            [userId])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateCreditApplicationData = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_ma_customer_credit_applications
                    SET status=$1
                    WHERE userid = $2 AND refno = $3;`,
            [data.status,data.userId,data.refNo])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getCreditApplicationRequests = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT *
                    FROM ${db.schema}.t_ma_customer_credit_applications 
                    WHERE status = '1' OR status = '3';`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getCreditApplicationRequestByRefNo = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT *
                    FROM ${db.schema}.t_ma_customer_credit_applications 
                    WHERE refno = $1;`,
            [data.refNo])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


module.exports.findMember = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, member_no, ktp_id, address, province, city, districts, village, post_code, job, income, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, "name", phone_no, email, dob,userid, home_status, billing_address
FROM fiftest.t_fgc_upgrademember_details
 ${data.whereClause} ORDER BY "insertdate"::timestamp DESC LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getMemberCount(data);
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
module.exports.getMemberCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_fgc_upgrademember_details ${data.whereClause} ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}
module.exports.findAllMembers = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, member_no, ktp_id, address, province, city, districts, village, post_code, job, income, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, "name", phone_no, email, dob, userid, home_status, billing_address
FROM fiftest.t_fgc_upgrademember_details ${data.whereClause}
                     ORDER BY "insertdate"::timestamp DESC ;`,[])
            .then(async function(results) {
                
                let response = {
                    "data" : results,
                    totalRecords : results.length
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateStatus = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_fgc_upgrademember_details
        SET  status = $1, lastmodifyby = $2, remarks = $3, lastmodifydate = $4
        WHERE id = $5 returning *;`,
            [data.status, data.modifyBy, data.notes, data.modifyDate, data.id])
            .then(function(results) {
                console.log(results);
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
