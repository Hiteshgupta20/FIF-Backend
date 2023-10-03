var express = require('express');
var router = express.Router();
var NewsAndPromo = require('../models/newsAndPromo');
var CustomerGroup = require('../models/customerGroup');
var commentsCtrl = require('../controllers/comments');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const activityLogs = require('../services/activityLogs');

router.post('/newsAndPromo/add', auth.isAuthenticated, async (req, res) => {
    let newsAndPromo = addNewsAndPromo(req);
    let currDate = new Date();
    currDate.setSeconds(0);
    currDate.setMilliseconds(0);
    let publishDate = new Date(req.body.publishDate);
    publishDate.setSeconds(0);
    publishDate.setMilliseconds(0);
    let expiryDate = new Date(req.body.expiryDate);
    expiryDate.setSeconds(0);
    expiryDate.setMilliseconds(0);
    if (currDate > publishDate) {
        res.json(util.failed(null, 'Publish Date can not be in past.', '150'));
    }
    else if (expiryDate <= currDate) {
        res.json(util.failed(null, 'Expiry Date needs to be in future.', '150'));
    }
    else if (expiryDate <= publishDate) {
        res.json(util.failed(null, 'Expiry Date needs to be greater than publish date.', '150'));
    }
    else {
        let newsExists = false;
        let news = await NewsAndPromo.find({ priority: req.body.priority });

        // for(let i =0; i < news.length; i++){
        //     if(news[i].status == 0 && news[i].priority ){
        //         let expDate = new Date(news[i].expiryDate);
        //         if(expDate.getTime() >= currDate.getTime()){
        //             newsExists = true;
        //             break;
        //         }
        //     }
        //     if(news[i].status == 1 && news[i].priority  ){
        //         newsExists = true;
        //         break;
        //     }
        // }
        if (news && news.length > 0) {
            for (let i = 0; i < news.length; i++) {
                let d = new Date().getTime();
                let p = util.formatTimeStamp(news[i].publishDate);
                if (news[i].status == 1 && news[i].priority) {
                    newsExists = true;
                    break;
                }
                else if (news[i].status == 0 && news[i].priority && p > d) {
                    newsExists = true;
                    break;
                }
            }
        }

        if (!newsExists) {
            newsAndPromo.save(function (err) {
                if (!err) {
                    res.json(util.success(null));
                } else {
                    if (err.name === 'MongoError' && err.code === 11000) {
                        // Duplicate priority
                        res.json(util.failed(null, 'News or Promotion with this priority already exists.', '150'));
                    }
                    else {
                        // Some other error
                        res.json(util.failed(err));
                        // res.json(util.failed(err));
                    }
                }
            });
        }
        else {
            res.json(util.failed(null, 'News or Promotion with this priority already exists.', '150'));
        }

    }
});

function addNewsAndPromo(req) {
    var newsAndPromo = new NewsAndPromo();
    var date = new Date();
    newsAndPromo.newsPromoId = date.getTime();
    newsAndPromo.title = req.body.title;
    newsAndPromo.type = req.body.type;
    newsAndPromo.shortDesc = req.body.shortDesc;
    newsAndPromo.longDesc = req.body.longDesc;
    newsAndPromo.listImageUrl = req.body.listImageUrl;
    newsAndPromo.imageUrl = req.body.imageUrl;
    newsAndPromo.videoUrl = req.body.videoUrl;
    newsAndPromo.status = req.body.status;
    newsAndPromo.publishDate = new Date(req.body.publishDate);
    newsAndPromo.expiryDate = new Date(req.body.expiryDate);
    newsAndPromo.priority = req.body.priority;
    newsAndPromo.sendNotification = req.body.sendNotification;
    newsAndPromo.comments = req.body.comments;
    newsAndPromo.downPayment = req.body.downPayment;
    newsAndPromo.monthlyInstallment = req.body.monthlyInstallment;
    newsAndPromo.durationInstallment = req.body.durationInstallment;
    newsAndPromo.viewCount = 0;
    newsAndPromo.commentCount = 0;
    newsAndPromo.insertDate = date;
    newsAndPromo.insertBy = 111;
    newsAndPromo.lastModifiedDate = null;
    newsAndPromo.lastModifiedBy = 111;
    return newsAndPromo;
}

router.post('/newsAndPromo/update', auth.isAuthenticated, async (req, res) => {
    var newsPromoId = req.body.newsPromoId || "";
    let currDate = new Date();
    currDate.setSeconds(0);
    currDate.setMilliseconds(0);
    let publishDate = new Date(req.body.publishDate);
    publishDate.setSeconds(0);
    publishDate.setMilliseconds(0);
    let expiryDate = new Date(req.body.expiryDate);
    expiryDate.setSeconds(0);
    expiryDate.setMilliseconds(0);
    if (currDate > publishDate) {
        res.json(util.failed(null, 'Publish Date can not be in past.', '150'));
    }
    else if (expiryDate <= currDate) {
        res.json(util.failed(null, 'Expiry Date needs to be in future.', '150'));
    }
    else if (expiryDate <= publishDate) {
        res.json(util.failed(null, 'Expiry Date needs to be greater than publish date.', '150'));
    }
    else {
        let newsExists = false;
        let news = await NewsAndPromo.find({ priority: req.body.priority });

        // for(let i =0; i < news.length; i++){
        //     if(news[i].status == 0 && news[i].priority ){
        //         let expDate = new Date(news[i].expiryDate);
        //         if(expDate.getTime() >= currDate.getTime()){
        //             newsExists = true;
        //             break;
        //         }
        //     }
        //     if(news[i].status == 1 && news[i].priority  ){
        //         newsExists = true;
        //         break;
        //     }
        // }
        if (news && news.length > 0) {
            for (let i = 0; i < news.length; i++) {
                let d = new Date().getTime();
                if (news[i].newsPromoId != newsPromoId) {
                    let p = util.formatTimeStamp(news[i].publishDate);
                    if (news[i].status == 1 && news[i].priority) {
                        newsExists = true;
                        break;
                    }
                    else if (news[i].status == 0 && news[i].priority && p > d) {
                        newsExists = true;
                        break;
                    }
                }
            }
        }

        if (!newsExists) {
            var updated_record = updateRequest(req);
            NewsAndPromo.findOneAndUpdate({ "newsPromoId": newsPromoId }, updated_record, (err, result) => {
                console.log(result);
                if (err) return res.send(util.failed(err));
                if (err == null && result == null)
                    return res.send(util.failed(null, "News or Promo not found."));
                return res.json(util.success(null));
            })
        }
        else {
            res.json(util.failed(null, 'News or Promotion with this priority already exists.', '150'));
        }
    }
});

function updateRequest(req) {
    var currentDate = new Date();
    req.body.lastModifiedDate = currentDate;
    return req.body;
}

function getNewsAndPromoViews(newsPromoId) {
    var query = { "newsPromoId": newsPromoId };
    NewsAndPromo.findOne(query, { "numberOfViews": 1 }).exec(function (err, result) {
        if (!err) {
            res.json(util.success(result));
        } else {
            res.json(util.failed(err));
        }
    });
}

router.post('/newsAndPromo/delete', auth.isAuthenticated, (req, res) => {
    let newsPromoId = req.body.newsPromoId || "";
    NewsAndPromo.findOneAndRemove({ "newsPromoId": newsPromoId }, (err, result) => {
        // As always, handle any potential errors:
        if (err) return res.send(util.failed(err));
        const response = {
            newsPromoId: newsPromoId
        };
        if (!err && result) {
            return res.json(util.success(response));
        }
        return res.json(util.failed(null, "News or Promo not found."));
    });
});

function getNewsAndPromoObj(comment, request, response, cb) {
    var query = { "newsPromoId": comment.newsPromoId };
    NewsAndPromo.findOne(query, {}).exec(function (err, result) {
        if (!err) {
            cb(null, result);
        } else {
            return false;
        }
    });
}

function getCommentsFromNewsAndPromoId(comment, request, response, cb) {
    var comment = {
        newsPromoId: comment.newsPromoId
    };
    getNewsAndPromoObj(comment, req, res, function (err, newsPromoObj) {
        if (err) {
            return false;
        }
        if (newsPromoObj) {
            var query = { "sourceId": newsPromoObj._id };
            Comments.find(query, {}).exec(function (err, result) {
                if (!err) {
                    cb(null, result);
                } else {
                    return false;
                }
            });
        }
        else {
            return res.json(util.failed(null, "News or promo not found"));
        }
    });
}

router.post('/getAllNewsAndPromo', auth.isAuthenticated, (req, res) => {
    var conditions = {};
    var and_clauses = [];
    var searchParams = req.body.searchParams;
    var isExport = req.body.isExport || 0;
    if (searchParams) {
        if (searchParams.title) {
            console.log(searchParams.title);
            and_clauses.push({ 'title': { '$regex': searchParams.title, '$options': 'i' } });
        }
        if (searchParams.type) {
            and_clauses.push({ 'type': searchParams.type });
        }
        if (searchParams.insertDate) {
            if (searchParams.insertDate.from && searchParams.insertDate.to) {
                and_clauses.push({
                    'insertDate': {
                        $gte: new Date(searchParams.insertDate.from).toISOString(),
                        $lt: new Date(searchParams.insertDate.to).toISOString()
                    }
                });
            }
        }
        if (searchParams.publishDate) {
            if (searchParams.publishDate.from && searchParams.publishDate.to) {
                and_clauses.push({
                    'publishDate': {
                        $gte: new Date(searchParams.publishDate.from).toISOString(),
                        $lt: new Date(searchParams.publishDate.to).toISOString()
                    }
                });
            }
        }
        if (searchParams.expiryDate) {
            if (searchParams.expiryDate.from && searchParams.expiryDate.to) {
                and_clauses.push({
                    'expiryDate': {
                        $gte: new Date(searchParams.expiryDate.from).toISOString(),
                        $lt: new Date(searchParams.expiryDate.to).toISOString()
                    }
                });
            }
        }
        if (and_clauses.length > 0) {
            conditions['$and'] = and_clauses;
        }
    }

    var pageOptions = {
        page: (req.body.page - 1) || 0,
        limit: req.body.limit || 10
    }

    // if (pageOptions.page >= 0 && pageOptions.limit >= 0) {
    var data = {
        data: [],
        totalRecords: 0
    }
    var totalRecords = 0;
    var data = {
        "data": [],
        "totalRecords": 0
    }

    let payload = req.body;
    let orderByData = util.formatOrderByClauseMongo(payload);

    if (isExport == 1) {
        NewsAndPromo.find(conditions)
            .sort(orderByData)
            .exec(function (err, result) {
                if (!err) {
                    NewsAndPromo.find(conditions).count().exec(function (err, count) {
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
        NewsAndPromo.find(conditions)
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort(orderByData)
            .exec(function (err, result) {
                if (!err) {
                    NewsAndPromo.find(conditions).count().exec(function (err, count) {
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
    // } else {
    //     res.json(util.failed('Invalid Page No or limit'));
    // }
});

router.post('/getAppNewsAndPromo', auth.isAuthenticated, async (req, res) => {
    var conditionsFeatured = {};
    var and_clausesFeatured = [];
    var and_clauses = [];
    var conditionsNonFeatured = {};
    var conditions = {};
    var and_clausesNonFeatured = [];
    var isFeatured = false; // req.body.isFeatured;
    and_clausesFeatured.push({ 'status': 1 });
    and_clausesNonFeatured.push({ 'status': 1 });
    and_clauses.push({ 'status': 1 });
    var loginId = req.body.loginId || 0;
    var fromHomeScreen = req.body.fromHomeScreen;
    if (loginId) {
        //get customer group list which contain loginId entered by user
        try {
            let objArray = await CustomerGroup.getGroupIds(loginId);
            console.log(objArray);
            let groupIds = objArray.map(a => a.groupid);
            console.log(groupIds);
            and_clausesFeatured.push({ $or: [{ sendNotification: { $in: groupIds } }, { sendNotification: { $size: 0 } }] });
            and_clausesNonFeatured.push({ $or: [{ sendNotification: { $in: groupIds } }, { sendNotification: { $size: 0 } }] });
        }
        catch (err) {
            logger.error(err);
        };

    }
    if (isFeatured) {
        and_clausesFeatured.push({ 'priority': { $in: [1, 2, 3, 4, 5] } });
        if (and_clausesFeatured.length > 0) {
            conditionsFeatured['$and'] = and_clausesFeatured;
        }
    }
    else {
        //and_clausesFeatured.push({ 'priority': -1 });
        if (and_clausesFeatured.length > 0) {
            conditionsFeatured['$and'] = and_clausesFeatured;
            console.log(conditionsFeatured);
        }
    }
    // and_clausesNonFeatured.push({'priority': { $nin: [1,2,3,4,5] }});
    if (and_clauses.length > 0) {
        conditions['$and'] = and_clauses;
    }
    var pageOptions = {
        page: (req.body.page - 1) || 0,
        limit: req.body.limit || 10
    }

    if (pageOptions.page >= 0 && pageOptions.limit >= 0) {
        var data = {
            data: [],
            totalRecords: 0
        }
        var totalRecords = 0;
        var data = {
        }
        var projection = {
            'newsPromoId': 1,
            'insertDate': 1,
            'publishDate': 1,
            'priority': 1,
            //'nlt': { $ifNull: [ "$priority", 100 ] },
            'shortDesc': 1,
            'type': 1,
            'title': 1,
            'commentCount': 1,
            'viewCount': 1,
            'listImageUrl': 1,
            'videoUrl': 1,
            'imageUrl': 1,
            'status': 1,
            'sendNotification': 1
        }
        //console.log(conditions);
        
        NewsAndPromo.aggregate([
            {
                $project: {
                    newsPromoId: 1,
                    insertDate: -1,
                    publishDate: -1,
                    priority: 1,
                    nlt: { $ifNull: ["$priority", 100] },
                    shortDesc: 1,
                    type: 1,
                    title: 1,
                    commentCount: 1,
                    viewCount: 1,
                    listImageUrl: 1,
                    videoUrl: 1,
                    imageUrl: 1,
                    status: 1,
                    sendNotification: 1
                }
            },
            { $match: { status: 1 } },
            //{$sort: { "nlt": -1, "insertDate": -1}}
            { $sort: { "nlt": 1 } }
        ]);
        //console.log(a);
        NewsAndPromo.find(conditionsFeatured, projection)
            .sort({ "priority": 1 })
            .exec(function (err, result) {
                if (!err) {

                    NewsAndPromo.count().exec(async function (err, count) {
                        if (!err) {
                            result.sort(function (a, b) {
                                //return (a['priority']===null)-(b['priority']===null) || +(a>b)||-(a<b);
                                // equal items sort equally
                                if (a['proprity'] === b['priority']) {
                                    return 0;
                                } else if (a['priority'] === null) {
                                    return 1;
                                } else if (b['priority'] === null) {
                                    return -1;
                                }                                                     // if descending, highest sorts first
                                else {
                                    return a['priority'] > b['priority'] ? 1 : -1;
                                }
                            });

                            console.log('====== After =====');
                            console.log(result);
                            for (let i = 0; i < result.length; i++) {
                                result[i] = result[i].toObject();
                                let priority = result[i]['priority'];
                                if (priority && priority <= 5) {
                                    result[i]['isFeatured'] = true;
                                }
                                else {
                                    result[i]['isFeatured'] = false;
                                }
                                let insertDateFormatted = util.formatTimeStamp(result[i]['insertDate']);
                                let publishDateFormatted = util.formatTimeStamp(result[i]['publishDate']);
                                result[i]['insertDate'] = insertDateFormatted;
                                result[i]['publishDate'] = publishDateFormatted;
                            }
                            data['data'] = result;
                            // data['nonFeatured'] = result1;
                            if (loginId) {
                                let actDesc = ''
                                if (fromHomeScreen) {
                                    actDesc = 'Viewed home screen';
                                }
                                else {
                                    actDesc = 'Viewed News and Promo';
                                }
                                let activityData = util.prepareActivityLogsData(loginId, actDesc, actDesc);
                                await activityLogs.createActivityLog(activityData);
                            }

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
        // NewsAndPromo.find(conditions, projection)
        //     .skip(pageOptions.page * pageOptions.limit)
        //     .limit(pageOptions.limit)
        //     .sort({"insertDate": -1})
        //     .exec(function (err, result1) {
        //         if (!err) {
        //             for (let i=0; i < result1.length; i++) {
        //                 result1[i] = result1[i].toObject();
        //                 let insertDateFormatted = util.formatTimeStamp(result1[i]['insertDate']);
        //                 let publishDateFormatted = util.formatTimeStamp(result1[i]['publishDate']);
        //                 result1[i]['insertDate'] = insertDateFormatted;
        //                 result1[i]['publishDate'] = publishDateFormatted;
        //             }
        //             NewsAndPromo.find(conditionsFeatured, projection)
        //                 .sort({"priority": 1})
        //                 .exec(function (err, result2) {
        //                     if (!err) {
        //                         NewsAndPromo.count().exec(async function (err, count) {
        //                             if (!err) {
        //                                 for (let i=0; i < result2.length; i++) {
        //                                     result2[i] = result2[i].toObject();
        //                                     let insertDateFormatted = util.formatTimeStamp(result2[i]['insertDate']);
        //                                     let publishDateFormatted = util.formatTimeStamp(result2[i]['publishDate']);
        //                                     result2[i]['insertDate'] = insertDateFormatted;
        //                                     result2[i]['publishDate'] = publishDateFormatted;
        //                                 }
        //                                 data['featured'] = result2;
        //                                 data['nonFeatured'] = result1;
        //                                 if (loginId) {
        //                                     let activityData = util.prepareActivityLogsData(loginId, 'Viewed News and Promo', 'Viewed News and Promo');
        //                                     await activityLogs.createActivityLog(activityData);
        //                                 }
        //
        //                                 res.json(util.success(data));
        //                             }
        //                             else {
        //                                 res.json(util.failed(err));
        //                             }
        //                         })
        //                     } else {
        //                         res.json(util.failed(err));
        //                     }
        //                 });
        //         } else {
        //             res.json(util.failed(err));
        //         }
        //     });
    } else {
        res.json(util.failed('Invalid Page No or limit'));
    }
});

function getNewsPromoCount(request, response, cb) {
    var query = {};
    var count = NewsAndPromo.find(query, {}).count();
    cb(null, count);
}

router.get('/getNewsAndPromoDetails/:id', auth.isAuthenticated, (req, res) => {
    var query = { "newsPromoId": req.params.id };
    console.log(query);
    updateViewCount(query, req, res, function (err, status) {
        // console.log('returned from comm count');
        // console.log(status);
        if (!err) {
            NewsAndPromo.find(query, {}).exec(function (err, result) {
                if (!err) {
                    let resArr = [];
                    let resObj = result[0].toObject();
                    let insertDateFormatted = util.formatTimeStamp(resObj['insertDate']);
                    let publishDateFormatted = util.formatTimeStamp(resObj['publishDate']);
                    let expiryDateFormatted = util.formatTimeStamp(resObj['expiryDate']);
                    resObj['insertDate'] = insertDateFormatted;
                    resObj['publishDate'] = publishDateFormatted;
                    resObj['expiryDate'] = expiryDateFormatted;
                    resArr.push(resObj);
                    res.json(util.success(resArr));
                } else {
                    res.json(util.failed(err));
                }
            });
        }
        else {
            res.json(util.failed(err));
        }
    });
    // NewsAndPromo.find(query, {}).exec(function (err, result) {
    //     if (!err) {
    //         updateViewCount( query, req, res, function (err, status) {
    //             // console.log('returned from comm count');
    //             // console.log(status);
    //             if (err) {
    //                 return res.send(util.failed(err));
    //                 return;
    //             }
    //             return res.json(util.success(result));
    //         });
    //         // res.json(util.success(result));
    //     } else {
    //         res.json(util.failed(err));
    //     }
    // });
});

function updateViewCount(reqView, request, response, cb) {
    console.log(reqView.newsPromoId);
    NewsAndPromo.update(
        { newsPromoId: reqView.newsPromoId },
        { $inc: { viewCount: 1 } }
    ).then(function () {
        console.log('update done');
        cb(null, true);
    })
}

module.exports = router;
