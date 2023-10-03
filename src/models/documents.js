const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addDocument = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_documents
                    (code, title, modules, mandatoryfor, description, insertdate,
                     insertby, modifydate, modifyby)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *;`,
            [data.code, data.title, data.modules, data.mandatoryfor, data.description , data.insertdate,
                data.insertby, data.modifydate, data.modifyby])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.addCustomerDocumentDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_rm_customer_documents
                    (custid, idcode, idsubcode, idno, idname, birthplace, birthdate, gender, 
                    ktpaddress, ktpsubdistrict, ktpvillage, ktpcity, ktpprovince, ktpneighbourhood, ktphamlet, ktpzipcode,
                    stayaddress, staysubdistrict, stayvillage, staycity, stayprovince, stayneighbourhood, stayhamlet, stayzipcode,
                    billingaddress, billingsubdistrict, billingvillage, billingcity, billingprovince, billingneighbourhood, billinghamlet, billingzipcode,
                    idpath)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                    $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33) returning *;`,
               [data.custid, data.idcode, data.idsubcode, data.idno, data.idname, data.birthplace , data.birthdate, data.gender,
                   data.ktpaddress, data.ktpsubdistrict, data.ktpvillage, data.ktpcity, data.ktpprovince, data.ktpneighbourhood, data.ktphamlet, data.ktpzipcode,
                   data.stayaddress, data.staysubdistrict, data.stayvillage, data.staycity, data.stayprovince, data.stayneighbourhood, data.stayhamlet, data.stayzipcode,
                   data.billingaddress, data.billingsubdistrict, data.billingvillage, data.billingcity, data.billingprovince, data.billingneighbourhood, data.billinghamlet, data.billingzipcode,
                   data.idpath])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getDocumentList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT code, title, modules, mandatoryfor, description, insertdate FROM ${db.schema}.t_ma_documents;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getCustomerDocumentDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT custid, idcode, idsubcode, idno, idname FROM ${db.schema}.t_rm_customer_documents
        WHERE custid=$1 AND idcode=$2 AND idsubcode=$3;`,
            [data.loginId, data.docCode, data.docSubCode])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getSourceList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, source, shortcode FROM ${db.schema}.t_rm_document_sources;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteDocument = function (docCode) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_ma_documents
            WHERE code = $1 returning code;`,
            [docCode])
            .then(async function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateDocument = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_ma_documents
                SET  title= $1, modules=$2, mandatoryfor=$3, description=$4, modifydate=$5, modifyby=$6
                WHERE code = $7 returning code;`,
            [data.title, data.modules, data.mandatoryfor, data.description, data.modifydate, data.modifyby,data.code])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateCustomerDocumentDetails = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_rm_customer_documents
                    SET idno= $1, idname= $2, birthplace= $3, birthdate= $4, gender= $5, 
                     ktpaddress= $6, ktpsubdistrict= $7, ktpvillage= $8, ktpcity= $9, ktpprovince= $10, ktpneighbourhood= $11, ktphamlet= $12, ktpzipcode= $13,
                    stayaddress= $14, staysubdistrict= $15, stayvillage= $16, staycity= $17, stayprovince= $18, stayneighbourhood= $19, stayhamlet= $20, stayzipcode= $21,
                    billingaddress= $22, billingsubdistrict= $23, billingvillage= $24, billingcity= $25, billingprovince= $26, billingneighbourhood= $27, billinghamlet= $28, billingzipcode= $29,
                    idpath= $30
                    WHERE custid= $31 AND idcode=$32 AND idsubcode=$33 returning custid;`,
            [data.idno, data.idname, data.birthplace , data.birthdate, data.gender,
                data.ktpaddress, data.ktpsubdistrict, data.ktpvillage, data.ktpcity, data.ktpprovince, data.ktpneighbourhood, data.ktphamlet, data.ktpzipcode,
                data.stayaddress, data.staysubdistrict, data.stayvillage, data.staycity, data.stayprovince, data.stayneighbourhood, data.stayhamlet, data.stayzipcode,
                data.billingaddress, data.billingsubdistrict, data.billingvillage, data.billingcity, data.billingprovince, data.billingneighbourhood, data.billinghamlet, data.billingzipcode,
                data.idpath, data.custid, data.idcode, data.idsubcode])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAllCustomerDocuments = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT c.custid, l.name, array_agg(d.code) as "codes", array_agg(d.title) as "titles" FROM 
        ${db.schema}.t_ma_documents d INNER JOIN ${db.schema}.t_rm_customer_documents c ON c.idcode = d.code 
        INNER JOIN ${db.schema}.t_lm_app_login_detail l on c.custid =  l.loginid
        ${data.whereClause} 
        GROUP BY c.custid,l.name, l.insertdate, l.name
        ${data.orderByClause}
        LIMIT $1 OFFSET $2;`,
            [data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getTotalCount(data);
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

module.exports.getAllExportCustomerDocuments = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`SELECT c.custid, l.name, array_agg(d.code) as "codes", array_agg(d.title) as "titles" FROM 
        ${db.schema}.t_ma_documents d INNER JOIN ${db.schema}.t_rm_customer_documents c ON c.idcode = d.code 
        INNER JOIN ${db.schema}.t_lm_app_login_detail l on c.custid =  l.loginid
        ${data.whereClause} 
        GROUP BY c.custid,l.name, l.insertdate, l.name;`,
            [])
            .then(async function(results) {
                let count = await self.getTotalCount(data);
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

module.exports.getCustomerDocuments = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT c.custid, c.idpath, c.idno, c.idname, c.idsubcode, c.birthplace, c.birthdate, c.gender,
        c.ktpaddress, c.ktpsubdistrict, c.ktpvillage, c.ktpcity, c.ktpprovince, c.ktpneighbourhood, c.ktphamlet, c.ktpzipcode,
                c.stayaddress, c.staysubdistrict, c.stayvillage, c.staycity, c.stayprovince, c.stayneighbourhood, c.stayhamlet, c.stayzipcode,
                c.billingaddress, c.billingsubdistrict, c.billingvillage, c.billingcity, c.billingprovince, c.billingneighbourhood, c.billinghamlet, c.billingzipcode,
        d.code, d.title, d.description, d.mandatoryfor, d.modules 
        FROM ${db.schema}.t_rm_customer_documents c INNER JOIN ${db.schema}.t_ma_documents d ON c.idcode = d.code
        WHERE c.custid = $1;`,
            [data.loginId])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getCustomerDocInfo = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT custid, idpath, idno, idname, idsubcode, birthplace, birthdate, gender,
        ktpaddress, ktpsubdistrict, ktpvillage, ktpcity, ktpprovince, ktpneighbourhood, ktphamlet, ktpzipcode,
        stayaddress, staysubdistrict, stayvillage, staycity, stayprovince, stayneighbourhood, stayhamlet, stayzipcode,
        billingaddress, billingsubdistrict, billingvillage, billingcity, billingprovince, billingneighbourhood, billinghamlet, billingzipcode
        FROM ${db.schema}.t_rm_customer_documents
        WHERE custid = $1 AND idcode = $2;`,
            [data.loginId, data.docCode])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getTotalCount = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`SELECT c.custid, l.name, array_agg(d.code), array_agg(d.title) FROM 
        ${db.schema}.t_ma_documents d INNER JOIN ${db.schema}.t_rm_customer_documents c ON c.idcode = d.code 
        INNER JOIN ${db.schema}.t_lm_app_login_detail l on c.custid =  l.loginid ${data.whereClause}
        GROUP BY c.custid, l.name;`,[])
            .then(function(results) {
                // console.log("count="+results[0].count);
                resolve(results.length);
            })
            .catch(function(err) {
                console.log("error="+err);
                reject(0);
            });
    });
}
