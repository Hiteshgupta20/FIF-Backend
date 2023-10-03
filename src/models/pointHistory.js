const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util');
const ActivityLogs = require('../services/activityLogs');

module.exports.getAllRecords = function (data) {
    var self = this;

    return new Promise(function (resolve, reject) {
        db.query(`select t1.name as name,t1.msisdn as msisdn,t1.loginid as login_id,
        t2.cur_bal as ava_bal,
        t2.total_point as total_points,
        t2.red_point as red_point,t2.exp_point as exp_point,
        t2.budget_year as budget_year,t2.exp_date as exp_date
        from ${db.schema}.t_lm_app_login_detail t1
        JOIN ${db.schema}.t_wm_wallet_info t2
        ON t1.loginid = t2.login_id
        ${data.whereClause}
        ${data.orderByClause} LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getPointHistoryCount(data);
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

module.exports.getExportRecords = function (data) {
    var self = this;

    return new Promise(function (resolve, reject) {
        db.query(`select t1.name as name,t1.msisdn as msisdn,t1.loginid as login_id,
        t2.cur_bal as ava_bal,
        t2.total_point as total_points,
        t2.red_point as red_point,t2.exp_point as exp_point,
        t2.budget_year as budget_year,t2.exp_date as exp_date
        from ${db.schema}.t_lm_app_login_detail t1
        JOIN ${db.schema}.t_wm_wallet_info t2
        ON t1.loginid = t2.login_id
        ${data.whereClause};`, [])
            .then(async function (results) {
                let count = await self.getPointHistoryCount(data);
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



module.exports.getDetailHistory = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select w.*, a.modifyby, a.activitydesc, a.insertdate as actinsertdate, l.name as modifyname from ${db.schema}.t_wm_wallet_hist w
        join ${db.schema}.t_lm_activity_logs a
        on w.id::text = a.activitymodule
        join ${db.schema}.t_lm_app_login_detail l
        on a.modifyby = l.loginid
        where w.login_id=$1 and ((a.activitydesc in ('New','Cancelled','Completed') and w.product_id = 0)
        or (a.activitydesc in ('New','Cancelled') and w.product_id != 0))
         ORDER BY a.insertdate::timestamp DESC LIMIT $2 OFFSET $3;`,
            [data.loginId, data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getDetailPointHistoryCountRevised(data);
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


module.exports.addPoints = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_wm_wallet_hist
        (login_id, name, description, source_app, type, amount, product_id, status, remarks, insertdate, insertby)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`, [data.loginId, data.name, data.description
            , data.sourceApp, data.type, data.points, data.productId, data.status, data.remarks, "now()", data.insertBy])
            .then(function (results) {



                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}


module.exports.managePoints = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_wm_wallet_info set 
        cur_bal=${db.schema}.t_wm_wallet_info.cur_bal+$1,
        total_point=${db.schema}.t_wm_wallet_info.total_point+$2,
        red_point=${db.schema}.t_wm_wallet_info.red_point+$3,
        lastmodifyby=$4,
        lastmodifydate=$5
        where login_id=$6 returning *;`, [data.curPoints, data.totalPoints, data.redPoints, data.insertBy, "now()", data.loginId])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.expireUserPoints = function (data) {
    debugger;
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_wm_wallet_info set 
        cur_bal=$1,
        exp_point=$2,
        total_point=$3,
        red_point=$4,
        lastmodifydate=$5
        where login_id=$6 returning *;`, [0, data.totalPoints, 0, 0, "now()", data.loginId])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.initialEntry = function (data) {
    let currDate = new Date();
    let currYear = new Date().getFullYear();
    var d = new Date(currDate.setMonth(11));
    var d2 = new Date(d.setDate(30));
    return new Promise(function (resolve, reject) {
        db.query(`insert into ${db.schema}.t_wm_wallet_info(login_id,total_point,cur_bal,red_point,exp_point,insertdate,remarks, exp_date, budget_year)
        values($1,0,0,0,0,$2,$3,$4,$5)`, [data.loginId, "now()", "initial_entry", d2, currYear])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.checkRegistrationPoints = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select count(*)
        from ${db.schema}.t_wm_wallet_hist
        where login_id = $1 and description = 'Registration';`, [data.loginid])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}



module.exports.getPointHistoryCount = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select count(*)
        from ${db.schema}.t_lm_app_login_detail t1
        JOIN ${db.schema}.t_wm_wallet_info t2
        ON t1.loginid = t2.login_id
        ${data.whereClause};`, [])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getDetailPointHistoryCount = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT count(*) FROM ${db.schema}.t_wm_wallet_hist where login_id=$1;`, [data.loginId])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getDetailPointHistoryCountRevised = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`select count(*) as count
        from ${db.schema}.t_wm_wallet_hist w
        join ${db.schema}.t_lm_activity_logs a
        on w.id::text = a.activitymodule
        join ${db.schema}.t_lm_app_login_detail l
        on a.modifyby = l.loginid
        where w.login_id=$1 and ((a.activitydesc in ('New','Cancelled','Completed') and w.product_id = 0)
        or (a.activitydesc in ('New','Cancelled') and w.product_id != 0));`, [data.loginId])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.getUserPoints = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from ${db.schema}.t_wm_wallet_info where login_id=$1;`, [data.loginId])
            .then(function (results) {

                let res = {};
                if (results.length != 0) {
                    res = results[0];
                }
                resolve(res);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getUserInfo = function (loginId) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from ${db.schema}.t_lm_app_login_detail where loginid=$1;`, [loginId])
            .then(function (results) {
                let res = {};
                if (results.length != 0) {
                    res = results[0];
                }
                resolve(res);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getUserInfoByPhoneNo = function (msisdn) {
    return new Promise(function (resolve, reject) {
        db.query(`select loginid from ${db.schema}.t_lm_app_login_detail where msisdn=$1;`, [msisdn])
            .then(function (results) {
                let res = {};
                if (results.length != 0) {
                    res = results[0];
                }
                resolve(res);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getUsersWithCustMainNo = function (custMainNo) {
    return new Promise(function (resolve, reject) {
        db.query(`select loginid from ${db.schema}.t_lm_app_login_detail where custmainno=$1;`, [custMainNo])
            .then(function (results) {
                // let res = {};
                // if (results.length != 0){
                //     res = results[0];
                // }
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.changeStatus = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_wm_wallet_hist
            set status=$1,lastmodifyby=$2,lastmodifydate=$3 where id=$4 returning login_id;`, [data.status, data.lastModifiedBy
            , "now()", data.id])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.changeMultipleStatus = function (data, status) {
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_wm_wallet_hist
        set status=$1,lastmodifyby=$2,lastmodifydate=$3 where id=$4 returning login_id;`, [status.status, data.lastModifiedBy
            , "now()", data.id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getWalletHistoryById = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from  ${db.schema}.t_wm_wallet_hist
        where id=$1;`, [data.id])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getWalletMultipleHistoryById = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from  ${db.schema}.t_wm_wallet_hist
        where id=$1;`, [data.id])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getAllWalletHistory = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from  ${db.schema}.t_wm_wallet_hist;`, [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.checkInLogs = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from  ${db.schema}.t_lm_activity_logs where loginid=$1 and 
        activitymodule=$2;`, [data.login_id, data.id.toString()])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getIncorrectHistory = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select w.login_id, w2.cur_bal, w2.red_point, w2.total_point, 
        sum(w.amount) from ${db.schema}.t_wm_wallet_hist w
        inner join ${db.schema}.t_lm_app_login_detail l
        on w.login_id = l.loginid
        inner join ${db.schema}.t_wm_Wallet_info w2
        on w2.login_id = l.loginid
        where 
        w.type = 'CR'  and
        (w.remarks = 'Points equated for Sync Contract' or w.login_id != w.insertby)
        and w.insertdate:: date > '2020-10-08' 
        group by w.login_id, w2.cur_bal, w2.red_point, w2.total_point;`, [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.pointsCorrection = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_wm_wallet_info set 
        cur_bal=$1,
        total_point=$2,
        red_point=$3,
        lastmodifyby=$4,
        lastmodifydate=$5
        where login_id=$6 returning *;`,
            [data.curBal, data.totalPoint, data.redeemPoint, '933', "now()", data.loginId])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.deleteAfterPointsCorrection = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`DELETE 
        FROM ${db.schema}.t_wm_wallet_hist w 
             USING ${db.schema}.t_lm_app_login_detail l 
        WHERE w.login_id = l.loginid AND
              w.type = 'CR' and
        (w.remarks = 'Points equated for Sync Contract' or w.login_id != w.insertby)
        and w.insertdate:: date > '2020-10-08' and w.insertdate:: date < '2021-01-08';`,
            [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
