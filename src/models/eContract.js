const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util');
const logger = require('../config/logging');



module.exports.getNotificationFlag = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT flag  FROM   ${db.schema}.t_fcm_notification    
        WHERE contractno = $1 and type = 'E_CONTRACT_REMINDER' order by insertdate DESC limit 1;`,
            [data.contract_no])
            .then(function (results) {
                if (results != null && results.length > 0) {
                    results.map((data) => {
                        if (data.flag == null) {
                            data.flag = 0;
                        }
                    })

                    var obj = results[0];

                    if (obj.flag == 0) {
                        resolve(0);
                    }
                    else {
                        resolve(1);
                    }
                }
                else {
                    resolve(0);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
