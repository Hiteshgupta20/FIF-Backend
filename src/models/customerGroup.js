const Promise = require('promise');
const db = require('../config/pg-db');
const utils = require('../controllers/util');
const logger = require('../config/logging');
const { data } = require('../config/logging');

module.exports.getCustomerGroupList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_cg_customer_group
        ${data.whereClause} 
            ${data.orderByClause}
            LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getCustomerGroupCount(data);
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

module.exports.getAllCustomerGroupList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_cg_customer_group
        ${data.whereClause};`, [])
            .then(async function (results) {
                let count = await self.getCustomerGroupCount(data);
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

module.exports.getCustomerGroupInfoByGroupId = function (groupArr) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT customer_list FROM ${db.schema}.t_cg_customer_group
        WHERE groupid IN (${groupArr});`, [])
            .then(async function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.getGroupIds = function (loginId) {
    return new Promise(function (resolve, reject) {
        db.query(`select groupid 
FROM ${db.schema}.t_cg_customer_group
CROSS JOIN jsonb_array_elements(customer_list)
WHERE value->>'loginid' IN ('${loginId}');`, [])
            .then(async function (results) {
                console.log(results)
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getCustomerGroupCount = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_cg_customer_group ${data.whereClause};`, [])
            .then(function (results) {
                console.log("count=" + results[0].count);
                resolve(results[0].count);
            })
            .catch(function (err) {
                console.log("error=" + err);
                reject(0);
            });
    });
}

module.exports.addCustomerGroup = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_cg_customer_group
("name", status, insertdate, insertby, "filter", lastmodifieddate, lastmodifiedby, customer_list,"isexcelupload",excelfileid)
VALUES( $1, $2, $3, $4, $5, $6, $7, $8 ,$9,$10) returning groupid;`,
            [data.name, data.status, data.insertdate, data.insertby, data.filter,
            data.lastmodifieddate, data.lastmodifiedby, data.customer_list, data.isexcelupload, data.excelFileId])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateCustomerGroup = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_cg_customer_group
                    SET "name"=$1, status=$2, "filter"=$3, 
                    lastmodifieddate=$4, lastmodifiedby=$5, customer_list=$6
                    WHERE groupid=$7 returning groupid;`,
            [data.name, data.status, data.filter, data.lastmodifieddate,
            data.lastmodifiedby, data.customer_list, data.groupId])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.deleteCustomerGroup = function (groupId) {
    return new Promise(function (resolve, reject) {

        db.query(`DELETE FROM ${db.schema}.t_cg_customer_group
            WHERE groupid = $1 returning groupid;`,
            [groupId])
            .then(async function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.uploadFile = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_cg_customer_group_excel
             ( "filepath",loginid,insertdate,status)
             VALUES($1, $2, $3,$4) returning *;`,
            [data.filepath, data.loginid, data.insertdate, data.status])
            .then(function (result) {

                logger.info("uploaded file : ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {

                logger.error("Error while uploading file : ", err);
                reject(err);
            });
    });
}

module.exports.getCustomerGroupUploadedData = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT cust_list FROM ${db.schema}.t_cg_customer_group_excel where id = $1 ;`, [data])
            .then(async function (results) {
                let count = await self.getuploadedDataCount(data);
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

module.exports.getuploadedDataCount = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT count(cust_list) FROM ${db.schema}.t_cg_customer_group_excel  ;`, [])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getAllExcelFiles = function () {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT * FROM ${db.schema}.t_cg_customer_group_excel where status = '0' 
                 `, [])
            .then(async function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getExcelCustomers = function (groupId) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT customer_list FROM ${db.schema}.t_cg_customer_group where groupid = $1
                 `, [groupId])
            .then(async function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateCustomerGroupExcelFilesStatus = function (data, response) {
    return new Promise(function (resolve, reject) {
        //
        db.query(`UPDATE ${db.schema}.t_cg_customer_group_excel
                  SET  status = $1 , cust_list = $2 WHERE id=$3 ;`,
            [data.status, data.cust_list, data.id])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

