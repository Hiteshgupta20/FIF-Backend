var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const PointService = require('../services/pointHistory')
var basePath = '/pointHistory';
const activityLogs = require('../services/activityLogs');

router.post(basePath+'/getWalletInfo',auth.isAuthenticated,async (req, res) => {
    try{
        let walletInfo = await PointService.getAllWalletInfo(req.body)
        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/getWalletInfoCount',auth.isAuthenticated,async (req, res) => {
    try{
        let walletInfo = await PointService.getAllWalletInfoCount(req.body)
        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/getDetailWalletInfo',auth.isAuthenticated,async (req, res) => {
    try{
        let walletInfo = await PointService.getDetailWalletInfo(req.body);

        let loginId = req.body.loginId || 0;

        let activityData = util.prepareActivityLogsData(loginId, 'Viewed Points History', 'Viewed Points History');
        await activityLogs.createActivityLog(activityData);

        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});


router.post(basePath+'/addPoints',auth.isAuthenticated,async (req, res) => {
    try{
        let data = req.body;
        data.sendNotification = true;
        let walletInfo = await PointService.addPoints(data)
        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/addBulkPoints',auth.isAuthenticated,async (req, res) => {
    try{
        let data = req.body;
        data.sendNotification = true;
        let bulkWalletInfo = await PointService.pointsBulkUpload(data);
        res.json(util.success(bulkWalletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/syncPointHistory',async (req, res) => {
    debugger;
    try{
        let walletInfo = await PointService.syncPointHistory();
        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/pointCorrection',async (req, res) => {
    debugger;
    try{
        let resp = await PointService.pointCorrection();
        res.json(util.success(resp));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/deleteAfterPointCorrection',async (req, res) => {
    debugger;
    try{
        let resp = await PointService.deleteAfterPointCorrection();
        res.json(util.success(resp));
    }catch(err){
        res.json(util.failed(err));
    }
});


module.exports = router;


