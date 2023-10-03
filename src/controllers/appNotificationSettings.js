var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const NotificationService = require('../services/appNotificationSettings');
const activityLogs = require('../services/activityLogs');

router.post("/getAppNotificationSetting/",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await NotificationService.getModules(req.body.loginId);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post("/appNotificationSetting",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }

        let result = await NotificationService.addModules(req.body);

        let loginId = req.body.loginId;
        let activityData = util.prepareActivityLogsData(loginId, 'Notification Settings Changed', 'Notification Settings Changed');
        await activityLogs.createActivityLog(activityData);

        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

function validateRequest (payload) {
    return false;
}

module.exports = router;
