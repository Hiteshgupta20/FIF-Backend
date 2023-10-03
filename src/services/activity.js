const promise = require('promise');
const activity = require('../models/activity');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports = {

    addActivity: async function(payload) {
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
            activity.checkActivityUnique(tempData)
                .then(function(resultCount) {
                    logger.debug(resultCount);
                    if (resultCount > 0) {
                        reject({ "message": "Activity already exists." })
                    } else {
                        activity.addActivity(data)
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
    updateActivity: async function(payload) {
        return new Promise(function(resolve, reject) {
            

            let data = {};
            let date = util.getTimestamp();
            data.name = payload.name;
            data.status = payload.status || 1;
            data.insertDate = payload.insertDate || date;
            data.insertBy = payload.modifyBy || 153;
            data.lastModifyDate = data.insertDate;
            data.lastModifyBy = data.insertBy;
            data.id = payload.id;

            let tempData = { "name": payload.name, "id": payload.id };
            activity.checkActivityUnique(tempData)
                .then(function(resultCount) {
                    logger.debug(resultCount);
                    if (resultCount > 0) {
                        reject({ "message": "Activity already exists." })
                    } else {
                        activity.updateActivity(data)
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
    updateNotificationFlag: async function(payload) {
        return new Promise(function(resolve, reject) {
            

            let data = {};
            let date = util.getTimestamp();
            data.lastModifyDate = date;
            data.notificationFlag = payload.notificationFlag;
            data.lastModifyBy = data.modifyBy;
            data.id = payload.id;

            activity.updateNotificationFlag(data)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },
    getActivityList: async function(payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            let date = util.getTimestamp();
            data.isExport = payload.isExport || 0;
            data.orderByClause = util.formatOrderByClause(payload);
                data.limit = payload.limit || 10;
                data.offset = (payload.page - 1) * payload.limit || 0;

                if (data.offset < 0) {
                    data.offset = 0;
                }

                let whereClause = []
                let searchParams = payload.searchParams;
                if (searchParams) {
                    if (searchParams.name) {
                        console.log(searchParams.name);
                        whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                    }
                    if (searchParams.moduletype) {
                        whereClause.push(`modules @> '["${searchParams.moduletype}"]'`)
                        data.limit = 100;
                    }
                }
                whereClause = whereClause.join(" and ");
                if (whereClause.length > 0) {
                    whereClause = "where " + whereClause;
                }
                data.whereClause = whereClause;

                if (data.isExport == 0) {
                    activity.getActivityList(data)
                        .then(function(result) {
                            resolve(result);
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                }
                else {
                    activity.getAllActivityList(data)
                        .then(function(result) {
                            resolve(result);
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                }

        });
    },
    getActivityByName: async function(ActivityName) {
        return new Promise(function(resolve, reject) {

            activity.getActivityByName(ActivityName)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },

    deleteActivity: async function(id) {
        return new Promise(function(resolve, reject) {
            
            activity.deleteActivity(id)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }
};