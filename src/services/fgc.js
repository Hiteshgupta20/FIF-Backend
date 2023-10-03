const Promise = require('promise');
const FGC = require('../models/fgc');
const keyValue = require('../models/keyValue');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports = {

    getFGCContentTypeList: async function () {
        return new Promise(function(resolve, reject) {
            
            FGC.getFGCContentTypeList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getFGCSetting: async function () {
        return new Promise(function(resolve, reject) {
            
            let data = {
                id : "FGC",
                type : "FGC_SETTING"
            }
            keyValue.getKeyValue(data)
                .then(function (results) {
                    if(results.length  == 0){
                        results.push({
                            "id": "FGC",
                            "type": "FGC_SETTING",
                            "key": "ALLOW_CHECK_BALANCE",
                            "value": "false"
                        })
                    }
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateFGCSetting: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {
                id : "FGC",
                type : "FGC_SETTING",
                key  : "ALLOW_CHECK_BALANCE",
                value : payload.isCheckBalanceAllowed+""
            }
            keyValue.addKeyValue(data)
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
            data.type = payload.contenttype;
            data.title = payload.contenttitle;
            data.description = payload.contentdescription;
            data.images = payload.contentimages;
            data.insertdate = date;
            data.insertby = payload.insertby;
            data.lastmodifydate = null;
            data.lastmodifyby = null;

            FGC.addContent(data)
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
            data.type = payload.contenttype;
            data.title = payload.contenttitle;
            data.description = payload.contentdescription;
            data.images = payload.contentimages;
            data.lastmodifydate = date;
            data.lastmodifyby = payload.modifyby;
            data.id = payload.id;

            FGC.updateContent(data)
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
            
            FGC.deleteContent(id)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    listContent: async function(payload){
        return new Promise(function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            data.isExport = payload.isExport || 0;

            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload, 'd.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.type) {
                    whereClause.push(`d.type = '${searchParams.type}'`)
                }
                if (searchParams.title) {
                    whereClause.push(`d.title ilike '%${searchParams.title}%'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                FGC.getContentList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                FGC.getAllContentList(data)
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
