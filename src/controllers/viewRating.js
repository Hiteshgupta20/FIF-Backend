var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const viewRating = require('../services/viewRating');
const v = require('node-input-validator');
var basePath = '/viewRating';
const activityLogs = require('../services/activityLogs');

router.post(basePath+'/get',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await viewRating.viewSurveyRating(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/getCount',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await viewRating.viewSurveyRatingCount(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post('/addRating',auth.isAuthenticated,async (req, res) => {
    let validator = new v(req.body, {
        activityappid: 'required',
        loginId: 'required',
        rating: 'required',
        remarks: 'required'
    });
    validator.check().then(async function(matched) {
        if (!matched) {
            res.json(util.failed({},'Mandatory parameters are missing'));
        }
        try{
            let getSurveyDetailPayload = {
                activityappid: req.body.activityappid
            }
            let surveyDetails = await viewRating.getRatingData(getSurveyDetailPayload);
            console.log(surveyDetails);
            if (surveyDetails.surveyid){
                let payload = {
                    surveyId: surveyDetails.surveyid,
                    loginId: req.body.loginId,
                    rating: req.body.rating,
                    remarks: req.body.remarks
                }
                let result = await viewRating.addCustomerRating(payload);

                let loginId = req.body.loginId;
                let activityData = util.prepareActivityLogsData(loginId, 'Rating added', 'Rating added');
                await activityLogs.createActivityLog(activityData);

                res.json(util.success(result));
            }
            else {
                res.json(util.failed('Survey does not exist'));
            }
        }catch(err){
            res.json(util.failed(err));
        }
    });
});

module.exports = router;

