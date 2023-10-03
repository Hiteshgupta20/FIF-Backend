var express = require('express');
var router = express.Router();
var Comments = require('../models/comments');
var NewsAndPromo = require('../models/newsAndPromo');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const v = require('node-input-validator');
const PointManagement = require('../services/pointManagement');
const User = require('../models/user');

router.post('/comments/add', async (req, res) => {
    var comment = {
        newsPromoId: req.body.newsPromoId,
        commentText: req.body.commentText,
        loginId: req.body.loginId
    };

    if (req.body) {
        let allUsersArr = [];
        allUsersArr.push(comment.loginId);
        let validUser = await User.findUserByLoginId(comment.loginId);
        console.log(validUser);
        if (validUser.custmainno) {
            let existingUsers = await User.getAllUsersByCustMainNo(validUser.custmainno);
            console.log(existingUsers);
            console.log(existingUsers.length);
            if (existingUsers.length > 0) {
                for (let i=0; i < existingUsers.length; i++) {
                    if (existingUsers[i].loginid != comment.loginId){
                        allUsersArr.push(existingUsers[i].loginid.toString());
                    }
                }
            }
        }

        console.log(allUsersArr);

        getNewsAndPromoObj(comment, req, res, function (err, newsPromoObj) {
            console.log('innnnnnnnnnnnn');
            if (err) {
                res.json(util.failed(err));
                return;
            }
            if (newsPromoObj) {
                var query = {"sourceId": newsPromoObj._id, "insertBy": { $in: allUsersArr } };
                Comments.find(query, {})
                    .exec(function (err, commentRes) {
                        if (err) {
                            logger.error(err);
                        }
                        if (!err) {
                            addComment(comment, req, res, function (err, comment) {
                                if (err) {
                                    res.json(util.failed(err));
                                    return;
                                }
                                comment.sourceId = newsPromoObj;
                                comment.save(function (err) {

                                    if (!err) {
                                        updateCommentCount(comment, req, res, async function (err, status) {
                                            if (err) {
                                                return res.send(util.failed(err));
                                                return;
                                            }
                                            let pointsData = {
                                                loginid: comment.insertBy,
                                                activityappid: 'NEWS COMMENTS',
                                                description: 'Comment on News'
                                            }
                                            let pointsAdded = 0;
                                            let pointsDescription = "";
                                            if (commentRes.length < 1){
                                                let toAddPoints = await PointManagement.addPointsForActivity(pointsData);
                                                if (toAddPoints.currentPoints){
                                                    pointsAdded = toAddPoints.currentPoints;
                                                    pointsDescription = util.getPointDescriptionContent(pointsAdded);
                                                }
                                            }
                                            return res.json(util.success(null,'','',pointsAdded,pointsDescription));
                                        });

                                    } else {
                                        res.json(util.failed(err));
                                    }
                                });
                            });

                            // res.json(util.success(null));
                        } else {
                            res.json(util.failed(err));
                        }
                    });
                }
            else {
                return res.json(util.failed(null, "News or promo not found"));
            }
        });
    } else {
        return res.json(util.failed(null, "Invalid payload"));
    }
});

function getNewsAndPromoObj(comment, request, response, cb) {

    var query = {"newsPromoId": comment.newsPromoId};
    NewsAndPromo.findOne(query, {}).exec(function (err, result) {

        if (!err) {
            cb(null, result);
        } else {
            return false;
        }
    });
}

function addComment(reqComment, request, response, cb) {
    var comment = new Comments();
    var date = new Date();
    comment.commentId = date.getTime();
    comment.commentText = reqComment.commentText;
    comment.insertDate = date;
    comment.insertBy = reqComment.loginId;
    cb(null, comment);
}

function updateCommentCount(reqComment, request, response, cb) {
    console.log(reqComment.sourceId.newsPromoId);
    NewsAndPromo.update(
        {newsPromoId: reqComment.sourceId.newsPromoId},
        {$inc: {commentCount: 1}}
    ).then(function () {
        // console.log('update done');
        cb(null, true);
    })
}

function decrementCommentCount(reqComment, request, response, cb) {
    // console.log(reqComment.newsPromoId);
    NewsAndPromo.update(
        {newsPromoId: reqComment.newsPromoId},
        {$inc: {commentCount: -1}}
    ).then(function () {
        // console.log('update done');
        cb(null, true);
    })
}


router.post('/comments/delete', auth.isAuthenticated, (req, res) => {
    var comment = {
        newsPromoId: req.body.newsPromoId,
        commentId: req.body.commentId
    };

    Comments.findOneAndRemove({"commentId": comment.commentId}, (err, result) => {
        // As always, handle any potential errors:
        if (err) return res.send(util.failed(err));
        const response = {
            commentId: comment.commentId
        };
        if (!err && result) {
            decrementCommentCount(comment, req, res, function (err, status) {
                if (err) {
                    return res.send(util.failed(err));
                    return;
                }
                return res.json(util.success(null));
            });
            // return res.json(util.success(response));
            // return res.json(util.success(response));
        }
        // return res.json(util.failed(null, "Comment not found."));
    });

    // Comments.findOneAndRemove({"commentId" : comment.commentId}, (err,result) => {
    //     // As always, handle any potential errors:
    //     if (err) return res.send(util.failed(err));
    //     // const response = {
    //     //     commentId: comment.commentId
    //     // };
    //     if (err) {
    //
    //     }
    //     if(!err && result){
    //         decrementCommentCount( comment, req, res, function (err, status) {
    //             if (err) {
    //                 return res.send(util.failed(err));
    //                 return;
    //             }
    //             return res.json(util.success(null));
    //         });
    //         // return res.json(util.success(response));
    //     }
    // });
});

router.get('/getAllComments/:newsPromoId', auth.isAuthenticated, (req, res) => {

    if (req.params) {
        var comment = {
            newsPromoId: req.params.newsPromoId
        };
        getNewsAndPromoObj(comment, req, res, function (err, newsPromoObj) {
            if (err) {
                res.json(util.failed(err));
                return;
            }
            if (newsPromoObj) {
                let data = [];
                var query = {"sourceId": newsPromoObj._id};
                Comments.find(query, {})
                    .sort({"insertDate": -1})
                    .exec(async function (err, result) {
                        //
                        if (err) {
                            logger.error(err);
                        }
                        if (!err) {

                            // console.log(result);
                            for (let i = 0; i < result.length; i++) {
                                result[i] = result[i].toObject();
                                result[i]['insertByName'] = "";
                                result[i]['insertByImage'] = "";
                                let insertDateFormatted = util.formatTimeStamp(result[i]['insertDate']);
                                result[i]['insertDate'] = insertDateFormatted;
                                if (result[i]['insertBy']) {

                                    let userDetails = {};
                                    try {
                                        userDetails = await util.getUserDetails(result[i]['insertBy']);
                                    } catch (err) {
                                        console.log("get commments error : ", err)
                                    }

                                    if (userDetails.name) {
                                        // console.log("name" , userDetails.name);
                                        result[i]['insertByName'] = userDetails.name;
                                        result[i]['insertByImage'] = userDetails.userimage || 'https://fmcdev001.southeastasia.cloudapp.azure.com/staticdata/images/user-4.png';
                                    }
                                }
                                else {

                                }

                                data.push(result[i]);
                            }
                            res.json(util.success(data));
                        } else {
                            return false;
                        }
                    });
            }
            else {
                return res.json(util.failed(null, "News or promo not found"));
            }
        });
    } else {
        return res.json(util.failed(null, "Invalid request"));
    }
});


router.post('/getAppComments', auth.isAuthenticated, (req, res) => {

    let validator = new v(req.body, {
        newsPromoId: 'required',
        page: 'required',
        limit: 'required'
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.json(util.failed({}, validator.errors));
        }


        var comment = {
            newsPromoId: req.body.newsPromoId
        };
        var pageOptions = {
            page: (req.body.page - 1) || 0,
            limit: req.body.limit || 10
        }
        getNewsAndPromoObj(comment, req, res, function (err, newsPromoObj) {
            if (err) {
                res.json(util.failed(err));
                return;
            }
            if (newsPromoObj) {

                if (pageOptions.page >= 0 && pageOptions.limit >= 0) {

                    // var data = [];

                    var data = {
                        "data": [],
                        "totalRecords": 0
                    }

                    var query = {"sourceId": newsPromoObj._id};
                    Comments.find(query, {})
                        .skip(pageOptions.page * pageOptions.limit)
                        .limit(pageOptions.limit)
                        .sort({"insertDate": -1})
                        .exec(function (err, result) {
                            //
                            if (err) {
                                logger.error(err);
                            }
                            if (!err) {

                                Comments.find(query, {}).count().exec(async function (err, count) {
                                    if (!err) {
                                        for (let i = 0; i < result.length; i++) {
                                            result[i] = result[i].toObject();
                                            result[i]['insertByName'] = "";
                                            result[i]['insertByImage'] = "";
                                            let insertDateFormatted = util.formatTimeStamp(result[i]['insertDate']);
                                            result[i]['insertDate'] = insertDateFormatted;
                                            if (result[i]['insertBy']) {

                                                let userDetails = {};
                                                try {
                                                    userDetails = await util.getUserDetails(result[i]['insertBy']);
                                                } catch (err) {
                                                    console.log("get commments error : ", err)
                                                }

                                                if (userDetails.name) {
                                                    // console.log("name" , userDetails.name);
                                                    result[i]['insertByName'] = userDetails.name;
                                                    result[i]['insertByImage'] = userDetails.userimage || 'https://fmcdev001.southeastasia.cloudapp.azure.com/staticdata/images/user-4.png';
                                                }
                                            }
                                            else {

                                            }

                                            data['data'].push(result[i]);
                                        }
                                        // data['data'] = result;
                                        data['totalRecords'] = count;
                                        res.json(util.success(data));
                                    }
                                    else {
                                        res.json(util.failed(err));
                                    }
                                })

                                // console.log(result);

                                // res.json(util.success(data));
                            } else {
                                return false;
                            }
                        });
                }
                else {
                    res.json(util.failed('Invalid Page No or limit'));
                }
            }
            else {
                return res.json(util.failed(null, "News or promo not found"));
            }
        });
    });


});

module.exports = router;
