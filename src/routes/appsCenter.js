var express = require('express');
var router = express.Router();
var IntroScreen = require('../models/introScreen');
const Controllers = require('../Controllers');
var basePath = '/';
var auth = require('../config/authorization');
const logger = require('../config/logging');
var util = require('../utils/universalFunctions');

router.post('/getAppsCenter', auth.isAuthenticated, (req, res) => {
    var payload = req.body;
    Controllers.IntroScreenCtrl.getAllIntroScreens(payload, function (err, data) {
        if (err) {
            res.json(util.failed(err));
        } else {
            res.json(util.success(data));
        }
    });
});

router.post('/introScreen/add',auth.isAuthenticated, (req, res) => {
    var payload = req.body;
    Controllers.IntroScreenCtrl.createIntroScreen(payload, function (err, data) {
        if (err) {
            res.json(util.failed(err));
        } else {
            res.json(util.success(data));
        }
    });
});

router.post('/introScreen/update',auth.isAuthenticated, (req, res) => {
    var payload = req.body;
    Controllers.IntroScreenCtrl.updateIntroScreen(payload, function (err, data) {
        if (err) {
            res.json(util.failed(err));
        } else {
            res.json(util.success(data));
        }
    });
});

router.post('/introScreen/delete',auth.isAuthenticated, (req, res) => {
    var payload = req.body;
    Controllers.IntroScreenCtrl.deleteIntroScreen(payload, function (err, data) {
        if (err) {
            res.json(util.failed(err));
        } else {
            res.json(util.success(data));
        }
    });
});

module.exports = router;