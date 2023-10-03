const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

// methods for auction detail table

module.exports.sendSms = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_send_sms
                    (login_id, msisdn, sms_text, sms_length, route, sender_id, insert_date)
                    VALUES( $1, $2, $3, $4 ,$5 ,$6 , $7 ) returning *;`,
            [data.loginId ,data.msisdn, data.sms_text, data.sms_length, data.route, date.sender_id, data.insert_date])
            .then(function (result) {
                resolve(result[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
