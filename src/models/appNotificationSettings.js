const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util');

// methods for auction detail table
module.exports.addModule = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_app_notification
                    (userid, modules)
                    VALUES($1, $2 )
                    ON CONFLICT (userid) DO UPDATE SET modules = EXCLUDED.modules ;`,
            [data.loginId, data.modules])
            .then(function(results) {
                
                resolve(null);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getModules = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT id, userid, modules
                    FROM ${db.schema}.t_ma_app_notification
                    WHERE userid = $1;`,[data.loginId])
            .then(async function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

