var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const RolesService = require('../services/roles')


router.post('/roles/getList',auth.isAuthenticated,async (req, res) => {
    try{
        let roleList = await RolesService.getRoleList(req.body);
        res.json(util.success(roleList));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.get('/modules/getList',auth.isAuthenticated,async (req, res) => {
    try{
        let moduleList = await RolesService.getModuleList();
        // console.log(moduleList);
        let moduleArr = [];
        for (let i = 0; i < moduleList.length; i++) {
            let moduleChildren = [];
            moduleList[i].children = moduleChildren;
            moduleArr.push(moduleList[i]);
        }
        for (let i = 0; i < moduleList.length; i++){
            if (moduleList[i]['parent'] != ""){
                for (let j = 0; j < moduleArr.length; j++) {
                    if (moduleList[i]['parent'] == moduleArr[j]['shortcode']){
                        moduleArr[j]['children'].push(moduleList[i]['shortcode']);
                    }
                }
            }
        }
        // console.log(moduleArr);
        res.json(util.success(moduleArr));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post('/roles/add',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await RolesService.addRole(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/roles/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await RolesService.updateRole(req.body)
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/roles/delete',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await RolesService.deleteRole(req.body.roleId);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/roles/detail',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await RolesService.getRoleDetail(req.body.roleId);
        let resObj = {
            id: '',
            name: '',
            isactive: '',
            insertby: '',
            insertdate: '',
            modifyby: '',
            modifydate: '',
            access: []
        };
        if (result.length > 0) {
            resObj.id = result[0]['id'];
            resObj.name = result[0]['name'];
            resObj.isactive = result[0]['isactive'];
            resObj.insertby = result[0]['insertby'];
            resObj.insertdate = result[0]['insertdate'];
            resObj.modifyby = result[0]['modifyby'];
            resObj.modifydate = result[0]['modifydate'];
            for (let i = 0; i < result.length; i++) {
                resObj.access.push({
                    'module': result[i]['module'],
                    'accessType': result[i]['accesstype']
                })
            }
        }
        res.json(util.success(resObj));
    }catch(err){
        res.json(util.failed(err));
    }
});


function validateRequest (payload) {
    return false;
}

module.exports = router;