var express = require('express');
var router = express.Router();
var IntroScreen = require('../models/introScreen');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');

router.post('/introScreen/add', auth.isAuthenticated, (req, res) => {
    let introScreen = createIntroScreen(req);
    introScreen.save(function (err) {
        if (!err) {
            res.json(util.success(null));
        } else {
            // res.json(util.failed(err));
            if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate serial number
                res.json(util.failed(null, 'Introduction screen with this serial number already exists.', '150'));
            }
            else {
                // Some other error
                res.json(util.failed(err));
                // res.json(util.failed(err));
            }
        }
    });
});

function createIntroScreen(req) {

    var introScreen = new IntroScreen();
    var date = new Date();
    introScreen.screenId = date.getTime();
    introScreen.sno = req.body.sno;
    introScreen.title = req.body.title;
    introScreen.imageDesc = req.body.description;
    introScreen.imageURL = req.body.imageUrl;
    introScreen.status = 1;
    introScreen.insertDate = date;
    introScreen.insertBy = 111;
    introScreen.lastModifiedDate = null;
    introScreen.lastModifiedBy = 111;
    return introScreen;
}

router.post('/introScreen/update', auth.isAuthenticated, (req, res) => {
    var screenId = req.body.screenId || "";
    var updated_record = updateRequest(req);
    IntroScreen.findOneAndUpdate({"screenId": screenId}, updated_record, (err, result) => {
        if (err) return res.send(util.failed(err));
        if (err == null && result == null)
            return res.send(util.failed(null, "Introduction screen not found."));
        return res.json(util.success(null));
    })
});

function updateRequest(req) {
    var currentDate = new Date();
    req.body.lastModifiedDate = currentDate;
    return req.body;
}

router.post('/introScreen/delete', auth.isAuthenticated, (req, res) => {
    let screenId = req.body.screenId || "";
    IntroScreen.findOneAndRemove({"screenId": screenId}, (err, result) => {
        // As always, handle any potential errors:
        if (err) return res.send(util.failed(err));
        const response = {
            screenId: screenId
        };
        if (!err && result) {
            return res.json(util.success(response));
        }
        return res.json(util.failed(null, "ScreenId not found."));
    });
});

router.post('/getIntroScreen', auth.isAuthenticated, (req, res) => {
    var conditions = {};
    var and_clauses = [];
    var searchParams = req.body.searchParams;
    var isExport = req.body.isExport || 0;
    let payload = req.body;
    let orderByData = util.formatOrderByClauseMongo(payload);

    if (searchParams) {
        if (searchParams.title) {
            console.log(searchParams.title);
            and_clauses.push({'title': {'$regex': searchParams.title, '$options': 'i'}});
        }

        if (and_clauses.length > 0) {
            conditions['$and'] = and_clauses;
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

    if (isExport == 1) {
        IntroScreen.find(conditions)
            .sort(orderByData)
            .exec(function (err, result) {
                if (!err) {
                    IntroScreen.count().exec(function (err, count) {
                        if (!err) {
                            data['data'] = result;
                            data['totalRecords'] = count;
                            res.json(util.success(data));
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
    else {
        IntroScreen.find(conditions)
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort(orderByData)
            .exec(function (err, result) {
                if (!err) {
                    IntroScreen.count().exec(function (err, count) {
                        if (!err) {
                            data['data'] = result;
                            data['totalRecords'] = count;
                            res.json(util.success(data));
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

});

module.exports = router;