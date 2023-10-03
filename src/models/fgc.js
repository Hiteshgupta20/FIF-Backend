const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.getFGCContentTypeList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT shortcode, name FROM ${db.schema}.t_ma_fgc_content;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.addContent = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_fgc_content_details
                    (type, title, description, images, insertdate,
                     insertby, lastmodifydate, lastmodifyby)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8) returning *;`,
            [data.type, data.title, data.description, data.images, data.insertdate,
                data.insertby, data.lastmodifydate, data.lastmodifyby])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateContent = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_fgc_content_details
                SET  type= $1, title= $2, description=$3, images=$4, lastmodifydate=$5, lastmodifyby=$6
                WHERE id = $7 returning id;`,
            [data.type, data.title, data.description, data.images, data.lastmodifydate, data.lastmodifyby,data.id])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteContent = function (id) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_fgc_content_details
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

module.exports.getContentList = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT d.id, c.name, d.type ,d.title, d.description, d.images, d.insertby FROM ${db.schema}.t_fgc_content_details d
        INNER JOIN ${db.schema}.t_ma_fgc_content c
        ON c.shortcode = d.type
        ${data.whereClause} 
            ${data.orderByClause} LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
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

module.exports.getAllContentList = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT d.id, c.name, d.type, d.title, d.description, d.images, d.insertby FROM ${db.schema}.t_fgc_content_details d
        INNER JOIN ${db.schema}.t_ma_fgc_content c
        ON c.shortcode = d.type
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
        db.query(`SELECT count(*) FROM ${db.schema}.t_fgc_content_details d
        INNER JOIN ${db.schema}.t_ma_fgc_content c
        ON c.shortcode = d.type 
        ${data.whereClause};`,[])
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
