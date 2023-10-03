const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

// methods for auction detail table

module.exports.sendEmail = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_send_email 
                    (login_id, vmid, receipt_emailid, cc_emailid, bcc_emailid, subject, variables, insert_date)
                     VALUES( $1, $2, $3, $4 , $5 , $6 , $7 , $8 ) returning *;`,
            [data.loginid, data.vmid, data.receipt_emailid, data.cc_emailid, date.bcc_emailid, data.subject, data.variables, data.insert_date])
            .then(function (result) {
                resolve(result[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
