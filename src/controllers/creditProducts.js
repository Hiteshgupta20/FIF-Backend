var express = require('express');
var router = express.Router();
var CreditProducts = require('../models/creditProducts');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');

router.post('/creditProducts/add', auth.isAuthenticated, (req, res) => {
    let payload = req.body;
    if (payload.name) {
        getCreditProductObj(payload, req, res, function (err, creditProdObj) {
            if (err) {
                return res.json(util.failed("Something went wrong"));
            }
            if (creditProdObj) {
                return res.json(util.failed({}, "Record with this name already exists."));
            }
            else {
                let creditProducts = addCreditProducts(req);
                creditProducts.save(function (err) {
                    if (!err) {
                        res.json(util.success(null));
                    } else {
                        res.json(util.failed(err));
                    }
                });
            }
        });
    }
    else {
        return res.json(util.failed("Mandatory parameters missing"));
    }
});


function getCreditProductObj(prod, request, response, cb) {
    var query = { "name": prod.name };
    CreditProducts.findOne(query, {}).exec(function (err, result) {
        if (!err) {
            cb(null, result);
        } else {
            return false;
        }
    });
}

function addCreditProducts(req) {
    if (req.body.webviewUrl) {
        var creditProducts = new CreditProducts();
        var date = new Date();
        creditProducts.creditProductId = date.getTime();
        creditProducts.name = req.body.name;
        creditProducts.imageUrl = req.body.imageUrl;
        creditProducts.webviewUrl = req.body.webviewUrl;
        creditProducts.status = req.body.status;
        creditProducts.insertDate = date;
        creditProducts.insertBy = 111;
        creditProducts.lastModifiedDate = null;
        creditProducts.lastModifiedBy = 111;
        creditProducts.isWebviewUrl = true;
        return creditProducts;
    }
    if (req.body.titles) {
        let titles = req.body.titles;
        for (let i = 0; i < titles.length; i++) {
            for (let j = 0; j < titles[i].rows.length; j++) {
                let rowLabel = titles[i].rows[j]['label'];
                let rowLabelFormatted = rowLabel.replace(/ *\([^)]*\) */g, "");
                let rowLabelFormattedConcatenated = rowLabelFormatted.replace(/ /g, '_').toLowerCase();
                titles[i].rows[j]['apiKey'] = rowLabel;
            }
        }
        // let apiKey =
        var creditProducts = new CreditProducts();
        var date = new Date();
        creditProducts.creditProductId = date.getTime();
        creditProducts.name = req.body.name;
        creditProducts.imageUrl = req.body.imageUrl;
        creditProducts.titles = req.body.titles;
        creditProducts.status = req.body.status;
        creditProducts.insertDate = date;
        creditProducts.insertBy = 111;
        creditProducts.lastModifiedDate = null;
        creditProducts.lastModifiedBy = 111;
        creditProducts.isWebviewUrl = false;
        return creditProducts;
    }
}

router.post('/creditProducts/update', auth.isAuthenticated, (req, res) => {
    var creditProductId = req.body.creditProductId || "";
    var updated_record = updateRequest(req);
    CreditProducts.findOneAndUpdate({ "creditProductId": creditProductId }, updated_record, (err, result) => {
        // console.log(result);
        if (err) return res.send(util.failed(err));
        if (err == null && result == null)
            return res.send(util.failed(null, "Credit Product not found."));
        return res.json(util.success(null));
    })
});

function updateRequest(req) {
    var currentDate = new Date();
    if (req.body.titles) {
        let titles = req.body.titles;
        for (let i = 0; i < titles.length; i++) {
            for (let j = 0; j < titles[i].rows.length; j++) {
                let rowLabel = titles[i].rows[j]['label'];
                let rowLabelFormatted = rowLabel.replace(/ *\([^)]*\) */g, "");
                let rowLabelFormattedConcatenated = rowLabelFormatted.replace(/ /g, '_').toLowerCase();
                // titles[i].rows[j]['apiKey'] = rowLabelFormattedConcatenated;
                titles[i].rows[j]['apiKey'] = rowLabel;
            }
        }
    }
    req.body.lastModifiedDate = currentDate;
    return req.body;
}

router.post('/creditProducts/delete', auth.isAuthenticated, (req, res) => {
    let creditProductId = req.body.creditProductId || "";
    CreditProducts.findOneAndRemove({ "creditProductId": creditProductId }, (err, result) => {
        // As always, handle any potential errors:
        if (err) return res.send(util.failed(err));
        const response = {
            creditProductId: creditProductId
        };
        if (!err && result) {
            return res.json(util.success(response));
        }
        return res.json(util.failed(null, "Credit Product data not found."));
    });
});

router.post('/getAllCreditProductsData', auth.isAuthenticated, (req, res) => {
    var conditions = {};
    var and_clauses = [];
    var searchParams = req.body.searchParams || {};
    var isExport = req.body.isExport || 0;

    let payload = req.body;
    let orderByData = util.formatOrderByClauseMongo(payload);

    if (searchParams) {
        if (searchParams.name) {
            and_clauses.push({ 'name': { '$regex': searchParams.name, '$options': 'i' } });
        }
        if (searchParams.status) {
            and_clauses.push({ 'status': searchParams.status });
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
        CreditProducts.find(conditions)
            .exec(function (err, result) {
                if (!err) {
                    CreditProducts.find(conditions).count().exec(function (err, count) {
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
        CreditProducts.find(conditions)
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort(orderByData)
            .exec(function (err, result) {
                if (!err) {
                    CreditProducts.find(conditions).count().exec(function (err, count) {
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