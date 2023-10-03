const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for auction detail table
module.exports.getStatusName = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT status_id, status_desc, remarks, module
            FROM ${db.schema}.t_ma_status_master 
            ${data.whereClause};`,[])

            .then(async function(results) {
                
                resolve(results[0].status_desc);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
