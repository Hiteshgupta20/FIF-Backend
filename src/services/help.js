const Promise = require('promise');
const help = require('../models/help');
const util = require('../controllers/util');
const logger = require('../config/logging');
const activityLogs = require('../services/activityLogs');

module.exports = {

    getHelpContentTypeList: async function () {
        return new Promise(function(resolve, reject) {
            
            help.getHelpContentTypeList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getFaqCategoryList: async function () {
        return new Promise(function(resolve, reject) {
            
            help.getFaqCategoryList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    addContent: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.type = payload.type;
            data.faqcategory = payload.faqcategory;
            data.title = payload.title;
            data.description = payload.description;
            data.children = JSON.stringify(payload.children);
            // data.navtext = payload.btntext;
            data.insertdate = date;
            data.insertby = payload.insertby;
            data.lastmodifydate = null;
            data.lastmodifyby = null;

            help.addHelpContent(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateContent : async function (payload) {
        return new Promise(function(resolve, reject) {
            

            let data = {};
            let date = util.getTimestamp();
            data.type = payload.type;
            data.title = payload.title;
            data.faqcategory = payload.faqcategory;
            data.description = payload.description;
            data.children = JSON.stringify(payload.children);
            // data.navtext = payload.btntext;
            data.lastmodifydate = date;
            data.lastmodifyby = payload.modifyby;
            data.id = payload.id;

            help.updateHelpContent(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    deleteContent: async function (id) {
        return new Promise(function(resolve, reject) {
            
            help.deleteHelpContent(id)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    listContent: async function(payload){
        return new Promise(async function(resolve, reject) {
            let data = {};
            let loginId = payload.loginId || 0;
            data.isExport = payload.isExport || 0;
            data.orderByClause = util.formatOrderByClause(payload);

            if (data.isExport == 0) {
                data.limit = payload.limit || 10;
                data.offset = (payload.page - 1)* payload.limit || 0;
                if(data.offset <0){
                    data.offset = 0;
                }

                let whereClause = [];
                let searchParams = payload.searchParams;
                if (searchParams) {
                    if (searchParams.type) {
                        whereClause.push(`type = '${searchParams.type}'`)
                    }
                    if (searchParams.faqcategory) {
                        whereClause.push(`faqcategory = '${searchParams.faqcategory}'`)
                    }
                }
                whereClause = whereClause.join(" and ");
                if(whereClause.length > 0){
                    whereClause = "where "+ whereClause;
                }
                data.whereClause = whereClause;
            }

            if (loginId) {
                let activityData = util.prepareActivityLogsData(loginId, 'Viewed Help Section', 'Viewed Help Section');
                await activityLogs.createActivityLog(activityData);
            }

            if (data.isExport == 0) {
                help.getHelpContentList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                help.getAllHelpContentList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    }
};
