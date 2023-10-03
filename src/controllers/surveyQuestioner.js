var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const Survey = require('../services/surveyQuestioner');
const Notification = require('../services/notification');
var basePath = '/surveyQuestioner';
const SurveyQues = require('../services/surveyQuestioner');
const v = require('node-input-validator');
const activityLogs = require('../services/activityLogs');

router.post(basePath+'/add',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await Survey.addSurveyQuestioner(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});


router.post(basePath+'/edit',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await Survey.editSurveyQuestioner(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});


router.post(basePath+'/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await Survey.deleteSurveyQuestioner(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});


router.post(basePath+'/get',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await Survey.getSurveyQuestioner(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/getFromApp',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await Survey.getSurveyQuestionerForApp(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/addCustomerResponse',auth.isAuthenticated,async (req, res) => {
    let validator = new v(req.body, {
        surveyid: 'required',
        loginId: 'required'
    });
    validator.check().then(async function(matched) {
        if (!matched) {
            res.json(util.failed({},'Mandatory parameters are missing'));
        }
        try{
            let payload = req.body;
            let data = {
                surveyquesid: payload.surveyid,
                loginid: payload.loginId,
                type: payload.type,
                answers: payload.answers
            }
            // console.log(payload);
            let result = await SurveyQues.addSurveyAnswers(data);
            if(result){

                let loginId = payload.loginId;
                let activityData = util.prepareActivityLogsData(loginId, 'Survey answered', 'Survey answered');
                await activityLogs.createActivityLog(activityData);

                let data = {
                    refid : payload.surveyid,
                    userid : payload.loginId,
                    type : payload.type || "NEW_SURVEY",
                }
                Notification.notificationDetail(data);
            }
            res.json(util.success(null));
        }catch(err){
            res.json(util.failed(err));
        }
    });
});

module.exports = router;
