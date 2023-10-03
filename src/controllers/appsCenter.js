var express = require('express');
var router = express.Router();
var AppsCenter = require('../models/appsCenter');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const ObjectId = require('mongodb').ObjectId;
var Categories = require('../models/appCategories');
const notification = require('../services/notification');
const activityLogs = require('../services/activityLogs');

router.post('/appsCenter/add', auth.isAuthenticated, (req, res) => {
    //check for sub categroy length
    let subCategory = req.body.subCategory || [];
    if (subCategory.length === 2) {

        //verify if the sequence no is available and not allocated to iOS or Android.
        
        let query = {
            $or: [{category: ObjectId(subCategory[0])}, {category: ObjectId(subCategory[1])}],
            sequenceNo: req.body.sequenceNo
        }
        AppsCenter.find(query, function (err, result) {
            if (err) {
                res.json(util.failed(err));
            }
            if (!err && result && result.length === 0) {
                saveApps(req, res);
            } else {
                res.json(util.failed(null, 'Application with this category and sequence number already exists.', '150'));
            }
        })
    }
    else {
        saveApps(req, res);
    }


});

function saveApps(req, res) {
    let appCategoryName = req.body.categoryName || "";
    let appsCenter = addApps(req);
    appsCenter.save(function (err) {
        if (!err) {
            appsCenter.categoryName = appCategoryName;
            sendAppUploadNotification(appsCenter);
            res.json(util.success(null));
        } else {
            // res.json(util.failed(err));
            // res.json(util.failed(err));
            if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate sequence number
                res.json(util.failed(null, 'Application with this category and sequence number already exists.', '150'));
            }
            else {
                // Some other error
                res.json(util.failed(err));
                // res.json(util.failed(err));
            }
        }
    });
}

function addApps(req) {
    var appsCenter = new AppsCenter();
    var date = new Date();
    appsCenter.appId = date.getTime();
    appsCenter.insertDate = date;
    appsCenter.name = req.body.name;
    appsCenter.description = req.body.description;
    appsCenter.category = req.body.category;
    appsCenter.subCategories = req.body.subCategory;
    appsCenter.url = req.body.url;
    appsCenter.icon = req.body.icon;
    appsCenter.status = req.body.status;
    appsCenter.sequenceNo = req.body.sequenceNo;
    appsCenter.packageName = req.body.packageName;
    appsCenter.appUrl = req.body.appUrl;
    return appsCenter;
}

router.post('/appsCenter/update', auth.isAuthenticated, (req, res) => {

    let subCategory = req.body.subCategory || [];
    if (subCategory.length === 2) {

        //verify if the sequence no is available and not allocated to iOS or Android.

        let query = {
            $or: [{category: ObjectId(subCategory[0])}, {category: ObjectId(subCategory[1])}],
            sequenceNo: req.body.sequenceNo
        }
        AppsCenter.find(query, function (err, result) {
            if (err) {
                res.json(util.failed(err));
            }
            if (!err && result && result.length === 0) {
                updateApps(req, res);
            } else {
                res.json(util.failed(null, 'Application with this category and sequence number already exists.', '150'));
            }
        })
    }
    else {
        updateApps(req, res);
    }

});


function updateApps(req, res) {
    var appId = req.body.appId || "";
    var updated_record = updateRequest(req);
    console.log(updated_record);
    AppsCenter.findOneAndUpdate({"appId": appId}, updated_record, (err, result) => {
        if (err && err.name === 'MongoError' && err.code === 11000) {
            // Duplicate sequence number
            return res.json(util.failed(null, 'Application with this category and sequence number already exists.', '150'));
        }
        if (err) return res.send(util.failed(err));
        if (err == null && result == null)
            return res.send(util.failed(null, "App not found."));
        return res.json(util.success(null));
    })
}

function updateRequest(req) {
    var currentDate = new Date();
    req.body.subCategories = req.body.subCategory;
    req.body.lastModifiedDate = currentDate;
    return req.body;
}

router.post('/appsCenter/delete', auth.isAuthenticated, (req, res) => {
    let appId = req.body.appId || "";
    AppsCenter.findOneAndRemove({"appId": appId}, (err, result) => {
        // As always, handle any potential errors:
        if (err) return res.send(util.failed(err));
        const response = {
            appId: appId
        };
        if (!err && result) {
            return res.json(util.success(response));
        }
        return res.json(util.failed(null, "App not found."));
    });
});

router.post('/getAllApps', auth.isAuthenticated, async (req, res) => {
        var conditions = {};
        var and_clauses = [];
        let match_clause = {}
        var searchParams = req.body.searchParams;
        var isExport = req.body.isExport || 0;
        let payload = req.body;
        let loginId = payload.loginId || 0;
        let sortByFieldName = payload.sortBy || "insertDate";
        payload.sortBy = "insensitive";
        payload.ascending = payload.ascending || false;
        let sortBy = util.formatOrderByClauseMongo(payload);

        let orderByData = util.formatOrderByClauseMongo(payload);
        let categoryObj = {};
        // let sortBy = {"insertDate": -1};
        if (req.headers.platform) {
            sortByFieldName = "sequenceNo";
            sortBy = {"insensitive": 1};
            // match_clause["sequenceNo"] = { $exists: true, $ne: null };
            match_clause["status"] = 1;
            let data = {
                categoryName: req.headers.platform
            }
            categoryObj = await getCategoryObj(data);
        }
        // if (req.headers.platform === 'iOS') {
        //     match_clause['category.categoryName'] = 'iOS';
        // }
        // if (req.headers.platform === 'Android') {
        //     match_clause['category.categoryName'] = 'Android';
        // }

        if (searchParams) {
            if (searchParams.name) {
                match_clause['name'] = {'$regex': searchParams.name, '$options': 'i'};
            }
            if (searchParams.status) {
                match_clause['status'] = parseInt(searchParams.status);
            }
            if (searchParams.category) {
                match_clause['category._id'] = ObjectId(searchParams.category);
            }
        }

        var pageOptions = {
            page: (req.body.page - 1) || 0,
            limit: req.body.limit || 10
        }

        var data = {
            "data": [],
            "totalRecords": 0
        }

        let projection = {
            "category": {"$arrayElemAt": ["$category", 0]},
            "appId": 1,
            "insertDate": 1,
            "name": 1,
            "description": 1,
            "url": 1,
            "icon": 1,
            "status": 1,
            "packageName": 1,
            "appUrl": 1,
            "sequenceNo": 1,
            "subCategories": 1,
            "insensitive": { "$toLower": `$${sortByFieldName}` }
        }
        console.log(sortBy);


        let aggregationArray = [
            {
                $lookup:
                    {
                        from: 'appcategories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
            },
            {
                $match: match_clause
            },
            {$project: projection},
            {$sort: sortBy}
        ];
        if (isExport != 1) {
            aggregationArray.push({$skip: pageOptions.page * pageOptions.limit});
            aggregationArray.push({$limit: pageOptions.limit});
        }
        let aggregationArrayCount = [
            {
                $lookup:
                    {
                        from: 'appcategories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
            },
            {
                $match: match_clause
            },
            {$count: "count"}
        ];

        AppsCenter.aggregate(aggregationArray).exec(function (err, result) {
            // console.log(result);
            if (!err) {
                AppsCenter.aggregate(aggregationArrayCount).exec(async function (err, count) {
                    if (!err) {
                        data['data'] = result;
                        let appCenterData = {
                            data: []
                        };

                        if (result) {
                            for (let i = 0; i < result.length; i++) {
                                if (req.headers.platform && categoryObj._id){
                                    debugger;

                                    if ((result[i]['category'] && result[i]['category']['categoryId'] && (result[i]['category']['categoryId']).toString() == (categoryObj['categoryId']).toString()) || result[i]['subCategories'].indexOf(categoryObj['id']) != -1){
                                        appCenterData['data'].push(result[i]);
                                    }
                                }
                                else {
                                    appCenterData['data'].push(result[i]);
                                }

                            }
                        }
                        appCenterData['totalRecords'] = count[0] ? count[0].count : 0;

                        if (loginId) {
                            let activityData = util.prepareActivityLogsData(loginId, 'Viewed App Center', 'Viewed App Center');
                            await activityLogs.createActivityLog(activityData);
                        }

                        res.json(util.success(appCenterData));
                    }
                    else {
                        res.json(util.failed(err));
                    }
                })
            } else {
                res.json(util.failed(err));
            }
        });
    }
);

function getCategoryObj(category) {
    return new Promise(function(resolve, reject) {
        var query = {"categoryName": category.categoryName};
        Categories.findOne(query, {}).exec(function (err, result) {
            if (!err) {
                resolve(result);
            } else {
                resolve(true);
            }
        });
    });
}

function sendAppUploadNotification(data) {
    data = data || {};
    data.type = "APP_UPLOAD";
    data.id = data.appId;
    data.itemTitle = data.name;
    data.itemType = data.categoryName || '' +' App';
    data.sendnotification = [];
    data.refid = data.appId;
    notification.sendNotification(data,data.sendnotification,false,true,true);
}

module.exports = router;
