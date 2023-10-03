const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for Claim detail table
module.exports.createClaim = function (data) {
    return new Promise(function(resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_sm_claim_insurance
                 (username, drivername, "type", contract_no, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, phoneno,
                  eventdate, purpose, incidentlocation, useraddress, cause, simnumber, simvalidity)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ,$11,$12,$13,$14,$15,$16,$17,$18) returning *;`,
            [data.username, data.drivername,data.type, data.contract_no, data.status , data.remarks,data.insertdate,
                data.insertby, data.lastmodifydate, data.lastmodifyby, data.phoneno,data.eventdate,
                data.purpose,data.incidentlocation, data.useraddress, data.cause , data.simnumber,data.simvalidity])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findClaim = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_sm_claim_insurance 
                  ${data.whereClause} 
                  ${data.orderByClause}
                  LIMIT $1 OFFSET $2;`,
            [data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getClaimCount(data);
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

module.exports.findAllClaim = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`SELECT * FROM ${db.schema}.t_sm_claim_insurance 
                  ${data.whereClause} ;`,
            [])
            .then(async function(results) {


                let count = await self.getClaimCount(data);
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

module.exports.findClaimById = function (complaintId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id,"name", description,type, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, phn_no as msisdn
                  FROM ${db.schema}.t_sm_claim_insurance
                  WHERE id = $1;`,
            [complaintId])
            .then(async function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteClaim = function (claimId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_sm_claim_insurance
                  WHERE  id = $1 returning id;`,[claimId])
            .then(async function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getClaimCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_sm_claim_insurance ${data.whereClause} ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.updateClaim = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_sm_claim_insurance
                  SET "name"=$1, description=$2,type=$10,  phn_no=$3, contract_no=$4,  status=$5, remarks=$6,  lastmodifydate=$7, lastmodifyby=$8
                  WHERE id=$9 returning *;`,
            [data.name, data.description, data.msisdn, data.contractNo ,data.status,
                data.remarks, data.lastmodifydate, data.lastmodifyby, data.id,data.type])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getStatusList = function () {
    return new Promise(function(resolve, reject) {
        let statusList =[{
            id : 1,
            name : "New"
        },{
            id : 2,
            name : "In Progress"
        },{
            id : 3,
            name : "Completed"
        },{
            id : 4,
            name : "Cancelled"
        }
        ]
        resolve(statusList);
    });
}

module.exports.updateClaimStatus = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_sm_claim_insurance
                  SET status= $1, remarks = $2,lastmodifydate=$3, lastmodifyby=$4
                  WHERE id=$5 returning *;`,
            [data.status ,data.remarks,data.lastmodifydate, data.lastmodifyby, data.id])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}