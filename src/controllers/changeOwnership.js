var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const ChangeOwnershipService = require('../services/changeOwnership');
const ratingService = require('../services/viewRating');

router.get('/changeOwnership/categories',auth.isAuthenticated, (req, res) => {
    let categories = ["General","FIFGroup Card(FGC)","Service"];
    res.json(util.success(categories));
});
router.post('/changeOwnership',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.createChangeOwnership(req.body);
        let ratePayload = {
            'activityappid': 'BALIK NAMA'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        res.json(util.success(changeOwnership,'',ratingDesc));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/changeOwnership/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.updateChangeOwnership(req.body)
        res.json(util.success(changeOwnership));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/changeOwnership/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.updateChangeOwnershipStatus(req.body)
        res.json(util.success(changeOwnership));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/changeOwnership/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.deleteChangeOwnership(req.body.id);
        res.json(util.success(changeOwnership));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getChangeOwnership',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.findChangeOwnership(req.body)
        res.json(util.success(changeOwnership));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/getChangeOwnershipCount',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.findChangeOwnershipCount(req.body)
        res.json(util.success(changeOwnership));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.get('/changeOwnership/getStatusList',auth.isAuthenticated,async (req, res) => {
    try{
        let statusList = await ChangeOwnershipService.getStatusList();
        res.json(util.success(statusList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/changeOwnership/updateStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let changeOwnership = await ChangeOwnershipService.updateChangeOwnershipStatus(req.body);
        res.json(util.success(changeOwnership));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/changeOwnership/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await ChangeOwnershipService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;