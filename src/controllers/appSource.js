var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const appSourceService = require('../services/appSource');

router.post('/appSource/getList', auth.isAuthenticated, async(req, res) => {
    try {
        let appSourceList = await appSourceService.getAppSourceList(req.body);
        res.json(util.success(appSourceList));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/appSource/add', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await appSourceService.addAppSource(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/appSource/update', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await appSourceService.updateAppSource(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/appSource/delete', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await appSourceService.deleteAppSource(req.body.id);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

function validateRequest(payload) {
    return false;
}

module.exports = router;