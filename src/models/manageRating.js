const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addSurveyRating = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`insert into ${db.schema}.t_sm_survey_rating(title,effectivedate,activityid,
            status,insertdate,insertby,insertStatus)values($1,$2,$3,$4,$5,$6,$7)`,
            [data.title,data.effectivedate,data.activityid, data.status,"now()",data.insertby,data.status])
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

    module.exports.deleteSurveyRating = function (data) {
        return new Promise(function(resolve, reject) {
            db.query(`delete from ${db.schema}.t_sm_survey_rating where surveyid=$1;`,[data.surveyid])
                .then(function(results) {
                    resolve(results);
                })
                .catch(function(err) {
                    reject(0);
                });
        });
    }

    module.exports.editSurveyRating = function (data) {
        return new Promise(function(resolve, reject) {
            db.query(`update ${db.schema}.t_sm_survey_rating set title=$1,effectivedate=$2,activityid=$3,
             status=$4,lastmodifydate=$5,lastmodifyby=$6,lastmodifystatus=$7 where surveyid=$8;`,[data.title,
                data.effectivedate,data.activityid,data.status,"now()",data.lastmodifyby,data.status,data.surveyid])
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

        module.exports.getSurveyRating= function (data) {
            var self = this;
            return new Promise(function(resolve, reject) {
                db.query(`select s.*, a.name as activity 
                from ${db.schema}.t_sm_survey_rating s
                INNER JOIN ${db.schema}.t_ma_activity a
                ON s.activityid = a.id
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
                db.query(`select s.*, a.name as activity 
                        from ${db.schema}.t_sm_survey_rating s
                        INNER JOIN ${db.schema}.t_ma_activity a
                        ON s.activityid = a.id
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


        module.exports.getTotalCountSurveyRating= function (data) {
            return new Promise(function(resolve, reject) {
                db.query(`select count(*) 
                from ${db.schema}.t_sm_survey_rating s
                INNER JOIN ${db.schema}.t_ma_activity a
                ON s.activityid = a.id ${data.whereClause};`,[])
                    .then(function(results) {
                        resolve(results[0].count);
                    })
                    .catch(function(err) {
                        reject(0);
                    });
            });
        }


        module.exports.getStatusHistory = function (data) {
            return new Promise(function(resolve, reject) {
                db.query(`select insertby,insertStatus,insertdate,lastmodifyby,lastmodifystatus,
                lastmodifydate from public.t_sm_survey_rating where surveyid=$1;`,[data.surveyid])
                    .then(function(results) {
                        resolve(results);
                    })
                    .catch(function(err) {
                        reject(0);
                    });
            });
    
        }

