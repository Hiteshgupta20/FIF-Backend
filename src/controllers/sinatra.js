var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const SinatraService = require('../services/sinatra');
const ratingService = require('../services/viewRating');

router.get('/sinatra/categories',auth.isAuthenticated, (req, res) => {
    let categories = ["General","FIFGroup Card(FGC)","Service"];
    res.json(util.success(categories));
});
router.post('/sinatra',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.createSinatra(req.body);
        let ratePayload = {
            'activityappid': 'SINATRA INSURANCE'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        let pointsAdded = 0;
        let pointDescription = "";
        if (sinatra && sinatra.pointsAdded){
            pointsAdded = sinatra.pointsAdded;
            pointDescription = util.getPointDescriptionContent(pointsAdded);
        }
        res.json(util.success(sinatra,'',ratingDesc,pointsAdded, pointDescription));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/sinatra/getSinatraStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let loginId = req.body.loginid || req.body.loginId;
        let sinatra = await SinatraService.findSinatraByLoginid(loginId);
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/sinatra/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.updateSinatra(req.body)
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/sinatra/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.updateSinatraStatus(req.body)
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/sinatra/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.deleteSinatra(req.body.id);
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getSinatra',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.findSinatra(req.body)
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/getSinatraCount',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.findSinatraCount(req.body)
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.get('/sinatra/getStatusList',auth.isAuthenticated,async (req, res) => {
    try{
        let statusList = await SinatraService.getStatusList();
        res.json(util.success(statusList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/sinatra/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let sinatra = await SinatraService.updateSinatraStatus(req.body);
        res.json(util.success(sinatra));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/sinatra/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await SinatraService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;