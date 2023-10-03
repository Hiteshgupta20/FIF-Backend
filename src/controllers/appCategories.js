var express = require('express');
var router = express.Router();
var AppsCategories = require('../models/appCategories');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');

router.post('/appCategories/add',auth.isAuthenticated, (req, res) => {
    let appCategories = addAppCategories(req);
    appCategories.save(function (err) {
        if (!err){
            res.json(util.success(null));
        }else{
            res.json(util.failed(err));
        }
    });
});

function addAppCategories(req) {
    var appCategories = new AppsCategories();
    var date = new Date();
    appCategories.categoryId = date.getTime();
    appCategories.categoryName = req.body.name;
    return appCategories;
}

router.post('/appCategories/update',auth.isAuthenticated, (req, res) => {
    var categoryId = req.body.categoryId || "";
    var updated_record = updateRequest(req);
    AppsCenter.findOneAndUpdate({"categoryId" : categoryId}, updated_record,(err,result) => {
        if (err) return res.send(util.failed(err));
        if(err == null && result == null)
            return res.send(util.failed(null,"App not found."));
        return res.json(util.success(null));
    })
});

function updateRequest(req){
    var currentDate=new Date();
    // req.body.lastModifiedDate = currentDate;
    return req.body;
}

// router.post('/appsCenter/delete', auth.isAuthenticated, (req, res) => {
//     let appId = req.body.appId ||"";
//     AppsCenter.findOneAndRemove({"appId" : appId}, (err,result) => {
//         // As always, handle any potential errors:
//         if (err) return res.send(util.failed(err));
//         const response = {
//             appId: appId
//         };
//         if(!err && result){
//             return res.json(util.success(response));
//         }
//         return res.json(util.failed(null,"App not found."));
//     });
// });

router.get('/getAppCategories', auth.isAuthenticated, (req, res) => {
    AppsCategories.find({})
        .exec(function (err, result) {
            if (!err) {
                res.json(util.success(result));
            } else {
                res.json(util.failed(err));
            }
        });
});

module.exports = router;