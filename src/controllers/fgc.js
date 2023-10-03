var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const FGCService = require('../services/fgc');


router.get('/fgcContent/getContentTypes',auth.isAuthenticated,async (req, res) => {
    try{
        let fgcContentList = await FGCService.getFGCContentTypeList();
        res.json(util.success(fgcContentList));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post("/fgcContent/listAll",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.listContent(req.body);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post('/fgcContent/add',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.addContent(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/fgcContent/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.updateContent(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/fgcContent/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.deleteContent(req.body.id);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/fgcSetting',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await FGCService.updateFGCSetting(req.body);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.get('/getFgcSetting',auth.isAuthenticated,async (req, res) => {
    try{

        let result = await FGCService.getFGCSetting();
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;