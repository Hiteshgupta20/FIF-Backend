const promise = require('promise');
const db = require('../config/pg-db');
const util = require('../controllers/util');

module.exports.addAppSource = function(data) {
    return new Promise(function(resolve, reject) {;
        db.query(`INSERT INTO ${db.schema}.t_ma_apps
                    (name, status, insertdate, insertby, lastmodifydate, lastmodifyby)
                    VALUES($1, $2, $3, $4, $5, $6) returning *;`, [data.name, data.status, data.insertDate,
                data.insertBy, data.lastModifyDate, data.lastModifyBy
            ])
            .then(function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAppSourceList = function(data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT id, name, status, insertdate, insertby, lastmodifydate, lastmodifyby FROM ${db.schema}.t_ma_apps ${data.whereClause} ${data.orderByClause} LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function(results) {
                let count = await self.getAppSourceCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAllAppSourceList = function(data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT id, name, status, insertdate, insertby, lastmodifydate, lastmodifyby FROM ${db.schema}.t_ma_apps ${data.whereClause};`, [])
            .then(async function(results) {
                let count = await self.getAppSourceCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


module.exports.getAppSourceCount = function(data) {
    return new Promise(function(resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_ma_apps ${data.whereClause} ;`, [])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.deleteAppSource = function(appId) {
    var self = this;
    return new Promise(function(resolve, reject) {;
        db.query(`DELETE FROM ${db.schema}.t_ma_apps
            WHERE id = $1 returning id;`, [appId])
            .then(async function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateAppSource = function(data) {
    return new Promise(function(resolve, reject) {;
        db.query(`UPDATE ${db.schema}.t_ma_apps
                SET  name= $1, status= $2, lastmodifydate = $3, lastmodifyby = $4 WHERE id = $5 returning id;`, [data.name, data.status,
                data.lastModifyDate, data.lastModifyBy, data.id
            ])
            .then(function(results) {

                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.checkAppNameUnique = function(data) {
    return new Promise(function(resolve, reject) {
        let basicQuery = `select count(*) from ${db.schema}.t_ma_apps where LOWER(name)=LOWER($1)`;
        let finalQuery = {
            name: `check-unique-app-name-add-new`,
            text: `${basicQuery};`,
            values: [data.name]
        };

        if (data.id) {
            finalQuery = {
                name: `check-unique-app-name-update-app`,
                text: `${basicQuery} AND id!=$2`,
                values: [data.name, data.id]
            }
        }

        db.query(finalQuery)
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}