var express = require('express');
var router = express.Router();
var CreditSimulation = require('../models/creditSimulation');
var basePath = '/';
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const v = require('node-input-validator');
const activityLogs = require('../services/activityLogs');

router.post('/creditSimulation/add', auth.isAuthenticated, (req, res) => {

    let payload = req.body;
    if (payload.productType){
        getCreditSimulationObj(payload, req, res, function (err, creditSimObj) {
            if (err) {
                return res.json(util.failed("Something went wrong"));
            }
            if (creditSimObj) {
                return res.json(util.failed({},"Record with this name already exists."));
            }
            else {
                let creditSimulation = addCreditSimulationData(req);
                creditSimulation.save(function (err) {
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

function getCreditSimulationObj(prod, request, response, cb) {
    var query = {"productType": prod.productType};
    CreditSimulation.findOne(query, {}).exec(function (err, result) {
        if (!err) {
            cb(null, result);
        } else {
            return false;
        }
    });
}

router.post('/creditSimulation/getEstimate', auth.isAuthenticated, (req, res) => {

    let validator = new v(req.body, {
        amount: 'required',
        termOfPayment: 'required',
        downPayment: 'required',
        rate: 'required'
    });

    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, validator.errors));
        }

        let estimateData = {
            amount: req.body.amount,
            termOfPayment: req.body.termOfPayment,
            downPayment: req.body.downPayment,
            rate: req.body.rate,
            loginId: req.body.loginId || 0
        }

        // let installment = ((estimateData.amount - estimateData.downPayment) * estimateData.rate)/estimateData.termOfPayment;

        let rem = estimateData.amount - estimateData.downPayment;

        let outAmount = (rem * (estimateData.rate / 100)) + rem;

        let installment = outAmount/estimateData.termOfPayment;

        installment = Math.round(installment);

        let resObj = {
            amount: req.body.amount,
            termOfPayment: req.body.termOfPayment,
            downPayment: req.body.downPayment,
            rate: req.body.rate,
            installment: installment
        }

        // let loginId = req.params.loginId;
        let activityData = util.prepareActivityLogsData(estimateData.loginId, 'Credit Simulation', 'Credit Simulation');
        await activityLogs.createActivityLog(activityData);

        res.json(util.success(resObj));

    });

    // let creditSimulation = addCreditSimulationData(req);
    // creditSimulation.save(function (err) {
    //     if (!err) {
    //         res.json(util.success(null));
    //     } else {
    //         res.json(util.failed(err));
    //     }
    // });
});

function addCreditSimulationData(req) {
    var creditSimulation = new CreditSimulation();
    var date = new Date();
    creditSimulation.creditSimulationId = date.getTime();
    creditSimulation.productType = req.body.productType;
    creditSimulation.termOfPayment = req.body.termOfPayment;
    creditSimulation.rate = req.body.rate;
    creditSimulation.downPayment = req.body.downPayment;
    creditSimulation.status = req.body.status;
    creditSimulation.insertDate = date;
    creditSimulation.insertBy = req.body.insertBy || 111;
    creditSimulation.lastModifiedDate = null;
    creditSimulation.lastModifiedBy = creditSimulation.insertBy;
    return creditSimulation;
}

router.post('/creditSimulation/update', auth.isAuthenticated, (req, res) => {
    var creditSimulationId = req.body.creditSimulationId || "";
    var updated_record = updateRequest(req);
    CreditSimulation.findOneAndUpdate({"creditSimulationId": creditSimulationId}, updated_record, (err, result) => {
        console.log(result);
        if (err) return res.send(util.failed(err));
        if (err == null && result == null)
            return res.send(util.failed(null, "Credit Simulation data not found."));
        return res.json(util.success(null));
    })
});

function updateRequest(req) {
    var currentDate = new Date();
    req.body.lastModifiedDate = currentDate;
    return req.body;
}

router.post('/creditSimulation/delete', auth.isAuthenticated, (req, res) => {
    let creditSimulationId = req.body.creditSimulationId || "";
    CreditSimulation.findOneAndRemove({"creditSimulationId": creditSimulationId}, (err, result) => {
        // As always, handle any potential errors:
        if (err) return res.send(util.failed(err));
        const response = {
            creditSimulationId: creditSimulationId
        };
        if (!err && result) {
            return res.json(util.success(response));
        }
        return res.json(util.failed(null, "Credit Simulation data not found."));
    });
});

router.post('/getAllCreditSimulationData', auth.isAuthenticated, (req, res) => {
    var conditions = {};
    var and_clauses = [];
    var searchParams = req.body.searchParams;
    var isExport = req.body.isExport || 0;
    let payload = req.body;
    let orderByData = util.formatOrderByClauseMongo(payload);
    if (searchParams) {
        if (searchParams.productType) {
            and_clauses.push({'productType': searchParams.productType});
        }
        if (searchParams.status) {
            and_clauses.push({'status': searchParams.status});
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
        CreditSimulation.find(conditions)
            .populate({path: 'productType', select: 'name'})
            .exec(function (err, result) {
                if (!err) {
                    CreditSimulation.count().exec(function (err, count) {
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
        CreditSimulation.find(conditions)
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort(orderByData)
            .populate({path: 'productType', select: 'name'})
            .exec(function (err, result) {
                if (!err) {
                    CreditSimulation.count().exec(function (err, count) {
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

router.post('/getAppCreditSimulationData', auth.isAuthenticated, (req, res) => {
    var conditions = {};
    var and_clauses = [];
    var isExport = req.body.isExport || 0;
    and_clauses.push({'status': '1'});
    if (and_clauses.length > 0) {
        conditions['$and'] = and_clauses;
    }


    var pageOptions = {
        page: (req.body.page - 1) || 0,
        limit: req.body.limit || 10
    }

    var data = {
        "data": [],
        "totalRecords": 0
    }

    CreditSimulation.find(conditions)
        .sort({"insertDate": -1})
        .populate({path: 'productType', select: 'name'})
        .exec(function (err, result) {
            if (!err) {
                CreditSimulation.count().exec(function (err, count) {
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


});

module.exports = router;
