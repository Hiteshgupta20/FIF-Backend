var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const dropdownListService = require('../services/dropdownList');

router.post('/dropdown/add', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await dropdownListService.addDropdown(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/dropdown/update', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await dropdownListService.updateDropdown(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/dropdown/getList', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let dropdownList = await dropdownListService.getDropdownList(req.body)
        res.json(util.success(dropdownList));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/getCategoryList', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let dropdownList = await dropdownListService.getCategoryList(req.body)
        res.json(util.success(dropdownList));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/getDropdownValues', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let dropdownList = await dropdownListService.getDropdownValues(req.body)
        res.json(util.success(dropdownList));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/getCategoryValues', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let dropdownList = await dropdownListService.getCategoryValues(req.body)
        res.json(util.success(dropdownList));
    } catch (err) {
        res.json(util.failed(err));
    }

});

// For app
router.post('/dropdown/getListById', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let dropdownList = await dropdownListService.getDropdownListById(req.body)
        res.json(util.success(dropdownList));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/getCatIdById', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let dropdownList = await dropdownListService.getCategoryIdById(req.body)
        res.json(util.success(dropdownList));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/delete', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await dropdownListService.deleteDropdown(req.body.id);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/syncData', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let payload = req.body;
        let result = await dropdownListService.syncDataCommon(payload);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/dropdown/syncBranchData', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let payload = req.body;
        let result = await dropdownListService.syncBranchData(payload);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});


function validateRequest(payload) {
    return false;
}

module.exports = router;