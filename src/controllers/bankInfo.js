var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const BankInfoService = require('../services/bankInfo')


router.get('/bankInfo/getList', auth.isAuthenticated, async(req, res) => {
    try {
        let bankList = await BankInfoService.getBankList();
        res.json(util.success(bankList));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post("/bankInfo/listAll", auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await BankInfoService.listBanks(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/bankInfo/add', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await BankInfoService.addBank(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/bankInfo/update', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await BankInfoService.updateBank(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/bankInfo/delete', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await BankInfoService.deleteBank(req.body.bankId);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/bankInfo/detail', auth.isAuthenticated, async(req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await BankInfoService.getBankDetail(req.body.bankId);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});


function validateRequest(payload) {
    return false;
}

module.exports = router;