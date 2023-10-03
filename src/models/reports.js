const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.getActiveUserReports = function () {
    return new Promise(function(resolve, reject) {
        db.query(`select count(DISTINCT a.loginid) as "value", date_trunc('day', a.insertdate) as "name"
                        from 
                        ${db.schema}.t_lm_activity_logs a 
                        inner join 
                        ${db.schema}.t_lm_app_login_detail u 
                        on 
                        a.loginid = u.loginid
                        where 
                        u.login_type != 'cmsuser' 
                        and
                        a.activitytype != 'Registration'
                        and 
                        a.insertdate >= date_trunc('minute', now()) - interval '1 month' and
                        a.insertdate < date_trunc('minute', now())
                        group by date_trunc('day', a.insertdate)
                        order by 2 asc;`,
            [])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}
