const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.createScheduler = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_scheduler
                ("name", status, startdate, enddate)
                 VALUES($1, 'SUCCESS', now(), now() ) returning *;`,
            [data.name])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findScheduler = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT "name", status, startdate, enddate,(enddate-startdate)::time as runtime
                    FROM ${db.schema}.t_ma_scheduler
                    ${data.whereClause} 
                    ${data.orderByClause} 
                    LIMIT $1 OFFSET $2;`,
            [data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getSchedulerCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findAllScheduler = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`SELECT "name", status, startdate, enddate,(enddate-startdate)::time as runtime
                    FROM ${db.schema}.t_ma_scheduler
                    ${data.whereClause};`,
            [data.limit,data.offset])
            .then(async function(results) {


                let count = await self.getSchedulerCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getSchedulerCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_ma_scheduler 
                ${data.whereClause} ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.updateSchedulerStartTime = function (data) {

    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_scheduler
        ("name", status, startdate, enddate)
        VALUES($1, 'SUCCESS', now(), now() )
        ON CONFLICT ("name") DO UPDATE SET status = 'IN_PROGRESS',"startdate"=now(),"enddate"=null
        returning *;`,
            [data.name])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateScheduler = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_ma_scheduler
                  SET status= $1, enddate = now()
                  WHERE name=$2 returning *;`,
            [data.status , data.name])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findSchedulerFrequency = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_reminder_notification_frequency
                    WHERE activityappid = $1;`,
            [data.activitymodule])
            .then(async function(response) {
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}