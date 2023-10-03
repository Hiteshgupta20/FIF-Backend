const Promise = require('promise');
const Complaint = require('../models/complaint');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const notification = require('../services/notification');
const UserModel = require('../models/user');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');
const PointManagement = require('../services/pointManagement');

module.exports = {

    //Complaint set up
    createComplaint: async function (payload) {
        return new Promise(function (resolve, reject) {

            let date = util.getTimestamp();
            let data = {
                name: payload.name || "",
                description: payload.description || "",
                email: payload.email || "",
                msisdn: payload.msisdn || "",
                category: payload.category || "",
                status: payload.status || "1",
                remarks: payload.remarks || "",
                insertdate: date,
                insertby: payload.insertby || payload.insertBy || null,
                lastmodifyby: payload.insertby || payload.insertBy || null,
                lastmodifydate: date
            };
            Complaint.createComplaint(data)
                .then(async function (result) {
                    let previousComplaint = await Complaint.findComplaintByUserId(data.insertby);

                    if (previousComplaint && previousComplaint.length && previousComplaint.length == 1) {
                        let userPoints = await addActivityPoints(data);
                        if (userPoints) {
                            result.pointsAdded = userPoints;
                        }
                    }

                    createActivityLog(result);
                    sendCOMPLAINTNotification(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateComplaint: async function (payload) {
        return new Promise(function (resolve, reject) {

            let date = util.getTimestamp();
            let data = {
                name: payload.name || "",
                description: payload.description || "",
                email: payload.email || "",
                msisdn: payload.msisdn || "",
                category: payload.category || "",
                status: payload.status || "",
                remarks: payload.remarks || "",
                insertdate: date,
                insertby: payload.insertby || null,
                lastmodifyby: payload.insertby || null,
                lastmodifydate: date,
                id: payload.id
            };

            Complaint.updateComplaint(data)
                .then(function (result) {
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateComplaintStatus: async function (payload) {
        return new Promise(function (resolve, reject) {

            let date = util.getTimestamp();
            let data = {
                status: payload.status || "",
                remarks: payload.remarks || "",
                lastmodifyby: payload.modifyBy || null,
                lastmodifydate: date,
                id: payload.complaintId
            };

            Complaint.updateComplaintStatus(data)
                .then(function (result) {
                    sendCOMPLAINTNotification(result);
                    createActivityLog(result);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findComplaint: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            if (payload.offset) {
                data.offset = payload.offset;
            }
            else {
                data.offset = (payload.page - 1) * payload.limit || 0;
            }

            data.isExport = payload.isExport || 0;

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
                if (searchParams.category) {
                    console.log(searchParams.category);
                    whereClause.push(`category ILIKE '%${searchParams.category}%'`)
                }
                if (searchParams.status) {
                    console.log(searchParams.status);
                    whereClause.push(`status ILIKE '%${searchParams.status}%'`)
                }
                if (searchParams.email) {
                    console.log(searchParams.email);
                    whereClause.push(`email ILIKE '%${searchParams.email}%'`)
                }
                if (searchParams.date && searchParams.date.from && searchParams.date.to) {
                    console.log(searchParams.date);
                    whereClause.push(`date_trunc('day',insertdate) between to_date('${searchParams.date.from}','DD-MM-YYYY') and to_date('${searchParams.date.to}','DD-MM-YYYY')`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                Complaint.findComplaint(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Complaint.findAllComplaints(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },

    findComplaintCount: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.isExport = payload.isExport || 0;

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
                if (searchParams.category) {
                    console.log(searchParams.category);
                    whereClause.push(`category ILIKE '%${searchParams.category}%'`)
                }
                if (searchParams.status) {
                    console.log(searchParams.status);
                    whereClause.push(`status ILIKE '%${searchParams.status}%'`)
                }
                if (searchParams.email) {
                    console.log(searchParams.email);
                    whereClause.push(`email ILIKE '%${searchParams.email}%'`)
                }
                if (searchParams.date && searchParams.date.from && searchParams.date.to) {
                    console.log(searchParams.date);
                    whereClause.push(`date_trunc('day',insertdate) between to_date('${searchParams.date.from}','DD-MM-YYYY') and to_date('${searchParams.date.to}','DD-MM-YYYY')`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            Complaint.getComplaintCount(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });

        });
    },

    deleteComplaint: async function (complaintId) {
        return new Promise(function (resolve, reject) {

            Complaint.deleteComplaint(complaintId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findComplaintById: async function (complaintId) {
        return new Promise(function (resolve, reject) {

            Complaint.findComplaintById(complaintId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findComplaintsByUserId: async function (userId) {
        return new Promise(function (resolve, reject) {

            Complaint.findComplaintByUserId(userId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getStatusList: async function () {
        return new Promise(function (resolve, reject) {
            Complaint.getStatusList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    statusHistory: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {
                activitymodule: payload.complaintId,
                activitytype: "complaint"
            }
            ActivityLogService.findActivityLogs(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    // getComplaintHistory: async function (payload) {
    //     return new Promise(function (resolve, reject) {
    //         let data = {
    //             complaintName: payload.complaintName
    //         };

    //         Complaint.getComplaintHistory(data)
    //             .then(function (result) {
    //                 resolve(result);
    //             }).catch(function (err) {
    //                 reject(err);
    //             });
    //     });
    // },
};

async function addActivityPoints(data) {
    return new Promise(async function (resolve, reject) {
        let pointsData = {
            loginid: data.insertby,
            activityappid: 'COMPLAINT',
            description: 'Complaint'
        }
        try {
            let toAddPoints = await PointManagement.addPointsForActivity(pointsData);
            let pointsAdded = 0;
            if (toAddPoints.currentPoints) {
                pointsAdded = toAddPoints.currentPoints;
            }
            resolve(pointsAdded);
        } catch (err) {
            logger.error(err);
        }
    });
}


async function createActivityLog(record) {
    let data = {};
    let status = record.status;
    try {
        status = await getStatusName({ statusid: status, module: 'SM_CMP' });
        data.loginid = record.lastmodifyby;
        data.activitydesc = status;
        data.activitytype = 'Complaint registered';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
        ActivityLogService.createActivityLog(data);
    } catch (err) {
        logger.error(err);
    }
}

function getStatusName(payload) {
    return new Promise(function (resolve, reject) {

        let data = {};
        let whereClause = []
        let searchParams = payload;
        if (searchParams) {
            if (searchParams.statusid) {
                console.log(searchParams.statusid);
                whereClause.push(`status_id = '${searchParams.statusid}'`)
            }
            if (searchParams.module) {
                console.log(searchParams.module);
                whereClause.push(`module = '${searchParams.module}'`)
            }
        }
        whereClause = whereClause.join(" and ");
        if (whereClause.length > 0) {
            whereClause = "where " + whereClause;
        }
        data.whereClause = whereClause;
        StatusMaster.getStatusName(data)
            .then(function (result) {
                resolve(result);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function sendCOMPLAINTNotification(data) {
    if (data.status == 1) {
        data.type = "COMPLAINT_SUBMITTED";
    }
    if (data.status == 2) {
        data.type = "COMPLAINT_IN_PROGRESS";
    }
    if (data.status == 3) {
        data.type = "COMPLAINT_COMPLETED";
    }
    if (data.status == 4) {
        data.type = "COMPLAINT_CANCELLED";
    }
    notification.sendNotification(data, { loginid: data.insertby }, false, true, false);
}
