var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const HelpService = require('../services/help')


router.get('/helpContent/getContentTypes',auth.isAuthenticated,async (req, res) => {
    try{
        let helpContentList = await HelpService.getHelpContentTypeList();
        res.json(util.success(helpContentList));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.get('/helpContent/getFaqCategories',auth.isAuthenticated,async (req, res) => {
    try{
        let helpContentList = await HelpService.getFaqCategoryList();
        res.json(util.success(helpContentList));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post("/helpContent/listAll",auth.isAuthenticated, async(req,res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await HelpService.listContent(req.body);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post('/helpContent/add',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await HelpService.addContent(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/helpContent/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await HelpService.updateContent(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/helpContent/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await HelpService.deleteContent(req.body.id);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});

function validateRequest (payload) {
    return false;
}

module.exports = router;