const promise = require('promise');
const db = require('../config/pg-db');
const util = require('../controllers/util');

module.exports.addActivity = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_ma_activity
        (name, status, insertdate, insertby, lastmodifydate, lastmodifyby)
        VALUES($1, $2, $3, $4, $5, $6) returning *;`, [data.name, data.status, data.insertDate,
        data.insertBy, data.lastModifyDate, data.lastModifyBy
        ])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getActivityList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, name, activityappid, modules, status, insertdate, insertby, lastmodifydate, lastmodifyby ,notification_flag, is_reminder FROM ${db.schema}.t_ma_activity ${data.whereClause} ${data.orderByClause} LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getActivityCount(data);
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

module.exports.getAllActivityList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, name, activityappid, modules, status, insertdate, insertby, lastmodifydate, lastmodifyby ,notification_flag, is_reminder FROM ${db.schema}.t_ma_activity ${data.whereClause};`, [])
            .then(async function (results) {
                let count = await self.getActivityCount(data);
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


module.exports.getActivityByName = function (ActivityName) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_ma_activity 
         where name = $1;`, [ActivityName])
            .then(async function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}


module.exports.getActivityCount = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_ma_activity ${data.whereClause} ;`, [])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.deleteActivity = function (activityId) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`DELETE FROM ${db.schema}.t_ma_activity
            WHERE id = $1 returning id;`, [activityId])
            .then(async function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateActivity = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_activity
                SET  name= $1, status= $2, insertdate = $3, insertby = $4, lastmodifydate = $5, lastmodifyby = $6 WHERE id = $7 returning id;`, [data.name, data.status, data.insertDate,
        data.insertBy, data.lastModifyDate, data.lastModifyBy, data.id
        ])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateNotificationFlag = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_activity
                SET  lastmodifydate = $1, lastmodifyby = $2 ,notification_flag = $3 WHERE id = $4 returning id;`,
            [data.lastModifyDate, data.lastModifyBy, data.notificationFlag, data.id])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.checkActivityUnique = function (data) {
    return new Promise(function (resolve, reject) {
        let basicQuery = `select count(*) from ${db.schema}.t_ma_activity where LOWER(name)=LOWER($1)`;
        let finalQuery = {
            name: `check-unique-activity-name-add-new`,
            text: `${basicQuery};`,
            values: [data.name]
        };

        if (data.id) {
            finalQuery = {
                name: `check-unique-activity-name-update`,
                text: `${basicQuery} AND id!=$2`,
                values: [data.name, data.id]
            }
        }

        db.query(finalQuery)
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}