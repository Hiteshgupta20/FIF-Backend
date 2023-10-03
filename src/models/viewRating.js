const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.getSurveyRating= function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select t2.name,t1.surveyid,t4.name as activity,t1.loginid,t1.rating,t3.activityid,
        t1.remarks from ${db.schema}.t_sm_survey_rating_details t1
        join  ${db.schema}.t_lm_app_login_detail t2
        on t2.loginid=t1.loginid
        join ${db.schema}.t_sm_survey_rating t3
        on t3.surveyid=t1.surveyid
        join ${db.schema}.t_ma_activity t4
        on t3.activityid=t4.id
        ${data.whereClause}
        ${data.orderByClause} 
        LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getTotalCountSurveyRating(data);
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

module.exports.getAllSurveyRating= function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select t2.name,t1.surveyid,t4.name as activity,t1.loginid,t1.rating,t3.activityid,
        t1.remarks from ${db.schema}.t_sm_survey_rating_details t1
        join  ${db.schema}.t_lm_app_login_detail t2
        on t2.loginid=t1.loginid
        join ${db.schema}.t_sm_survey_rating t3
        on t3.surveyid=t1.surveyid
        join ${db.schema}.t_ma_activity t4
        on t3.activityid=t4.id
        ${data.whereClause};`,[])
            .then(async function(results) {
                let count = await self.getTotalCountSurveyRating(data);
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

module.exports.getRatingData = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`select s.title, surveyid from ${db.schema}.t_sm_survey_rating s inner join ${db.schema}.t_ma_activity a 
        on s.activityid = a.id
        where a.activityappid = $1`,
            [data.activityappid])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.addCustomerRating = function (data) {
    
    return new Promise(function(resolve, reject) {
        db.query(`insert into ${db.schema}.t_sm_survey_rating_details (surveyid,loginid,rating,remarks,
        insertdate) values ($1,$2,$3,$4,$5)`,[data.surveyid,
            data.loginid,data.rating,
            data.remarks, "now()"])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}


module.exports.getTotalCountSurveyRating= function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`select count(*) from ${db.schema}.t_sm_survey_rating_details t1
        join  ${db.schema}.t_lm_app_login_detail t2
        on t2.loginid=t1.loginid
        join ${db.schema}.t_sm_survey_rating t3
        on t3.surveyid=t1.surveyid
        ${data.whereClause};`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}