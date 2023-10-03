var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const PointManagement = require('../services/pointManagement')
var basePath = '/pointManagement';


router.post(basePath+'/add',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await PointManagement.addActivity(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/edit',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await PointManagement.updateActivity(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await PointManagement.deleteActivity(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/get',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await PointManagement.getAllActivity(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/addPointsForActivity',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await PointManagement.addPointsForActivity(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});


module.exports = router;
