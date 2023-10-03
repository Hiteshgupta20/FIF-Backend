const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for Complaint detail table
module.exports.createComplaint = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_sm_complaints
                 ("name", description, email, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, msisdn)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *;`,
            [data.name, data.description, data.email, data.category, data.status, data.remarks, data.insertdate, data.insertby,
            data.lastmodifydate, data.lastmodifyby, data.msisdn])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.findComplaint = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {

        db.query(`SELECT id, "name", description, email, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, msisdn
                  FROM ${db.schema}.t_sm_complaints 
                  ${data.whereClause} 
                  ${data.orderByClause} 
                  LIMIT $1 OFFSET $2;`,
            [data.limit, data.offset])
            .then(async function (results) {


                let count = await self.getComplaintCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.findAllComplaints = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {

        db.query(`SELECT id, "name", description, email, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, msisdn
                  FROM ${db.schema}.t_sm_complaints
                  ${data.whereClause}
                  ${data.orderByClause} ;`,
            [])
            .then(async function (results) {


                let count = await self.getComplaintCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.findComplaintById = function (complaintId) {
    var self = this;
    return new Promise(function (resolve, reject) {

        db.query(`SELECT id,"name", description, email, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, msisdn
                  FROM ${db.schema}.t_sm_complaints
                  WHERE id = $1;`,
            [complaintId])
            .then(async function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.findComplaintByUserId = function (insertby) {
    var self = this;
    return new Promise(function (resolve, reject) {

        db.query(`SELECT id,"name", description, email, category, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, msisdn
                  FROM ${db.schema}.t_sm_complaints
                  WHERE insertby = $1;`,
            [insertby])
            .then(async function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.deleteComplaint = function (complaintId) {
    var self = this;
    return new Promise(function (resolve, reject) {

        db.query(`DELETE FROM ${db.schema}.t_sm_complaints
                  WHERE  id = $1 returning id;`, [complaintId])
            .then(async function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getComplaintCount = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT count(*) FROM ${db.schema}.t_sm_complaints ${data.whereClause} ;`, [])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.updateComplaint = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_sm_complaints
                  SET name= $1, "description"= $2, email= $3, category= $4, status= $5, remarks = $6, insertdate=$7, insertby=$8, lastmodifydate=$9, lastmodifyby=$10, msisdn=$11
                  WHERE id=$12 returning *;`,
            [data.name, data.description, data.email, data.category, data.status, data.remarks, data.insertdate, data.insertby,
            data.lastmodifydate, data.lastmodifyby, data.msisdn, data.id])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getStatusList = function () {
    return new Promise(function (resolve, reject) {
        let statusList = [{
            id: 1,
            name: "New"
        }, {
            id: 2,
            name: "In Progress"
        }, {
            id: 3,
            name: "Solved"
        }
        ]
        resolve(statusList);
    });
}
// module.exports.getComplaintHistory = function (data) {
//     var self = this;
//     return new Promise(function (resolve, reject) {
//         db.query(`select * from ${db.schema}.t_sm_complaints
//             where name=$1 order by lastmodifydate DESC LIMIT 5`, [data.complaintName])
//             .then(function (results) {
//                 resolve(results);
//             })
//             .catch(function (err) {
//                 reject(err);
//             });
//     });
// }

module.exports.updateComplaintStatus = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_sm_complaints
                  SET status= $1, remarks = $2,lastmodifydate=$3, lastmodifyby=$4
                  WHERE id=$5 returning *;`,
            [data.status, data.remarks, data.lastmodifydate, data.lastmodifyby, data.id])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
