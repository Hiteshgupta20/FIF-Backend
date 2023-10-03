const Promise = require('promise');
const AppNotificationSettings = require('../models/appNotificationSettings');
const util = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');

module.exports = {

    addModules: async function (payload) {
        return new Promise(async function(resolve, reject) {
            
            try{
                let data = {
                    loginId : payload.loginId,
                    modules : payload.modules || {}
                }
                AppNotificationSettings.addModule(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            catch (err){
                reject(err);
            }

        });
    },
    getModules: async function (loginId) {
        loginId = loginId ? loginId.toString(): "";
        return new Promise(async function(resolve, reject) {
            
            try{
                let data = {
                    loginId : loginId
                }
                AppNotificationSettings.getModules(data)
                    .then(function (result) {
                        if(result.length == 0 ){
                            result.push({
                                userid : loginId,
                                modules : {
                                    stnk  : true,
                                    auction : true
                                }
                            });
                        }
                        resolve(result[0]);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            catch (err){
                reject(err);
            }

        });
    }
};
