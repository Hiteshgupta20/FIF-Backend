var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const activityService = require('../services/activity');

router.post('/activity/getList', auth.isAuthenticated, async(req, res) => {
    try {
        let activityList = await activityService.getActivityList(req.body);
        res.json(util.success(activityList));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/activity/add', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await activityService.addActivity(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/activity/update', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await activityService.updateActivity(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/activity/updateNotificationFlag', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await activityService.updateNotificationFlag(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/activity/delete', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await activityService.deleteActivity(req.body.id);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

function validateRequest(payload) {
    return false;
}

module.exports = router;