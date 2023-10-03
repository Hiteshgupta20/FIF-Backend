const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.getHelpContentTypeList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, name FROM ${db.schema}.t_ma_help_categories;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getFaqCategoryList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, name, abbr FROM ${db.schema}.t_ma_faq_categories;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.addHelpContent = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_help_content
                    (type, title, description, children, insertdate,
                     insertby, lastmodifydate, lastmodifyby, faqcategory)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *;`,
            [data.type, data.title, data.description, data.children, data.insertdate,
                data.insertby, data.lastmodifydate, data.lastmodifyby, data.faqcategory])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                if (err.code = '23505'){
                    reject(new Error("Content with this title and type already exists."))
                }
                else {
                    reject(err);
                }
            });
    });
}

module.exports.updateHelpContent = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_ma_help_content
                SET  type= $1, title= $2, description=$3, children=$4, lastmodifydate=$5, lastmodifyby=$6, faqcategory=$7
                WHERE id = $8 returning id;`,
            [data.type, data.title, data.description, data.children, data.lastmodifydate, data.lastmodifyby, data.faqcategory, data.id])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteHelpContent = function (id) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_ma_help_content
            WHERE id = $1 returning id;`,
            [id])
            .then(async function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getHelpContentList = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT id, faqcategory, type, title, description, children, insertdate, insertby FROM ${db.schema}.t_ma_help_content
        ${data.whereClause} 
             ${data.orderByClause}
             LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
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

module.exports.getAllHelpContentList = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT id, faqcategory, type, title, description, children, insertdate, insertby FROM ${db.schema}.t_ma_help_content
        ${data.whereClause};`,[])
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

module.exports.getTotalCount = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_ma_help_content ${data.whereClause};`,[])
            .then(function(results) {
                console.log("count="+results[0].count);
                resolve(results[0].count);
            })
            .catch(function(err) {
                console.log("error="+err);
                reject(0);
            });
    });
}
