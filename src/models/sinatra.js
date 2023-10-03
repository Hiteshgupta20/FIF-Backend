const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for Sinatra detail table
module.exports.createSinatra = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_sm_sinatra_insurance
("name", description, dob, requext_for, status, remarks, insertdate, insertby, lastmodifydate,
 lastmodifyby, ktp_id, village, place_of_birth, gender, 
 address, province, city, districts, rt, rw, post_code, phone)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,$14,$15,$16,$17,$18,$19,$20,$21,$22 ) returning *;`,
            [data.name, data.description, data.dob,data.request_for, data.status, data.remarks ,data.insertdate, data.insertby, data.lastmodifydate,
                data.lastmodifyby, data.ktp_id, data.village, data.place_of_birth, data.gender,
                data.address, data.province, data.city, data.districts, data.rt,data.rw,data.post_code,data.phone])

            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findSinatra = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, "name", description, dob, requext_for, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, ktp_id, village as kelurahan, place_of_birth, gender, address, province, city, districts as subdistrict, rt, rw, post_code, phone
                  FROM ${db.schema}.t_sm_sinatra_insurance
                  ${data.whereClause} 
                  ${data.orderByClause} 
                  LIMIT $1 OFFSET $2;`,
            [data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getSinatraCount(data);
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

module.exports.findAllSinatra = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`SELECT id, "name", description, dob, requext_for, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, ktp_id, village as kelurahan, place_of_birth, gender, address, province, city, districts as subdistrict, rt, rw, post_code, phone
                  FROM ${db.schema}.t_sm_sinatra_insurance
                  ${data.whereClause};`,
            [])
            .then(async function(results) {


                let count = await self.getSinatraCount(data);
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

module.exports.findSinatraById = function (loginId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, "name", description, dob, requext_for, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, ktp_id, village, place_of_birth, gender, address, province, city, districts, rt, rw, post_code, phone
                  FROM ${db.schema}.t_sm_sinatra_insurance
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

module.exports.findSinatraByLoginid = function (loginId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, "name", description, dob, requext_for, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, ktp_id, village, place_of_birth, gender, address, province, city, districts, rt, rw, post_code, phone
                  FROM ${db.schema}.t_sm_sinatra_insurance
                  WHERE insertby = $1;`,
            [loginId])
            .then(async function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteSinatra = function (sinatraId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_sm_sinatra_insurance
                  WHERE  id = $1 returning id;`,[sinatraId])
            .then(async function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getSinatraCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_sm_sinatra_insurance ${data.whereClause} ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.updateSinatra = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_sm_sinatra_insurance
                    SET "name"=$1, description=$2, dob=$3, requext_for=$4, status=$5, remarks=$6,
                    lastmodifydate=$7, lastmodifyby=$8, ktp_id=$9, village=$10, place_of_birth=$11, gender=$12, address=$13, province=$14,
                    city=$15, districts=$16, rt=$17, rw=$18, post_code=$19, phone=$20
                    WHERE id=$21 returning *;`,
            [data.name, data.description, data.dob,data.request_for, data.status, data.remarks , data.lastmodifydate,
                data.lastmodifyby, data.ktp_id, data.village, data.place_of_birth, data.gender,
                data.address, data.province, data.city, data.districts, data.rt,data.rw,data.post_code,data.phone,data.id])
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
    });s
}

module.exports.updateSinatraStatus = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_sm_sinatra_insurance
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