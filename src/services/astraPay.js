const Promise = require('promise');
const utils = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');
const request = require('request');
const AstraPay = require('../models/astraPay');
const ContractsService = require('../services/contracts');
const CrmAuthService = require('../services/crmAuth');
const PointManagement = require('../services/pointManagement');
const NotificationService = require('../services/notification');
const CreditApplicationService = require('../services/creditApplication');
const _ = require('lodash');

module.exports = {
    getApplicationToken: async function (headersData) {
        return new Promise(function (resolve, reject) {
            try {
                request.post({
                    rejectUnauthorized: false,
                    headers: headersData,
                    url: appConstants.fifAstraPayTokenBaseUrl + 'util/getToken',
                    json: {
                        "account": "FMC",
                        "securityKey": "4126154d7be2331681854f09a77c23d64c115945"
                    }
                }, function (err, response, body) {
                    if (err) {
                        logger.error('Get Application Token API failed:', err);
                        reject(err);
                    }
                    resolve(body);
                });
            }
            catch (err) {
                logger.error('Get Application Token API failed:', err);
                reject(err);
            }
        });
    },
    getWebViewUrlKey: async function (headersData, reqData) {
        return new Promise(function (resolve, reject) {
            try {
                request.post({
                    rejectUnauthorized: false,
                    headers: headersData,
                    url: appConstants.fifAstraPayTokenBaseUrl + 'webview/account',
                    json: {
                        "account": reqData.mobileNo
                    }
                }, function (err, response, body) {
                    if (err) {
                        logger.error('WebView URL Key API failed:', err);
                        reject(err);
                    }
                    resolve(body);
                });
            }
            catch (err) {
                logger.error('Webview URL Key API failed:', err);
                reject(err);
            }
        });
    },
    getAstraPayBalance: async function (headersData, reqData) {
        return new Promise(function (resolve, reject) {
            try {
                request.post({
                    rejectUnauthorized: false,
                    headers: headersData,
                    url: appConstants.fifAstraPayTokenBaseUrl + 'merchant/getBalance',
                    json: {
                        "account": reqData.mobileNo,
                        "issuer": "850500"
                    }
                }, function (err, response, body) {
                    if (err) {
                        logger.error('Get Balance API failed:', err);
                        reject(err);
                    }
                    resolve(body);
                });
            }
            catch (err) {
                logger.error('Get Balance API failed:', err);
                reject(err);
            }
        });
    },
    addAstraPayDetails: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = utils.getTimestamp();
            data.loginId = payload.loginId;
            data.msisdn = payload.msisdn;
            data.status = payload.status;
            data.balance = payload.balance;
            data.insertDate = date;
            data.modifyDate = null;
	    //data.astrapaymobileno=payload.astrapaymobileno;
            AstraPay.addAstraPayDetails(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    modifyAstraPayDetails: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = utils.getTimestamp();
            data.loginId = payload.loginId;
            data.balance = payload.balance;
            data.modifyDate = date;
	   //astraPayNum:payload.astraPayNum;
	    data.astrapaymobileno=payload.astrapaymobileno;
            AstraPay.modifyAstraPayDetails(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

     resynchAstraPayDetails: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = utils.getTimestamp();
            data.loginId = payload.loginId;
            data.balance = payload.balance;
            data.modifyDate = date;
	//    data.astrapaymobileno = payload.astrapaymobileno;

            AstraPay.resynchAstraPayDetails(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },	

    changeAstraPayStatus: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = utils.getTimestamp();
            data.loginId = payload.loginId;
            data.status = payload.status;
            data.modifyDate = date;
	    data.astrapaymobileno = payload.astraPayNumber	
            AstraPay.changeAstraPayStatus(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAstraPayDetails: async function (data) {
        return new Promise(function (resolve, reject) {

            AstraPay.getAstraPayDetails(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }
}
