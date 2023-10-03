const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for ChangeOwnership detail table
module.exports.createChangeOwnership = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_sm_change_ownership
                 ("name",stnk_bpkb_name, description, email, phn_no, contract_no, branch, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby )
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 ,$14) returning *;`,
            [data.name,data.stnk_bpkb_name, data.description, data.email, data.msisdn, data.contractNo ,data.branch, data.category, data.status,
                data.remarks, data.insertdate, data.insertby, data.lastmodifydate, data.lastmodifyby])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findChangeOwnership = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, "name", description, email, phn_no, contract_no, branch, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby
                  FROM ${db.schema}.t_sm_change_ownership 
                  ${data.whereClause} 
                  ${data.orderByClause} 
                  LIMIT $1 OFFSET $2;`,
            [data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getChangeOwnershipCount(data);
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

module.exports.findAllChangeOwnership = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`SELECT id, "name", description, email, phn_no, contract_no, branch, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby
                  FROM ${db.schema}.t_sm_change_ownership 
                  ${data.whereClause};`,
            [])
            .then(async function(results) {


                let count = await self.getChangeOwnershipCount(data);
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

module.exports.findChangeOwnershipById = function (complaintId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id,"name", description, email, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, msisdn
                  FROM ${db.schema}.t_sm_change_ownership
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

module.exports.deleteChangeOwnership = function (complaintId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_sm_change_ownership
                  WHERE  id = $1 returning id;`,[complaintId])
            .then(async function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getChangeOwnershipCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_sm_change_ownership ${data.whereClause} ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.updateChangeOwnership = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_sm_change_ownership
                  SET "name"=$1, description=$2, email=$3, phn_no=$4, contract_no=$5, branch=$6, category=$7, status=$8, remarks=$9,  lastmodifydate=$10, lastmodifyby=$11
                  WHERE id=$12 returning *;`,
            [data.name, data.description, data.email, data.msisdn, data.contractNo ,data.branch, data.category, data.status,
                data.remarks, data.lastmodifydate, data.lastmodifyby, data.id])
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

module.exports.updateChangeOwnershipStatus = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_sm_change_ownership
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