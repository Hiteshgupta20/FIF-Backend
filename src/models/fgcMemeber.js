const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addMember = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_fgc_member_details
                    (status, insertdate, insertby, member_info, userid, cust_no, id_no)
                    VALUES($1, $2, $3, $4, $5, $6, $7) 
                    ON CONFLICT (userid) DO UPDATE SET cust_no = EXCLUDED.cust_no ,id_no = EXCLUDED.id_no, status = EXCLUDED.status 
                    returning *;`,
            [data.status, data.insertdate, data.insertby, data.member_info, data.userid, data.custNo, data.idNo])
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
        
        db.query(`SELECT *
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
module.exports.updateMemberDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_fgc_member_details
                    SET status=$1, member_info=$2
                    WHERE userid = $3 returning *;`,
            [data.status,data.member_info,data.userid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateMemberSataus = function (data) {
    return new Promise(function(resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fgc_member_details
                    SET status=$1
                    WHERE userid = $2 returning *;`,
            [data.memberStatus, data.userid])
            .then(function(results) {

                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateMemberQRCode = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_fgc_member_details
                    SET qrcode=$1
                    WHERE userid = $2 returning *;`,
            [data.qrcode,data.userid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.deleteMember = function (userId) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`DELETE FROM ${db.schema}.t_fgc_member_details
                  WHERE  userid = $1 returning userid;`,[userId])
            .then(async function(results) {

                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getMemberRequests = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT *
                    FROM ${db.schema}.t_fgc_member_details 
                    WHERE status = '1' ;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.upgradeMember = function (data) {
    let self = this;
    return new Promise(function(resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_fgc_upgrademember_details
                    (member_no, ktp_id, billing_address, province, city, sub_district, village, post_code, job, income, status, 
                    remarks, insertdate, insertby, lastmodifydate, lastmodifyby, home_status, userid, doc_path, rt, rw, "name", phone_no, email, dob, address)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,$22,$23,$24,$25,$26) returning *;`,
                  [data.member_no,data.ktp_id,data.billing_address,data.province,data.city,data.sub_district,data.village,data.post_code,
                    data.job,data.income,data.status,data.remarks,data.insertdate,data.insertby,data.lastmodifydate,
                    data.lastmodifyby,data.home_status,data.userid,data.doc_path,data.rt,data.rw,data.name,data.phone_no,data.email,data.dob,data.address])
            .then(function(results) {
                if(results[0] ){

                 let obj = Object.assign({},results[0]);
                 let data = updateMembershipStatus(obj);
                    self.updateMemberSataus(data);
                }

                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findMember = function (data) {
    let self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, member_no, ktp_id, address, province, city, sub_district, village, post_code, job, income, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, "name", phone_no, email, dob,userid, home_status, billing_address
                    FROM ${db.schema}.t_fgc_upgrademember_details
                    ${data.whereClause} ${data.orderByClause} LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
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
    let self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, member_no, ktp_id, address, province, city, sub_district, village, post_code, job, income, status, remarks, insertdate, insertby, lastmodifydate, lastmodifyby, "name", phone_no, email, dob,userid, home_status, billing_address
                    FROM ${db.schema}.t_fgc_upgrademember_details ${data.whereClause}
                     ${data.orderByClause} ;`,[])
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
    let self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_fgc_upgrademember_details
        SET  status = $1, lastmodifyby = $2, remarks = $3, lastmodifydate = $4
        WHERE id = $5 returning *;`,
            [data.status, data.modifyBy, data.notes, data.modifyDate, data.id])
            .then(function(results) {
                console.log(results);
                if(results[0] ){
                    let data = updateMembershipStatus(results[0]);
                    self.updateMemberSataus(data);
                }
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateStatusByMemberNo = function (data) {
    let self = this;
    return new Promise(function(resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fgc_upgrademember_details
        SET  status = $1, lastmodifyby = $2, remarks = $3, lastmodifydate = $4
        WHERE member_no = $5 and status ='1' returning *;`,
            [data.status, data.modifyBy, data.notes, data.modifyDate, data.member_no])
            .then(function(results) {
                if(results[0] ){
                    let data = updateMembershipStatus(results[0]);
                    self.updateMemberSataus(data);
                }
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
function updateMembershipStatus(data) {
    if(data.status == 1){
        data.memberStatus = 3;
    }
    else if(data.status == 2){
        data.memberStatus = 4;
    }
    else {
        data.memberStatus = 2;
    }
    return data;
}