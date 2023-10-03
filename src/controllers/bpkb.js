var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const BpkbService = require('../services/bpkb');
const ratingService = require('../services/viewRating');

router.get('/bpkb/categories',auth.isAuthenticated, (req, res) => {
    let categories = ["General","FIFGroup Card(FGC)","Service"];
    res.json(util.success(categories));
});
router.post('/bpkb',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.createBpkb(req.body);
        let ratePayload = {
            'activityappid': 'BPKB'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        let pointsAdded = 0;
        let pointsDescription = "";
        if (bpkb && bpkb.pointsAdded){
            pointsAdded = bpkb.pointsAdded;
            pointsDescription = util.getPointDescriptionContent(pointsAdded);
        }
        res.json(util.success(bpkb,'',ratingDesc, pointsAdded, pointsDescription));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/bpkb/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.updateBpkb(req.body)
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/bpkb/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.updateBpkbStatus(req.body)
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/bpkb/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.deleteBpkb(req.body.id);
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getBpkb',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.findBpkb(req.body)
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/getBpkbCount',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.findBpkbCount(req.body)
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.get('/bpkb/getStatusList',auth.isAuthenticated,async (req, res) => {
    try{
        let statusList = await BpkbService.getStatusList();
        res.json(util.success(statusList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/bpkb/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.updateBpkbStatus(req.body);
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/bpkb/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bpkb = await BpkbService.statusHistory(req.body);
        res.json(util.success(bpkb));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;