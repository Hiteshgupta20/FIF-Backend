const Promise = require('promise');
const utils = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');
const request = require('request');

module.exports =  {
    getAstraPayAuthToken: async function(){
        return new Promise(function(resolve,reject){

            let formReqData = {
                username: appConstants.astraPayAuthCredentials.authUsername,
                password: appConstants.astraPayAuthCredentials.authPassword,
                client_id: appConstants.astraPayAuthCredentials.authClientId,
                client_secret: appConstants.astraPayAuthCredentials.authClientSecret,
                grant_type: appConstants.astraPayAuthCredentials.authGrantType,
            }

	   console.log(formReqData);
            request.post({
                    rejectUnauthorized: false,
                    url: 'https://axway-dev.astrapay.com:8089/api/oauth/token',
                    form: formReqData
                },
                function(err, httpResponse, body) {
		   console.log(err);
                    if (!err) {
                        try {
                            let response = JSON.parse(body);
                            if (response['access_token']) {
                                
                                let obj = {
                                    accessToken: response.access_token
                                }
                                resolve(obj);
                            } else {
                                let errObj = {
                                    'error': 'Invalid User Credentials'
                                }
                                reject(errObj);
                            }
                        }
                        catch(error) {
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

    getContractCRMAuthToken: async function(){
        return new Promise(function(resolve,reject){

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
                function(err, httpResponse, body) {
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
                        }
                        catch(error) {
                                reject(new Error('Something went wrong, please try again.'));
                            }
                        } 
                        else {
                        let errObj = {
                            'error': 'Invalid User Credentials'
                        }
                        reject(errObj);
                    }
                });
        });
    }
}
