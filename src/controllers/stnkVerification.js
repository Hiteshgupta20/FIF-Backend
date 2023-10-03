var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const StnkService = require('../services/stnkVerification');

router.post('/stnkVerification',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.createStnk(req.body)
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getStnkUploadStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let stnk = await StnkService.getSTNKStatus(req.body);
        res.json(util.success(stnk));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;