var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const CustomerRedemption = require('../services/customerRedemption')
var basePath = '/redemption';
const ratingService = require('../services/viewRating');

router.post(basePath+'/redeem',auth.isAuthenticated,async (req, res) => {

    try{
        let walletInfo =await CustomerRedemption.pointsRedeem(req.body);
        let ratePayload = {
            'activityappid': 'REDEEM'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        res.json(util.success(walletInfo,'',ratingDesc));
    }catch(err){
        res.json(util.failed(err));
    }
});


router.post(basePath+'/get',auth.isAuthenticated,async (req, res) => {
    try{
        let walletInfo =await CustomerRedemption.getRedemptionData(req.body);
        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/getCount',auth.isAuthenticated,async (req, res) => {
    try{
        let walletInfo =await CustomerRedemption.getRedemptionDataCount(req.body);
        res.json(util.success(walletInfo));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        // let walletInfo =await CustomerRedemption.getRedemptionData(req.body)
        let custRedemption = await CustomerRedemption.updateStatus(req.body);
        res.json(util.success(custRedemption));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/updateMultipleStatus',async (req, res) => {
    try{
        // let walletInfo =await CustomerRedemption.getRedemptionData(req.body)
        let custRedemption = await CustomerRedemption.updateMulitpleStatus(req.body);
        res.json(util.success(custRedemption));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post(basePath+'/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let statusHistory =await CustomerRedemption.statusHistory(req.body);

        res.json(util.success(statusHistory));
    }catch(err){
        res.json(util.failed(err));
    }
});

module.exports = router;