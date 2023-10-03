var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const ManageRating = require('../services/manageRating')
var basePath = '/manageRating';


router.post(basePath+'/add',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await ManageRating.addSurveyRating(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/edit',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await ManageRating.editSurveyrating(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await ManageRating.deleteSurveyRating(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/get',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await ManageRating.getSurveyRating(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/getStatusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await ManageRating.getStatusHistory(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

module.exports = router;