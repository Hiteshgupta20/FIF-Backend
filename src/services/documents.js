const Promise = require('promise');
const Documents = require('../models/documents');
const util = require('../controllers/util');
const logger = require('../config/logging');
const PointManagement = require('../services/pointManagement');
const notification = require('../services/notification');
const custService = require('../services/customerProfile');
const _ = require('lodash');

module.exports = {

    addDocument: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.code = payload.code;
            data.title = payload.title;
            data.modules = JSON.stringify(payload.modules);
            data.mandatoryfor = JSON.stringify(payload.mandatoryfor);
            data.description = payload.description;
            data.insertdate = date;
            data.insertby = payload.insertby;
            data.modifydate = null;
            data.modifyby = null;

            if (payload.modules && payload.mandatoryfor) {
                let isValid = true;
                for (let i = 0; i < payload.mandatoryfor.length; i++) {
                    if (payload.modules.indexOf(payload.mandatoryfor[i]) == -1) {
                        isValid = false;
                    }
                }
                if (isValid) {
                    Documents.addDocument(data)
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                }
                else {
                    reject(new Error("Please enter valid data for 'Mandatory for' field"));
                }
            }
        });
    },
    addCustomerDocumentDetails: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            let dob = payload.birthDate || null;
            if (dob && dob.indexOf("/") > 0) {
                let d = dob.split("/");
                if (d[0].length == 2) {
                    dob = d[2] + "-" + d[1] + "-" + d[0];
                }
                else {
                    dob = d[0] + "-" + d[1] + "-" + d[2];
                }
            }
            data.custid = payload.loginId;
            data.idcode = payload.docCode;
            data.idsubcode = payload.docSubCode || "0";
            data.idno = payload.docNo || "";
            data.idname = payload.name || "";
            data.birthplace = payload.birthPlace || "";
            data.birthdate = dob;
            data.gender = payload.gender || "";

            data.ktpaddress = payload.ktpaddress || "";
            data.ktpsubdistrict = payload.ktpsubdistrict || "";
            data.ktpvillage = payload.ktpvillage || "";
            data.ktpcity = payload.ktpcity || "";
            data.ktpprovince = payload.ktpprovince || "";
            data.ktpneighbourhood = payload.ktpneighbourhood || "";
            data.ktphamlet = payload.ktphamlet || "";
            data.ktpzipcode = payload.ktpzipcode || "";

            data.stayaddress = payload.stayaddress || "";
            data.staysubdistrict = payload.staysubdistrict || "";
            data.stayvillage = payload.stayvillage || "";
            data.staycity = payload.staycity || "";
            data.stayprovince = payload.stayprovince || "";
            data.stayneighbourhood = payload.stayneighbourhood || "";
            data.stayhamlet = payload.stayhamlet || "";
            data.stayzipcode = payload.stayzipcode || "";

            data.billingaddress = payload.billingaddress || "";
            data.billingsubdistrict = payload.billingsubdistrict || "";
            data.billingvillage = payload.billingvillage || "";
            data.billingcity = payload.billingcity || "";
            data.billingprovince = payload.billingprovince || "";
            data.billingneighbourhood = payload.billingneighbourhood || "";
            data.billinghamlet = payload.billinghamlet || "";
            data.billingzipcode = payload.billingzipcode || "";

            data.idpath = payload.path || "";

            Documents.addCustomerDocumentDetails(data)
                .then(async function (result) {
                    let allUploaded = await checkIfAllDocumentsUploaded(payload);
                    if (allUploaded) {
                        let userPoints = await addActivityPoints(payload);
                        if (userPoints) {
                            result.pointsAdded = userPoints;
                        }
                    }
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateDocument: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.title = payload.title;
            data.modules = JSON.stringify(payload.modules);
            data.mandatoryfor = JSON.stringify(payload.mandatoryfor);
            data.description = payload.description;
            data.modifydate = date;
            data.modifyby = payload.modifyby;
            data.code = payload.code;

            if (payload.modules && payload.mandatoryfor) {
                let isValid = true;
                for (let i = 0; i < payload.mandatoryfor.length; i++) {
                    if (payload.modules.indexOf(payload.mandatoryfor[i]) == -1) {
                        isValid = false;
                    }
                }
                if (isValid) {
                    Documents.updateDocument(data)
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                }
                else {
                    reject(new Error("Please enter valid data for 'Mandatory for' field"));
                }
            }
        });
    },
    updateCustomerDocumentDetails: async function (payload) {
        return new Promise(function (resolve, reject) {


            let data = {};
            let dob = payload.birthDate || null;
            if (dob && dob.indexOf("/") > 0) {
                let d = dob.split("/");
                if (d[0].length == 2) {
                    dob = d[2] + "-" + d[1] + "-" + d[0];
                }
                else {
                    dob = d[0] + "-" + d[1] + "-" + d[2];
                }
            }
            data.custid = payload.loginId;
            data.idcode = payload.docCode;
            data.idsubcode = payload.docSubCode || "0";
            data.idno = payload.docNo || "";
            data.idname = payload.name || "";
            data.birthplace = payload.birthPlace || "";
            data.birthdate = dob;
            data.gender = payload.gender || "";

            data.ktpaddress = payload.ktpaddress || "";
            data.ktpsubdistrict = payload.ktpsubdistrict || "";
            data.ktpvillage = payload.ktpvillage || "";
            data.ktpcity = payload.ktpcity || "";
            data.ktpprovince = payload.ktpprovince || "";
            data.ktpneighbourhood = payload.ktpneighbourhood || "";
            data.ktphamlet = payload.ktphamlet || "";
            data.ktpzipcode = payload.ktpzipcode || "";

            data.stayaddress = payload.stayaddress || "";
            data.staysubdistrict = payload.staysubdistrict || "";
            data.stayvillage = payload.stayvillage || "";
            data.staycity = payload.staycity || "";
            data.stayprovince = payload.stayprovince || "";
            data.stayneighbourhood = payload.stayneighbourhood || "";
            data.stayhamlet = payload.stayhamlet || "";
            data.stayzipcode = payload.stayzipcode || "";

            data.billingaddress = payload.billingaddress || "";
            data.billingsubdistrict = payload.billingsubdistrict || "";
            data.billingvillage = payload.billingvillage || "";
            data.billingcity = payload.billingcity || "";
            data.billingprovince = payload.billingprovince || "";
            data.billingneighbourhood = payload.billingneighbourhood || "";
            data.billinghamlet = payload.billinghamlet || "";
            data.billingzipcode = payload.billingzipcode || "";

            data.idpath = payload.path || "";

            Documents.updateCustomerDocumentDetails(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getDocumentList: async function () {
        return new Promise(function (resolve, reject) {

            Documents.getDocumentList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getCustomerDocument: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {
                loginId: payload.loginId,
                docCode: payload.docCode,
                docSubCode: payload.docSubCode
            }
            Documents.getCustomerDocumentDetails(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getAllCustomerDocuments: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
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
            data.orderByClause = util.formatOrderByClause(payload, 'l.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.custName) {
                    whereClause.push(`l.name ILIKE '%${searchParams.custName}%'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                Documents.getAllCustomerDocuments(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Documents.getAllExportCustomerDocuments(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },
    getAllCustomerDocumentsCount: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
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
            data.orderByClause = util.formatOrderByClause(payload, 'l.');
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.custName) {
                    whereClause.push(`l.name ILIKE '%${searchParams.custName}%'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            Documents.getTotalCount(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });

        });
    },
    getCustomerDocuments: async function (payload) {
        return new Promise(function (resolve, reject) {

            Documents.getCustomerDocuments(payload)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getCustomerDocInfo: async function (payload) {
        return new Promise(function (resolve, reject) {

            Documents.getCustomerDocInfo(payload)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getSourceList: async function () {
        return new Promise(function (resolve, reject) {

            Documents.getSourceList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    deleteDocument: async function (code) {
        return new Promise(function (resolve, reject) {

            Documents.deleteDocument(code)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    completeDocumentsReminder: async function () {
        return new Promise(async function (resolve, reject) {
            try {
                let getPointsData = {
                    activityappid: 'COMPLETE DOCUMENTS'
                }
                let points = await PointManagement.getPointsForActivity(getPointsData);

                if (points && points > 0) {
                    let payload = {
                        isExport: 1
                    }
                    let fmcUsers = await custService.listCustomerProfiles(payload);
                    let usersIn = [];
                    if (fmcUsers.data) {
                        usersIn = fmcUsers.data;
                    }
                    const chunks = _.chunk(usersIn, 50000);
                    logger.info(chunks.length);
                    try {
                        for (let i = 0; i < chunks.length; i++) {
                            logger.info(i);
                            logger.info(chunks[i].length);
                            let userArr = chunks[i];

                            for (let j = 0; j < userArr.length; j++) {
                                let currentDate = new Date(util.getTimestamp());
                                let userNot = userArr[j];
                                if (!userNot.isdocumentuploaded) {
                                    logger.info(userNot);
                                    logger.info("\n\n sending complete documents reminder .. \n\n");
                                    let notificationData = {
                                        type: 'COMPLETE_DOCUMENTS_REMINDER',
                                        points: points,
                                        refid: new Date().getTime()
                                    }
                                    await notification.sendNotification(notificationData, userNot, false, true, false);

                                }
                            }
                        }
                    }
                    catch (err) {
                        logger.info('Error' + err);
                    }
                }
                resolve(true);
            }
            catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    }
};

async function checkIfAllDocumentsUploaded(data) {
    let allUploaded = true;
    let allDocumentsList = await Documents.getDocumentList();
    let customerDocumentsList = await Documents.getCustomerDocuments(data);
    for (let i = 0; i < allDocumentsList.length; i++) {
        allDocumentsList[i].isuploaded = false;
    }
    for (let i = 0; i < allDocumentsList.length; i++) {
        let ssCount = 0;
        for (let j = 0; j < customerDocumentsList.length; j++) {
            if (allDocumentsList[i].code == customerDocumentsList[j].code) {
                if (allDocumentsList[i].code != '004') {
                    allDocumentsList[i].isuploaded = true;
                }
                else if (allDocumentsList[i].code == '004') {
                    ssCount++;
                    if (ssCount == 3) {
                        allDocumentsList[i].isuploaded = true;
                    }
                }
            }
        }
    }

    allDocumentsList.forEach(function (record) {
        if (!record.isuploaded) {
            allUploaded = false;
        }
    })
    return (allUploaded);
}

async function addActivityPoints(data) {

    return new Promise(async function (resolve, reject) {
        let pointsData = {
            loginid: data.loginId,
            activityappid: 'COMPLETE DOCUMENTS',
            description: 'All Documents uploaded'
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
