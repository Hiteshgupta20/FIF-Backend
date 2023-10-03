var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const CustomerGroupsService = require('../services/customerGroup')
const multer = require('multer');

router.get('/customerGroup/getGroupList', auth.isAuthenticated, (req, res) => {
    let groupList = [
        { "groupId": 1, "groupName": "Group A" },
        { "groupId": 2, "groupName": "Group B" },
        { "groupId": 3, "groupName": "Group C" },
        { "groupId": 4, "groupName": "Group D" }
    ];
    res.json(util.success(groupList));
});

router.post('/customerGroup/list', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }

        let customerGroupsList = await CustomerGroupsService.listCustomerGroups(req.body);
        res.json(util.success(customerGroupsList));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/customerGroup/add', auth.isAuthenticated, async (req, res) => {
    logger.debug("here");
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await CustomerGroupsService.addCustomerGroup(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/customerGroup/update', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await CustomerGroupsService.updateCustomerGroup(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/customerGroup/delete', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await CustomerGroupsService.deleteCustomerGroup(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});
router.post('/customerGroup/applyFilter', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await CustomerGroupsService.applyFilter(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/staticdata/excelFile')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({ storage })

router.post('/customerGroup/uploadExcelFile', upload.single('filesource'), async function (req, res, next) {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let fileData = {
            file: req.file,
            filepath: req.file.path,
            loginid: req.body.loginid,
        }
        let fileInfo = await CustomerGroupsService.uploadFile(fileData)
        res.json(util.success(fileInfo));
    } catch (err) {
        res.json(util.failed(err));
    }

})
router.get('/customerGroup/getExcelCustomers/:excelFileId', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        const excelFileId = req.params.excelFileId
        let result = await CustomerGroupsService.getExcelCustomers(excelFileId);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

function validateRequest(payload) {
    return false;
}

module.exports = router;
