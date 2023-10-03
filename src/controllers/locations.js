var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const LocationService = require('../services/locations');
const activityLogs = require('../services/activityLogs');

router.post("/getLocations",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let loginId = req.body.loginId;
        let result = await LocationService.getLocations(req.body);
        if (loginId) {
            let activityData = util.prepareActivityLogsData(loginId, 'Viewed Locations', 'Viewed Locations');
            await activityLogs.createActivityLog(activityData);
        }

        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});
function validateRequest (payload) {
    return false;
}

module.exports = router;
