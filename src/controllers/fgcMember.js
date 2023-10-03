var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const FGCService = require('../services/fgcMember');
const ratingService = require('../services/viewRating');
const userService = require('../services/user');

router.post("/fgcMember/memberRequest",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.memberRequest(req.body);
        let ratePayload = {
            'activityappid': 'BE A MEMBER'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        let pointsAdded = 0;
        let pointsDescription = "";
        if (result && result.pointsAdded){
            pointsAdded = result.pointsAdded;
            pointsDescription = util.getPointDescriptionContent(result.pointsAdded);
        }
        let message = "";
        if(result.message){
            message = result.message;
        }
        res.json(util.success(result,message,ratingDesc,pointsAdded, pointsDescription));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post("/fgcMember/checkPlafond",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.checkPlafond(req.body);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post("/fgcMember/getMembers",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.findMember(req.body);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post("/fgcMember/upgradeMemberRequest",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.upgradeMemberRequest(req.body);
        let ratePayload = {
            'activityappid': 'UPGRADE MEMBER'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        let pointsAdded = 0;
        let pointDescription = "";
        if (result && result.pointsAdded){
            pointsAdded = result.pointsAdded;
            pointDescription = util.getPointDescriptionContent(pointsAdded);
        }
        res.json(util.success(result,'',ratingDesc,pointsAdded,pointDescription));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post('/fgcMember/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await FGCService.updateStatus(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/fgcMember/updateStatusByPhoneNumber',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let userDetails = await userService.getUserDetailsByPhoneNo(req.body);
        let payment = {};
        if (userDetails && userDetails.loginid) {
            payment = await FGCService.updateStatus(req.body);
        }
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/fgcMember/bulkUpdate',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let response = await FGCService.bulkUpdate(req.body);
        res.json(util.success(response));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/fgcMember/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await FGCService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});


function validateRequest (payload) {
    return false;
}

module.exports = router;