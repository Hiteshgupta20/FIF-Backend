var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const pool = require('../config/postgreDB');
const request = require('request');
const bcrypt = require('bcrypt');
const v = require('node-input-validator');
const multiparty = require('multiparty');
const querystring = require('querystring');
const FormData = require('form-data');
const fs = require('fs-extra');
const AppConstants = require('../config/appConstants');
const NotificationService = require('../services/notification');
const activityLogs = require('../services/activityLogs');
const moment = require('moment');
const astraPayAuth = require('../services/astraPayauth');
const basePath = 'astraPay';
const astraPayService = require('../services/astraPay');

router.post('/activateAstraPay', (req, res) => {
    console.log('=================');
    console.log(req.body);
    let validator = new v(req.body, {
        loginId: 'required',
        mobileNo: 'required',
    });

    let astrPayData = req.body;

    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Mandatory parameters are missing.'));
        }

        try {
	    console.log("-------------------- 1 -------------------");
            let loginData = await astraPayAuth.getAstraPayAuthToken();
            astrPayData.accessToken = loginData.accessToken;
	    console.log("-------------------- 2 -------------------");

            let headersObj = {
                "Authorization": "Bearer " + astrPayData.accessToken,
                "Content-Type": "application/json"
            }

            try {
                let applicationTokenResult = await astraPayService.getApplicationToken(headersObj);
                console.log(applicationTokenResult);
                console.log("applicationTokenResult=" + applicationTokenResult);
                //let applicationToken = 'GdnSmb01h90eRtt94qexYgVlvOhxXS6gNBWK625Ll8O8jrJJ6DbaT5';
                let applicationToken = applicationTokenResult.token;
                let msisdn = req.body.astraPayNumber;

                let urlKeyReqData = { mobileNo: req.body.astraPayNumber }
                let headersObj2 = {
                    "Authorization": "Bearer " + astrPayData.accessToken,
                    "Content-Type": "application/json",
                    "X-Application-Token": "123"
                }
                try {
                    let urlKeyResult = await astraPayService.getWebViewUrlKey(headersObj2, urlKeyReqData);
                    let urlKey = urlKeyResult;
                    console.log("urlKey=" + urlKey)

                    let resObj = {
                        'url': 'https://cygnus.astrapay.com/fifpayrest/webview/validation?account=',
                        'urlKey': urlKey,
                        'applicationToken': applicationToken
                    }

                    let loginId = req.body.loginId;
                    let checkAstraPayActivation = await astraPayService.getAstraPayDetails(astrPayData);
                    if (checkAstraPayActivation == 0) {
                        let astraPayAddDetails = {
                            loginId: loginId,
                            msisdn: req.body.mobileNo,
                            //astrapaymobileno:req.body.mobileNo,
                            status: 0,
                            balance: 0
                        }
                        let addAstraPay = await astraPayService.addAstraPayDetails(astraPayAddDetails);
                    } /*else {
                        let astraPayAddDetails = {
                            loginId: loginId,
                            msisdn: req.body.mobileNo,
                            //astrapaymobileno:req.body.mobileNo,
                            status: 2,
                            balance: 0
                        }
                        let addAstraPay = await astraPayService.resynchAstraPayDetails(astraPayAddDetails);



                    }*/
                    let activityData = util.prepareActivityLogsData(loginId, 'Astra Pay Activation Request', 'Astra Pay Activation Request');
                    await activityLogs.createActivityLog(activityData);
                    console.log(resObj);
                    res.json(util.success(resObj, '', '', 0));
                }
                catch (err) {
                    res.json(util.failed(err));
                }
            }
            catch (err) {
                res.json(util.failed(err));
            }
        }
        catch (err) {
            res.json(util.failed(err));
        }
    });
});

router.post('/astraPayCheckBalance', (req, res) => {

    let validator = new v(req.body, {
        loginId: 'required',
        mobileNo: 'required',
        astraPayNumber: 'required'
    });

    console.log(req.body);
    let astrPayData = req.body;

    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Mandatory parameters are missing.'));
        }
        try {
            let checkAstraPayActivation = await astraPayService.getAstraPayDetails(astrPayData);
            if (checkAstraPayActivation.length != 0) {
                try {
                    let loginData = await astraPayAuth.getAstraPayAuthToken();
                    console.log(loginData);
                    astrPayData.accessToken = loginData.accessToken;


                    let headersObj = {
                        "Authorization": "Bearer " + astrPayData.accessToken,
                        "Content-Type": "application/json"
                    }

                    try {

                        let applicationTokenResult = await astraPayService.getApplicationToken(headersObj);
                        let applicationToken = applicationTokenResult.token;
                        let urlKeyReqData = {
                            //mobileNo: req.body.mobileNo
                            mobileNo: req.body.astraPayNumber
                        }
                        let headersObj2 = {
                            "Authorization": "Bearer " + astrPayData.accessToken,
                            "Content-Type": "application/json",
                            "x-application-token": applicationToken
                        }
                        try {
                            let getBalanceResult = await astraPayService.getAstraPayBalance(headersObj2, urlKeyReqData);
                            // let urlKey = urlKeyResult.token;i
                            console.log("Return from balance");
                            console.log(getBalanceResult);

                            if (getBalanceResult.errors.code == 00) {
                                let astraPayAddDetails = {
                                    loginId: req.body.loginId,
                                    msisdn: req.body.mobileNo,
                                    balance: getBalanceResult.balance,
                                    //astraPayNum:req.body.astraPayNum
                                }
                                let modifyAstraPayBal = await astraPayService.modifyAstraPayDetails(astraPayAddDetails);
                                let activityData = util.prepareActivityLogsData(astraPayAddDetails.loginId, 'Astra Pay Balance Checked', 'Astra Pay Balance Checked');
                                await activityLogs.createActivityLog(activityData);
                                let resObj = {
                                    'balance': getBalanceResult.balance || 0,
                                    'msisdn': req.body.mobileNo,
                                    'loginId': req.body.loginId
                                }
                                res.json(util.success(resObj, '', '', 0));
                            }
                            else {
                                res.json(util.failed('Balance API failed'));
                            }

                        }
                        catch (err) {
                            //res.json(util.failed(err));
                            res.json(util.failed("Mohon maaf AstraPay sedang tidak dapat di akses","Mohon maaf AstraPay sedang tidak dapat di akses",500));
                        }
                    }
                    catch (err) {
                        res.json(util.failed(err));
                    }
                }
                catch (err) {
                    res.json(util.failed(err));
                }
            }
            else {
                res.json(util.failed({}, 'Astra Pay not activated'));
            }
        }
        catch (err) {

        }


    });
});

router.post('/changeAstraPayStatus', (req, res) => {

    let validator = new v(req.body, {
        loginId: 'required',
        status: 'required',
	
        astraPayNumber: 'required'
    });
    console.log(req.body)
    let astrPayData = req.body;

    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Mandatory parameters are missing.'));
        }
        try {
            console.log("Getting Balance --");
            if(req.body.status==1){
		let astraPayAddDetails = {
                    loginId: req.body.loginId,
                    msisdn: req.body.mobileNo,
                    astrapaymobileno:req.body.astraPayNumber,
                    status: 1,
                    balance: 0
                }
                //let addAstraPay = await astraPayService.addAstraPayDetails(astraPayAddDetails);
                console.log("Getting Balance --");
                let loginData = await astraPayAuth.getAstraPayAuthToken();
                astrPayData.accessToken = loginData.accessToken;

                let headersObj = {
                    "Authorization": "Bearer " + astrPayData.accessToken,
                    "Content-Type": "application/json"
                }
                let applicationTokenResult = await astraPayService.getApplicationToken(headersObj);
                let applicationToken = applicationTokenResult.token;
                let urlKeyReqData = {
                    mobileNo: req.body.astraPayNumber
                }
                let headersObj2 = {
                    "Authorization": "Bearer " + astrPayData.accessToken,
                    "Content-Type": "application/json",
                    "x-application-token": applicationToken
                }
                let getBalanceResult = await astraPayService.getAstraPayBalance(headersObj2, urlKeyReqData);
                console.log("************* Return from balance ***************");
                console.log(getBalanceResult);
                console.log("*************************************************");


                if (getBalanceResult.errors.code == 00) {
                    let astraPayAddDetails = {
                        loginId: req.body.loginId,
                        msisdn: req.body.mobileNo,
                        balance: getBalanceResult.balance,
			astrapaymobileno:req.body.astraPayNumber
                    }
                    let modifyAstraPayBal = await astraPayService.modifyAstraPayDetails(astraPayAddDetails);
                }
            }
                // Balance end --
                let astraPayUpdateDetails={};
		if(req.body.status==1){
			
		       astraPayUpdateDetails = {
                        loginId: req.body.loginId,
                        msisdn: req.body.mobileNo,
			status:req.body.status,
                        //balance: getBalanceResult.balance,
                        astraPayNumber:req.body.astraPayNumber
                    }
		}else{
		   astraPayUpdateDetails = {
                        loginId: req.body.loginId,
                        msisdn: req.body.mobileNo,
			status:req.body.status,
                        //balance: getBalanceResult.balance,
                        astraPayNumber:null

		}}
		console.log(astraPayUpdateDetails);
                let changeAstraPayStatus = await astraPayService.changeAstraPayStatus(astraPayUpdateDetails);
                if (changeAstraPayStatus) {
                    let statusText = "";
                    if (astrPayData.status) {
                        statusText = "Astra Pay Activated";
                    }
                    else {
                        statusText = "Astra Pay Deactivated";
                    }
                    let loginId = astrPayData.loginId;
                    let activityData = util.prepareActivityLogsData(loginId, statusText, statusText);
                    await activityLogs.createActivityLog(activityData);
                    console.log(changeAstraPayStatus);
                    res.json(util.success(changeAstraPayStatus, '', '', 0));
                }
                else {
                    res.json(util.failed({}, 'Astra Pay not activated for this account.'));
                }
            }
        catch (err) {
                res.json(util.failed(err));
            }
        });
});

router.post('/reSyncAstraPay', (req, res) => {

    console.log(req)
    let validator = new v(req.body, {
        loginId: 'required',
        mobileNo: 'required',

    });

    let astrPayData = req.body;

    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Mandatory parameters are missing.'));
        }

        try {
            let loginData = await astraPayAuth.getAstraPayAuthToken();
            console.log(loginData);
            astrPayData.accessToken = loginData.accessToken;


            let headersObj = {
                "Authorization": "Bearer " + astrPayData.accessToken,
                "Content-Type": "application/json"
            }

            try {
                let applicationTokenResult = await astraPayService.getApplicationToken(headersObj);
                let applicationToken = applicationTokenResult.token;
                let urlKeyReqData = {
                    mobileNo: req.body.mobileNo
                }
                let headersObj2 = {
                    "Authorization": "Bearer " + astrPayData.accessToken,
                    "Content-Type": "application/json",
                    "X-Application-Token": "123"
                }
                try {
                    let urlKeyResult = await astraPayService.getWebViewUrlKey(headersObj2, urlKeyReqData);
                    let urlKey = urlKeyResult.token;

                    let resObj = {
                        'url': 'https://cygnus.astrapay.com/fifpayrest/webview/validation?account=',
                        'urlKey': urlKey,
                        'applicationToken': applicationToken
                    }

                    let loginId = req.body.loginId;
                    let date = utils.getTimestamp();
                    let astraPayAddDetails = {
                        loginId: loginId,
                        msisdn: req.body.mobileNo,
                        status: 1,
                        balance: 0,
                        insertDate: null,
                        modifyDate: date
                    }
                    let addAstraPay = await astraPayService.addAstraPayDetails(astraPayAddDetails);
                    let activityData = util.prepareActivityLogsData(loginId, 'Astra Pay Activated', 'Astra Pay Activated');
                    await activityLogs.createActivityLog(activityData);
                    console.log(resObj);
                    res.json(util.success(resObj, '', '', 0));
                }
                catch (err) {
                    res.json(util.failed(err));
                }
            }
            catch (err) {
                res.json(util.failed(err));
            }
        }
        catch (err) {
            res.json(util.failed(err));
        }
    });
});



module.exports = router;
