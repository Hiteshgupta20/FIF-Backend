const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addKeyValue = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_key_values
                    (id, "type", "key", value)
                    VALUES($1, $2, $3, $4) 
                    on conflict (id,"type","key") 
                    do
                    update set value = EXCLUDED.value returning *;`,
            [data.id, data.type, data.key, data.value])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getKeyValue = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT *
                    FROM ${db.schema}.t_key_values 
                    WHERE id = $1 and type = $2;`,
            [data.id,data.type])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}