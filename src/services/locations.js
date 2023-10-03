const Promise = require('promise');
const Locations = require('../models/locations');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports = {

    getLocations: async function (payload) {
        return new Promise(async function(resolve, reject) {
            
            try{
                let data = {
                    lat : payload.latitude,
                    long : payload.longitude,
                }
                if(payload.searchValue){
                    Locations.getAllLocations(payload.searchValue)
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                }else{
                    Locations.getLocations(data)
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                }

            }
            catch (err){
                reject(err);
            }
        });
    }
};
