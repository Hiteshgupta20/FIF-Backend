const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addSurveyQuestioner = function (data) {
    console.log("survery name="+data.survey.surveyname);
    return new Promise(function(resolve, reject) {
        db.query(`insert into 
        ${db.schema}.t_sm_survey_ques(surveyname,category,publishdate,expirydate,
        sendnotification,status,insertby,insertdate,questions,activityname,activityid)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[data.survey.surveyname,data.survey.category,data.survey.publishdate
            ,data.survey.expirydate
        ,data.survey.sendnotification,data.survey.status,data.survey.insertby,"now()",data.question
        ,data.survey.activityname,data.survey.activityid])
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


module.exports.deleteSurveyQuestioner = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`delete from ${db.schema}.t_sm_survey_ques where surveyid=$1;`,[data.surveyid])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}


module.exports.editSurveyQuestioner = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`update  
        ${db.schema}.t_sm_survey_ques set surveyname=$1,category=$2,publishdate=$3,expirydate=$4,
        sendnotification=$5,status=$6,lastmodifydate=$7,lastmodifyby=$8,questions=$9
        ,activityname=$10,activityid=$11
        where surveyid=$12;`,[data.survey.surveyname,data.survey.category,data.survey.publishdate
            ,data.survey.expirydate
        ,data.survey.sendnotification,data.survey.status,"now()",data.survey.lastmodifyby,data.question
        ,data.survey.activityname,data.survey.activityid,data.survey.surveyid])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}


module.exports.getSurveyQuestioner = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select *, json_array_length(questions::JSON) as quesCount from ${db.schema}.t_sm_survey_ques
        ${data.whereClause} 
        ${data.orderByClause} 
        LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getTotalCountSurveyQuestioner(data);
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

module.exports.getAllSurveyQuestioner = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select *, json_array_length(questions::JSON) as quesCount from ${db.schema}.t_sm_survey_ques
        ${data.whereClause};`,[])
            .then(async function(results) {
                let count = await self.getTotalCountSurveyQuestioner(data);
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

module.exports.getSurveyQuesFromActivityIdAndStatus = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`select * from ${db.schema}.t_sm_survey_ques
        WHERE activityid=$1;`,[data.survey.activityid])
            .then(async function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


module.exports.getTotalCountSurveyQuestioner= function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_sm_survey_ques ${data.whereClause};`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.getAllSurveys = function () {
    var self = this;
    return new Promise(function(resolve, reject) {
        //
        db.query(`SELECT surveyid, surveyname, activityid, status, publishdate ,expirydate, sendnotification,
                    insertdate, insertby, lastmodifydate, lastmodifyby
                    FROM ${db.schema}.t_sm_survey_ques ;`,[])
            .then(async function(results) {
                // 
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateSurveyStatus = function (data) {
    return new Promise(function(resolve, reject) {
        //
        db.query(`UPDATE ${db.schema}.t_sm_survey_ques
                  SET  status = $1
                  WHERE surveyid=$2 returning *;`,
            [data.status,data.surveyid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findSurveyById = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {

        db.query(`SELECT activityname, activityid, surveyname, category, publishdate, expirydate, insertdate,
        status, questions FROM ${db.schema}.t_sm_survey_ques where surveyid = $1;`,[data.refid])
            .then(async function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.addCustomerResponse = function (data) {

    return new Promise(function(resolve, reject) {
        db.query(`insert into ${db.schema}.t_sm_survey_ques_details (surveyquesid,loginid,answer,
        insertdate) values ($1,$2,$3,$4)`,[data.surveyquesid,
            data.loginid,data.answers,
            "now()"])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}