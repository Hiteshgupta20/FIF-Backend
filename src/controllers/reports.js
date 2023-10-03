var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const reports = require('../services/reports');
const v = require('node-input-validator');
var basePath = '/reports';

router.get(basePath+'/getActiveUserReports',auth.isAuthenticated,async (req, res) => {
    try{
        let result = await reports.getActiveUserReports()
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

module.exports = router;

