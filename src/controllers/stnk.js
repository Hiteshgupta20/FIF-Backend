var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const StnkService = require('../services/stnk');
const ratingService = require('../services/viewRating');

router.get('/stnk/categories',auth.isAuthenticated, (req, res) => {
    let categories = ["General","FIFGroup Card(FGC)","Service"];
    res.json(util.success(categories));
});
router.post('/stnk',auth.isAuthenticated,async (req, res) => {

    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.createStnk(req.body);
        let ratePayload = {
            'activityappid': 'STNK'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        let pointsAdded = 0;
        let pointsDescription = "";
        if (stnk && stnk.pointsAdded){
            pointsAdded = stnk.pointsAdded;
            pointsDescription = util.getPointDescriptionContent(pointsAdded);
        }
        res.json(util.success(stnk,'',ratingDesc, pointsAdded,pointsDescription));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/stnk/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.updateStnk(req.body)
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/stnk/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.updateStnkStatus(req.body)
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/stnk/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.deleteStnk(req.body.id);
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getStnk',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.findStnk(req.body)
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/getStnkCount',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.findStnkCount(req.body)
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.get('/stnk/getStatusList',auth.isAuthenticated,async (req, res) => {
    try{
        let statusList = await StnkService.getStatusList();
        res.json(util.success(statusList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/stnk/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.updateStnkStatus(req.body);
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/stnk/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await StnkService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;