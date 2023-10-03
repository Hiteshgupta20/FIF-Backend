const Promise = require('promise');
const reports = require('../models/reports');
const util = require('../controllers/util');

module.exports = {

    getActiveUserReports: async function (payload) {
        return new Promise(function(resolve, reject) {

            reports.getActiveUserReports()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }

};
