const Promise = require('promise');
const utils = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');
const request = require('request');

module.exports = {
    getCRMAuthToken: async function () {
        return new Promise(function (resolve, reject) {
            let formReqData = {
                username: appConstants.crmAuthCredentials.authUsername,
                password: appConstants.crmAuthCredentials.authPassword,
                client_id: appConstants.crmAuthCredentials.authClientId,
                client_secret: appConstants.crmAuthCredentials.authClientSecret,
                grant_type: appConstants.crmAuthCredentials.authGrantType,
            }
            request.post({
                url: appConstants.fifCreditAuthUrl,
                form: formReqData
            },
                function (err, httpResponse, body) {
                    if (!err) {
                        try {
                            body = JSON.parse(body);
                            if (body.access_token) {

                                let obj = {
                                    accessToken: body.access_token
                                }
                                resolve(obj);
                            } else {
                                let errObj = {
                                    'error': 'Invalid User Credentials'
                                }
                                reject(errObj);
                            }
                        } catch (error) {
                            reject(new Error('Something went wrong, please try again.'));
                        }

                    } else {
                        let errObj = {
                            'error': 'Invalid User Credentials'
                        }
                        reject(errObj);
                    }
                });
        });
    },

    getContractCRMAuthToken: async function () {
        return new Promise(function (resolve, reject) {

            let formReqData = {
                username: appConstants.crmAuthCredentials.authUsername,
                password: appConstants.crmAuthCredentials.authPassword,
                client_id: appConstants.crmAuthCredentials.authClientId,
                client_secret: appConstants.crmAuthCredentials.authClientSecret,
                grant_type: appConstants.crmAuthCredentials.authGrantType,
            }
            request.post({
                url: appConstants.fifCRMAuthUrl,
                form: formReqData
            },
                function (err, httpResponse, body) {
                    if (!err) {
                        try {
                            body = JSON.parse(body);
                            if (body.access_token) {

                                let obj = {
                                    accessToken: body.access_token
                                }
                                resolve(obj);
                            } else {
                                let errObj = {
                                    'error': 'Invalid User Credentials'
                                }
                                reject(errObj);
                            }
                        } catch (error) {
                            reject(new Error('Something went wrong, please try again.'));
                        }
                    } else {
                        let errObj = {
                            'error': 'Invalid User Credentials'
                        }
                        reject(errObj);
                    }
                });
        });
    },
    getIssAuthToken: async function () {
        return new Promise(function (resolve, reject) {
            request.get({
                url: appConstants.issAuthUrl + "?username=" + appConstants.issAuthCredentials.username + "&password=" + appConstants.issAuthCredentials.password + "&realm=" + appConstants.issAuthCredentials.realm,
            },
                function (err, httpResponse, body) {
                    if (!err) {
                        try {
                            body = JSON.parse(body);
                            if (body.data.token) {
                                let obj = {
                                    accessToken: body.data.token
                                }
                                resolve(obj);
                            } else {
                                let errObj = {
                                    'error': 'Invalid User Credentials'
                                }
                                reject(errObj);
                            }
                        } catch (error) {
                            reject(new Error('Something went wrong, please try again.'));
                        }

                    } else {
                        let errObj = {
                            'error': 'Invalid User Credentials'
                        }
                        reject(errObj);
                    }
                });
        });
    },

}