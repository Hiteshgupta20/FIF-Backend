const promise = require('promise');
const db = require('../config/pg-db');
const util = require('../controllers/util');

module.exports.addDropdown = function (data, addFor) {
    var self = this;

    if (addFor == "new") {
        return new Promise(function (resolve, reject) {
            db.query(`INSERT INTO ${db.schema}.t_ma_dropdown_list1
                        (name, insertdate, insertby, lastmodifydate, lastmodifyby)
                        VALUES($1, $2, $3, $4, $5) returning *;`, [data.name, data.insertDate,
            data.insertBy, data.lastModifyDate, data.lastModifyBy
            ])
                .then(async function (results) {
                    let mapData = [];
                    for (var i = 0; i < data.filters.length; i++) {
                        let res = await self.addDropdownMapping(results[0]["id"], data, i);
                        mapData.push(res);
                    }
                    let response = {
                        "data": results[0],
                        "mapData": mapData
                    }
                    resolve(response);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    } else {
        return new Promise(function (resolve, reject) {
            db.query(`UPDATE ${db.schema}.t_ma_dropdown_list1
            SET insertdate = $1, insertby = $2, lastmodifydate = $3, lastmodifyby = $4 WHERE LOWER(name) = LOWER($5) returning id, name;`, [data.insertDate,
            data.insertBy, data.lastModifyDate, data.lastModifyBy, data.name
            ])
                .then(async function (results) {
                    let mapData = [];
                    for (var i = 0; i < data.filters.length; i++) {
                        let res = await self.addDropdownMapping(results[0]["id"], data, i);
                        mapData.push(res);
                    }
                    let response = {
                        "data": results[0],
                        "mapData": mapData
                    }
                    resolve(response);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }

}

module.exports.addDropdownMapping = function (catid, data, filterIndx) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_ma_dropdown_map
        (parentid, catid, value, status, insertdate, insertby, lastmodifydate, lastmodifyby)
        VALUES($1, $2, $3, $4, $5, $6, $7) returning *;`, [data.parentId, catid, data.filters[filterIndx], 1, data.insertDate,
        data.insertBy, data.lastModifyDate, data.lastModifyBy
        ])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getDropdownList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, name, insertdate, insertby, lastmodifydate, lastmodifyby, issyncing
         FROM ${db.schema}.t_ma_dropdown_list1 ${data.whereClause} ${data.orderByClause} LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getDropdownListCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                for (var i = 0; i < results.length; i++) {
                    let mapData = await self.getMapData(results[i]);
                    response.data[i]["values"] = mapData;
                }

                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getAllDropdownList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, name, insertdate, insertby, lastmodifydate, lastmodifyby, issyncing
         FROM ${db.schema}.t_ma_dropdown_list1 ${data.whereClause} ;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getDropdownListCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                for (var i = 0; i < results.length; i++) {
                    let mapData = await self.getMapData(results[i]);
                    response.data[i]["values"] = mapData;
                }

                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getDropdownListById = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, parentid, catid, value
         FROM ${db.schema}.t_ma_dropdown_map ${data.whereClause} ORDER BY "insertdate"::timestamp DESC;`, [data.limit, data.offset])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getDropdownInfoById = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, parentid, catid, value
         FROM ${db.schema}.t_ma_dropdown_map ${data.whereClause} ORDER BY "insertdate"::timestamp DESC;`, [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getCategoryList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id,name, issyncing
         FROM ${db.schema}.t_ma_dropdown_list1 ${data.whereClause} ORDER BY "insertdate"::timestamp DESC;`, [])
            .then(async function (results) {

                let response = results;

                for (var i = 0; i < results.length; i++) {
                    if (results[i].name.toLowerCase() == "village" || results[i].name.toLowerCase() == "sub district" || results[i].name.toLowerCase() == "city" || results[i].name.toLowerCase() == "branch name" || results[i].name.toLowerCase() == "branch id") { } else {

                        let res = await self.getCatValue(results[i]["id"]);
                        response[i]["values"] = res;
                    }
                }

                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getCatValue = function (catid) {
    var self = this;

    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, parentid, catid, value, code, status
         FROM ${db.schema}.t_ma_dropdown_map where catid = $1 AND status = 1 ORDER BY "insertdate"::timestamp DESC;`, [catid])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getExistingDropdownValue = function (data) {
    var self = this;

    return new Promise(function (resolve, reject) {
        db.query(`SELECT *
         FROM ${db.schema}.t_ma_dropdown_map WHERE code=$1 OR value=$2;`, [data.code, data.name])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.addDropdownValueFromCrmApi = function (data) {
    var self = this;

    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_ma_dropdown_map
        (parentid, catid, value, code, status, insertdate, insertby, lastmodifydate, lastmodifyby, sourcetype)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *;`, [data.parentId, data.catId, data.name, data.code, 1,
        data.insertDate, data.insertBy, data.lastModifyDate, data.lastModifyBy, data.sourceType
        ])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateDropdownValueFromCrmApi = function (data) {
    console.log(data.lastModifyDate);

    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_dropdown_map
         SET parentid=$1, catid=$2, value=$3, code=$4, status=$5, lastmodifydate=$6, lastmodifyby=$7
           WHERE id=$8`,
            [data.parentId, data.catId, data.name, data.code, data.status,
            data.lastModifyDate, data.lastModifyBy, data.id
            ])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getParentId = function (code) {
    var self = this;

    return new Promise(function (resolve, reject) {
        db.query(`SELECT id
         FROM ${db.schema}.t_ma_dropdown_map WHERE code=$1;`, [code])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.setDropdownSyncStatus = function (data) {

    console.log(data);

    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_dropdown_list1
         SET issyncing=$1 WHERE id = any($2)`,
            [data.status, data.ids])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.resetDropdownStatus = function (data) {

    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_dropdown_map
         SET status=$1 WHERE catid=$2`,
            [data.status, data.catid])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateDropdownValue = function (data) {

    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_dropdown_map
         SET code = $1, status = $2, parentid = $3 WHERE id=$4`,
            [data.resCode, 1, data.parentId, data.id])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getCategoryValues = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, parentid, catid, value
         FROM ${db.schema}.t_ma_dropdown_map ${data.whereClause} ORDER BY "insertdate"::timestamp DESC;`, [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}


module.exports.getMapData = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, parentid, catid, value
        FROM ${db.schema}.t_ma_dropdown_map where "catid" = $1 and status =1 ORDER BY value ASC LIMIT 300;`, [data.id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}


module.exports.getDropdownListCount = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_ma_dropdown_list1 ${data.whereClause} ;`, [])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.updateDropdownMapStatus = function (data, status) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_dropdown_map
            SET status = $1
            WHERE id = $2 returning id;`, [status, data.id])
            .then(async function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.deleteDropdown = function (id) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`DELETE FROM ${db.schema}.t_ma_dropdown_list1
            WHERE id = $1 returning id;`, [id])
            .then(async function (results) {
                let res = await self.deleteDropdownMapping(results[0]);
                resolve(res);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.deleteDropdownMapping = function (data) {

    return new Promise(function (resolve, reject) {
        let deleteQuery = `delete from ${db.schema}.t_ma_dropdown_map
    where id in (WITH RECURSIVE cte AS (
       SELECT id, parentid,catid, 1 AS level
       FROM   ${db.schema}.t_ma_dropdown_map
       WHERE  catid = $1
       UNION  ALL
       SELECT t.id, t.parentid, t.catid, c.level + 1
       FROM   cte      c
       JOIN   ${db.schema}.t_ma_dropdown_map t ON   c.id = t.parentid 
       )
    SELECT id
    FROM   cte)`;
        db.query(deleteQuery, [data.id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.deleteDropdownMappingWithParentId = function (id, catid, parentid) {

    return new Promise(function (resolve, reject) {
        let deleteQuery = `delete from ${db.schema}.t_ma_dropdown_map
    where id in (WITH RECURSIVE cte AS (
       SELECT id, parentid,catid, 1 AS level
       FROM   ${db.schema}.t_ma_dropdown_map
       WHERE  id = $1
       UNION  ALL
       SELECT t.id, t.parentid, t.catid, c.level + 1
       FROM   cte      c
       JOIN   ${db.schema}.t_ma_dropdown_map t ON   c.id = t.parentid 
       )
    SELECT id
    FROM   cte)`;
        db.query(deleteQuery, [id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.updateDropdown = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_ma_dropdown_list1
                SET name = $1, insertdate = $2, insertby = $3, lastmodifydate = $4, lastmodifyby = $5 WHERE id = $6 returning id, name;`, [data.name, data.insertDate,
        data.insertBy, data.lastModifyDate, data.lastModifyBy, data.id
        ])
            .then(function (results) {
                resolve(results);

            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getValuesByCatId = function (catid, parentid) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT id, parentid, catid, value, status FROM ${db.schema}.t_ma_dropdown_map where catid = $1 and parentid = $2;`, [catid, parentid])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getValues = function (catid) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_ma_dropdown_map
        (parentid, catid, value, insertdate, insertby, lastmodifydate, lastmodifyby)
        VALUES($1, $2, $3, $4, $5, $6, $7) returning *;`, [data.parentId, catid, data.filters[filterIndx], data.insertDate,
        data.insertBy, data.lastModifyDate, data.lastModifyBy
        ])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.updateDropdownMapping = function (data, value) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_ma_dropdown_map
        (parentid, catid, value, status, insertdate, insertby, lastmodifydate, lastmodifyby)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8) returning *;`, [data.parentId, data.id, value, 1, data.insertDate,
        data.insertBy, data.lastModifyDate, data.lastModifyBy
        ])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.checkDropdownUnique = function (data) {
    return new Promise(function (resolve, reject) {
        let basicQuery = `select count(*) from ${db.schema}.t_ma_dropdown_list1 where LOWER(name)=LOWER($1)`;
        let finalQuery = {
            name: `check-unique-dropdown-name-add-new`,
            text: `${basicQuery};`,
            values: [data.name]
        };

        if (data.id) {
            finalQuery = {
                name: `check-unique-dropdown-name-update`,
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

module.exports.parentIdExists = function (parentid) {
    return new Promise(function (resolve, reject) {
        db.query(`select count(*) from ${db.schema}.t_ma_dropdown_map where parentid = $1;`, [parentid])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getCatIdByName = function (name) {
    return new Promise(function (resolve, reject) {
        db.query(`select id from ${db.schema}.t_ma_dropdown_list1 where name = $1;`, [name])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.deleteDropdownDataByCatId = function (catid) {
    return new Promise(function (resolve, reject) {
        db.query(`delete from ${db.schema}.t_ma_dropdown_map where catid = $1 and sourcetype = 'crm';`, [catid])
            .then(function (results) {
                resolve(true);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}