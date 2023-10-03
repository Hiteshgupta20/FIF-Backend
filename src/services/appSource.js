const promise = require('promise');
const appSource = require('../models/appSource');
const util = require('../controllers/util');
const logger = require('../config/logging');


module.exports = {

    addAppSource: async function(payload) {
        return new Promise(function(resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.name = payload.name;
            data.status = payload.status || 1;
            data.insertDate = payload.insertDate || date;
            data.insertBy = payload.insertBy || 153;
            data.lastModifyDate = data.insertDate;
            data.lastModifyBy = data.insertBy;

            let tempData = { "name": payload.name };
            appSource.checkAppNameUnique(tempData)
                .then(function(resultCount) {
                    logger.debug(resultCount);
                    if (resultCount > 0) {
                        reject({ "message": "App source already exists." })
                    } else {
                        appSource.addAppSource(data)
                            .then(function(result) {
                                resolve(result);
                            })
                            .catch(function(err) {
                                reject(err);
                            });
                    }
                }).catch(function(err) {
                    reject(error);
                });
        });
    },
    updateAppSource: async function(payload) {
        return new Promise(function(resolve, reject) {


            let data = {};
            let date = util.getTimestamp();
            data.name = payload.name;
            data.status = payload.status || 1;
            data.lastModifyDate = data.insertDate;
            data.lastModifyBy = data.insertBy;
            data.id = payload.id;

            let tempData = { "name": payload.name, "id": payload.id };
            appSource.checkAppNameUnique(tempData)
                .then(function(resultCount) {
                    logger.debug(resultCount);
                    if (resultCount > 0) {
                        reject({ "message": "App source already exists." })
                    } else {
                        appSource.updateAppSource(data)
                            .then(function(result) {
                                resolve(result);
                            })
                            .catch(function(err) {
                                reject(err);
                            });
                    }
                });
        });
    },
    getAppSourceList: async function(payload) {
        return new Promise(function(resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            let isExport = payload.isExport || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    console.log(searchParams.name);
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (isExport == 0) {
                appSource.getAppSourceList(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
            else {
                appSource.getAllAppSourceList(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }

        });
    },
    deleteAppSource: async function(id) {
        return new Promise(function(resolve, reject) {

            appSource.deleteAppSource(id)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }
};