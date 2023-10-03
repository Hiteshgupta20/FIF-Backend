var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var logger = require('../config/logging');
var util = require('../controllers/util');
const customerProfile = require('../services/customerProfile');
var CustomerProfile = require('../services/customerProfile');

router.post('/customerProfile/list',auth.isAuthenticated, async (req,res) => {
    try{
        let customerProfilesList = await CustomerProfile.listCustomerProfiles(req.body);
        res.json(util.success(customerProfilesList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/customerProfile/update',auth.isAuthenticated, async (req,res) => {
    try{
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await customerProfile.updateCustomerProfile(req.body);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/customerProfile/count',auth.isAuthenticated, async (req,res) => {
    try{
        let customerProfilesListCount = await CustomerProfile.getAllCustomersCount(req.body);
        res.json(util.success(customerProfilesListCount));
    }catch(err){
        res.json(util.failed(err));
    }
});

function validateRequest(payload) {
    return false;
}

module.exports = router;