var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const ClaimService = require('../services/claimInsurance');
const ratingService = require('../services/viewRating');

router.get('/claim/categories',auth.isAuthenticated, (req, res) => {
    let categories = ["General","FIFGroup Card(FGC)","Service"];
    res.json(util.success(categories));
});
router.post('/claim',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let claim = await ClaimService.createClaim(req.body);
        let ratePayload = {
            'activityappid': 'CLAIM INSURANCE'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        res.json(util.success(claim,'',ratingDesc));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/claim/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let claim = await ClaimService.updateClaimStatus(req.body)
        res.json(util.success(claim));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/claim/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let claim = await ClaimService.deleteClaim(req.body.id);
        res.json(util.success(claim));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getClaim',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let claim = await ClaimService.findClaim(req.body)
        res.json(util.success(claim));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/getClaimCount',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let claim = await ClaimService.findClaimCount(req.body)
        res.json(util.success(claim));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.get('/claim/getStatusList',auth.isAuthenticated,async (req, res) => {
    try{
        let statusList = await ClaimService.getStatusList();
        res.json(util.success(statusList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/claim/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let claim = await ClaimService.updateClaimStatus(req.body);
        res.json(util.success(claim));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/claim/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await ClaimService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;