const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addActivity = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`insert into ${db.schema}.t_pm_point_setup(sourceapp,points,startdate,enddate,bonuspoints,
            bpstartdate,bpenddate,status,activityid,insertdate,insertby,budgetYear,remarks)
            values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[data.sourceApp,data.points
        ,data.startDate,data.endDate,data.bonusPoints,data.bpStartDate,data.bpEndDate,data.status,data.activityId,"now()",data.insertBy,data.budgetYear,data.remarks])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                if (err.code = '23505'){
                    reject(new Error("Record for this activity already exists."))
                }
                else {
                    reject(err);
                }
            });
    });
}

module.exports.updateActivity = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`update ${db.schema}.t_pm_point_setup  set sourceapp=$1,points=$2,startdate=$3,enddate=$4,bonuspoints=$5
        ,bpstartdate=$6,bpenddate=$7,status=$8,modifieddate=$9,lastmodifiedby=$10,activityid=$11,budgetYear=$12,remarks=$13 where setupid=$14
        ;`,[data.sourceApp,data.points,data.startDate,data.endDate,data.bonusPoints,
            data.bpStartDate,data.bpEndDate,data.status,"now()",data.lastModifiedBy,data.activityId,data.budgetYear,data.remarks,data.setUpId])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteActivity = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`delete from ${db.schema}.t_pm_point_setup t1 where t1.setupid=$1;`,[data.setUpId])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getActivityPointData = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`select p.* from ${db.schema}.t_pm_point_setup p inner join ${db.schema}.t_ma_activity a
        on p.activityid = a.id
         where a.activityappid=$1;`,[data.activityappid])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAllActivity = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select p.*, a.name as "activity_name" from ${db.schema}.t_pm_point_setup p inner join ${db.schema}.t_ma_activity a
        on p.activityid = a.id 
        ${data.whereClause} 
        ${data.orderByClause}
        LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getTotalCount(data);
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

module.exports.getExportAllActivity = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select p.*, a.name as "activity_name" from ${db.schema}.t_pm_point_setup p inner join ${db.schema}.t_ma_activity a
        on p.activityid = a.id 
        ${data.whereClause};`,[data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getTotalCount(data);
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


    module.exports.getTotalCount = function (data) {
        return new Promise(function(resolve, reject) {
            db.query(`SELECT count(*) from ${db.schema}.t_pm_point_setup p inner join ${db.schema}.t_ma_activity a
        on p.activityid = a.id ${data.whereClause};`,[])
                .then(function(results) {
                    console.log("count="+results[0].count);
                    resolve(results[0].count);
                })
                .catch(function(err) {
                    console.log("error="+err);
                    reject(0);
                });
        });
    }


