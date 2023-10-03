var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var jobScheduler = require('../../../../../Downloads/socket/utils/jobScheduler');
var util = require('./util');
const logger = require('../config/logging');
const SchedulerService = require('../services/scheduler');

router.post('/scheduler', auth.isAuthenticated, async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let scheduler = await SchedulerService.findScheduler(req.body);
        res.json(util.success(scheduler));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/triggerScheduler', auth.isAuthenticated, async (req, res) => {
    try{
        let name = req.body.name;

        if(!name){
            return res.json(util.failed(null,"Name field is mandatory."));
        }

        let scheduler = await jobScheduler.runManually(name);
        res.json(util.success(scheduler));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/scheduler/statusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        if(!req.body.name){
            return res.json(util.failed(null,"Name field is mandatory."));
        }
        let payment = await SchedulerService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;
