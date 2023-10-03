const Promise = require('promise');
const ManageRating = require('../models/manageRating');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');

module.exports = {

    addSurveyRating: async function (data) {
        return new Promise(function(resolve, reject) {
            ManageRating.addSurveyRating(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteSurveyRating: async function (data) {
        return new Promise(function(resolve, reject) {
            ManageRating.deleteSurveyRating(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    editSurveyrating: async function (data) {
        return new Promise(function(resolve, reject) {
            ManageRating.editSurveyRating(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },


    getSurveyRating: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            let isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload, 's.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.title) {
                    whereClause.push(`s.title ilike '%${searchParams.title}%'`)
                }

                if (searchParams.activity) {
                    whereClause.push(`s.activityid = '${searchParams.activity}'`)
                }

                if (searchParams.status) {
                    whereClause.push(`s.status='${searchParams.status}'`)
                }

                if (searchParams.effectiveDate) {
                    if (  searchParams.effectiveDate.from && searchParams.effectiveDate.to) {
                        whereClause.push(`date_trunc('day',effectivedate) between
                         to_date('${searchParams.effectiveDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.effectiveDate.to}','DD-MM-YYYY')`)
                    }
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;
            if (isExport == 0) {
                ManageRating.getSurveyRating(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                ManageRating.getAllSurveyRating(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },


    getStatusHistory: async function (data) {
        return new Promise(function(resolve, reject) {
            ManageRating.getStatusHistory(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

}