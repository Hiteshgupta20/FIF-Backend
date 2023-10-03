const Promise = require('promise');
const Survey = require('../models/surveyQuestioner');
const util = require('../controllers/util');
const UserService = require('../services/user');
const UserModel = require('../models/user');
const ActivityLogService = require('../services/activityLogs');
const NotificationService = require('../services/notification');
const FCMNotificationService = require('../services/fcmPushNotification');
const NotificationModel = require('../models/notification');
const logger = require('../config/logging');

module.exports = {

    addSurveyQuestioner: async function (payload) {
        return new Promise(async function(resolve, reject) {
            payload.question= JSON.stringify(payload.questions);
            let survey = await Survey.getSurveyQuesFromActivityIdAndStatus(payload);
            console.log(survey);
            let surveyExists = false;
            if (survey && survey.length > 0){
                for (var i =0; i < survey.length; i++){
                    let d = new Date().getTime();
                    let p = util.formatTimeStamp(survey[i].publishdate);
                    if (survey[i].status == 1){
                        surveyExists = true;
                        break;
                    }
                    else if (p > d){
                        surveyExists = true;
                        break;
                    }
                }

            }
            if (!surveyExists){
                Survey.addSurveyQuestioner(payload)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                reject(new Error('Survey for this activity already exists.'))
            }
        });
    },


    deleteSurveyQuestioner: async function (data) {
        return new Promise(function(resolve, reject) {
            Survey.deleteSurveyQuestioner(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },


    editSurveyQuestioner: async function (data) {
        return new Promise(function(resolve, reject) {
            data.question= JSON.stringify(data.questions);
            Survey.editSurveyQuestioner(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },


    getSurveyQuestioner: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            let isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.surveyname) {
                    whereClause.push(`surveyname ilike '%${searchParams.surveyname}%'`)
                }
                if (searchParams.surveyId) {
                    whereClause.push(`surveyid = '${searchParams.surveyId}'`)
                }

                if (searchParams.status) {
                    whereClause.push(`status='${searchParams.status}'`)
                }

                if (searchParams.publishDate) {
                    if (  searchParams.publishDate.from && searchParams.publishDate.to) {
                        whereClause.push(`date_trunc('day',publishdate) between
                         to_date('${searchParams.publishDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.publishDate.to}','DD-MM-YYYY')`)
                    }
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            if (isExport == 0) {
                Survey.getSurveyQuestioner(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Survey.getAllSurveyQuestioner(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    getSurveyQuestionerForApp: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            let isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.surveyname) {
                    whereClause.push(`surveyname ilike '%${searchParams.surveyname}%'`)
                }
                if (searchParams.surveyId) {
                    whereClause.push(`surveyid = '${searchParams.surveyId}'`)
                }

                if (searchParams.status) {
                    whereClause.push(`status='${searchParams.status}'`)
                }

                if (searchParams.publishDate) {
                    if (  searchParams.publishDate.from && searchParams.publishDate.to) {
                        whereClause.push(`date_trunc('day',publishdate) between
                         to_date('${searchParams.publishDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.publishDate.to}','DD-MM-YYYY')`)
                    }
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            if (isExport == 0) {
                Survey.getSurveyQuestioner(data)
                    .then(function (result) {
                        if (result.data.length > 0) {
                            resolve(result);
                        }
                        else {
                            reject(new Error("The requested survey has been deleted."))
                        }

                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Survey.getAllSurveyQuestioner(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    addSurveyAnswers: async function (payload) {
        return new Promise(function(resolve, reject) {

            let data = {};

            data.surveyquesid = payload.surveyquesid;
            data.loginid = payload.loginid;
            data.answers = JSON.stringify(payload.answers);



            console.log(data);

            Survey.addCustomerResponse(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },


    surveyQuestionnaireScheduler: async function (payload) {
        debugger;
        return new Promise(async function(resolve, reject) {
            
            try{
                logger.info("Survey Questionnaire scheduler running ...");
                //get all questionnaires
                let surveys = await Survey.getAllSurveys();

                

                surveys.forEach(async function(survey) {
                    let status = 0;
                    let currentDate = new Date(util.getTimestamp()).getTime();
                    if (survey.publishdate) {
                        let publishDate = new Date(util.getTimestamp(survey.publishdate)).getTime();
                        if (publishDate <= currentDate) {
                            status = 1;
                        }
                    }
                    if (survey.expirydate) {
                        let expiryDate = new Date(util.getTimestamp(survey.expirydate)).getTime();
                        if (expiryDate < currentDate) {
                            status = 0;
                        }
                    }
                    let data = {
                        status: status,
                        surveyid: survey.surveyid,
                        title: survey.surveyname
                    }
                    if (status != survey.status) {
                        let survey = await Survey.updateSurveyStatus(data);
                        if (survey.status == 1) {
                            logger.info("\n activating survey.................... \n");
                            await sendSurveyNotification(survey);
                        }
                    }
                });
                //iterate through each and perform action for publish and expire date
                resolve(true);
            }
            catch(err){
                reject(err);
            }
        });
    }

};

function sendSurveyNotification(survey) {

    let data= {
        type: "NEW_SURVEY",
        refid: survey.surveyid,
        expirydate : survey.expirydate,
        itemTitle: survey.surveyname
    }
    let userData = null;
    let isGroup = false;
    if (survey.sendnotification.length > 0) {
        userData = survey.sendnotification;
        isGroup = true;
    }
    NotificationService.sendNotification(data,userData,false,true,isGroup);
}
