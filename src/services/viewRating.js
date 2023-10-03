const Promise = require('promise');
const viewRating = require('../models/viewRating');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');

module.exports = {

    viewSurveyRating: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            if (payload.offset) {
                data.offset = payload.offset;
            }
            else {
                data.offset = (payload.page - 1)* payload.limit || 0;
            }
            
            let isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }


            data.orderByClause = util.formatOrderByClause(payload, 't1.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`t2.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.activity) {
                    whereClause.push(`t3.activityid='${searchParams.activity}'`)
                }

                if (searchParams.rating) {
                    whereClause.push(`t1.rating='${searchParams.rating}'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;
            if (isExport == 0){
                viewRating.getSurveyRating(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                viewRating.getAllSurveyRating(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    viewSurveyRatingCount: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            let isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }


            data.orderByClause = util.formatOrderByClause(payload, 't1.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`t2.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.activity) {
                    whereClause.push(`t3.activityid='${searchParams.activity}'`)
                }

                if (searchParams.rating) {
                    whereClause.push(`t1.rating='${searchParams.rating}'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;
            viewRating.getTotalCountSurveyRating(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });

        });
    },

    getSurveyDetails: async function (data) {
        return new Promise(function(resolve, reject) {
            
            let data = {};

            data.activityappid = payload.activityAppId;

            viewRating.addCustomerRating(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getRatingData: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            data.activityappid = payload.activityappid;
            
            viewRating.getRatingData(data)
                .then(function (result) {
                    resolve(result[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    addCustomerRating: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};

            data.surveyid = payload.surveyId;
            data.loginid = payload.loginId;
            // data.rating = payload.rating;
            data.remarks  = payload.remarks;

            let rating = payload.rating;
            if (rating){
                rating = Math.round( rating * 10 ) / 10;
            }

            data.rating = rating;

            viewRating.addCustomerRating(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

};