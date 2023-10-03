const Promise = require('promise');
const utils = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');
const request = require('request');
const CreditApplication = require('../models/creditApplication');
const crmAuthService = require('../services/crmAuth');
const UserModel = require('../models/user');
const NotificationService = require('../services/notification');
const FCMNotificationService = require('../services/fcmPushNotification');
const PointManagement = require('../services/pointManagement');

module.exports =  {
    applyCredit: async function(reqData, headersData){
        return new Promise(function(resolve,reject){
            try {
                request.post({
                        headers: headersData,
                        url: appConstants.creditApplicationBaseUrl+'wishlist/data/add',
                        json: reqData
                    },
                    function(err, httpResponse, body) {
                        //
                        if (!err) {
                            // body = JSON.parse(body);
                            logger.info('Wishlist Data Add API response:');
                            logger.info(body);
                            let res = body;
                            if(res.success == true){
                                resolve(res);
                            } else {
                                let errObj = {
                                    'error': 'API failed! Please check your input.'
                                }
                                reject(errObj)
                            }
                        } else {
                            let errObj = {
                                'error': 'API failed! Please check your input.'
                            }
                            reject(errObj)
                        }
                    });
            }
            catch(err){
                reject(new Error('Error in wishlist add API'));
            }

        });
    },
    uploadCreditApplicationDocuments: async function(reqData, insertReqData, headersData){
        return new Promise(function(resolve,reject){

            try {
                request.post({
                        headers: headersData,
                        url: appConstants.creditApplicationBaseUrl+'wishlist/files/upload',
                        formData: reqData
                    },
                    async function(err, httpResponse, body) {
                        if (!err) {
                            try {
                                // body = JSON.parse(body);
                                logger.info('Wishlist Upload API successful');
                                logger.info(body);
                                let res = JSON.parse(body);
                                if(res.status == "OK"){
                                    let customerApplicationData = {
                                        status : 3,
                                        insertdate : utils.getTimestamp(),
                                        insertby : insertReqData.loginId,
                                        userid : insertReqData.loginId,
                                        refno : insertReqData.refNo
                                    }
                                    await CreditApplication.addCreditApplicationData(customerApplicationData);
                                    await sendNotification(insertReqData, "submitted");
                                    resolve(res);
                                } else {
                                    if (res.errors && res.errors.indexOf('max file') != -1){
                                        logger.error('Wishlist Upload API Failure:'+res);
                                        // let errObj = {
                                        //     'error': 'Upload failed! Please check your input.'
                                        // }
                                        reject(new Error('Mohon perbaharui/unggah ulang semua document anda.'));
                                    }
                                    else {
                                        logger.error('Wishlist Upload API Failure:'+res);
                                        let errObj = {
                                            'error': 'Upload failed! Please check your input.'
                                        }
                                        reject(errObj)
                                    }
                                }
                            }
                            catch(error) {
                                logger.error('Wishlist Upload API Failure:');
                                // let errObj = {
                                //     'error': 'Upload failed! Please check your input.'
                                // }
                                reject(new Error('Upload failed! Please check your input.'));
                            }
                        } else {
                            logger.error('Wishlist Upload API Failure:'+err);
                            let errObj = {
                                'error': 'Upload failed! Error from wishlist API: '+err
                            }
                            reject(errObj)
                        }
                    });
            }
            catch(err){
                logger.error('Wishlist Upload API Failure:'+err);
                reject(new Error('Error in wishlist upload API'));
            }
        });
    },

    creditApplicationStatusScheduler: async function (payload) {
    return new Promise(async function(resolve, reject) {
        
        try{
            // get data filtered by status = 1 (requested);
            logger.info("Credit Application scheduler running ...");
            let creditApplicationRequests = await CreditApplication.getCreditApplicationRequests();

            // Iterate through record and call member info crm api
            let loginData = await crmAuthService.getCRMAuthToken();
            let authToken = loginData.accessToken;
            // logger.info("Credit Applications in pending status : ",creditApplicationRequests);

            let applicationStatusData = await getCreditAppStatusData(authToken);
            let creditAppRecords = applicationStatusData['data'];
            console.log(creditAppRecords);
            creditAppRecords.forEach(async function (record) {
                let statusCode = "3";
                let status = record.status || "";
                status = status.toLowerCase();
                if (status == "approved" || status == "approve"){
                    statusCode = "2";
                }
                else if (status == "rejected" || status == "reject" || status == "cancel" || status == "canceled") {
                    statusCode = "0";
                }
                else if (status == "in progress") {
                    statusCode = "1";
                }
                let updateData = {
                    refNo: record.reffNo,
                    groupId: record.groupId,
                    status : statusCode,
                    userId: "",
                    itemType: record.object,
                    category: record.category
                }
                for (let i =0; i < creditApplicationRequests.length; i++){
                    if (creditApplicationRequests[i].refno == updateData.refNo && creditApplicationRequests[i].status != updateData.status){
                        updateData.userId = creditApplicationRequests[i].userid;
                        await CreditApplication.updateCreditApplicationData(updateData);
                        await sendNotification(updateData, status);
                        if (updateData.status == "2") {
                            let pointsData = {
                                loginid: updateData.userId,
                                activityappid: 'CREDIT APP APPROVAL',
                                description: 'Credit Application Approved'
                            }
                            await PointManagement.addPointsForActivity(pointsData);
                        }
                    }
                }
            })
            resolve(true);
            //on success update status to approved/rejected
        }
        catch(err){
            reject(false);
        }
    });
},

    findCreditApplicationByReferenceNo: async function(data) {
        return new Promise(function(resolve, reject) {
            
            CreditApplication.getCreditApplicationRequestByRefNo(data)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }
}

function getCreditAppStatusData(token){
    return new Promise(function(resolve,reject){
        try {
            var options = {
                url: appConstants.creditApplicationBaseUrl+'wishlist/notification',
                headers: {
                    "Authorization": "bearer " + token,
                    "Content-Type": "application/json"
                }
            };
            request(options, function (error, response, body) {
                if (error){
                    reject(error);
                }
                if (body){
                    resolve(JSON.parse(body));
                }
                else {
                    reject(new Error("Error in Wishlist Notification API"));
                }

            });
        }
        catch(err){
            reject(new Error("Error in Wishlist Notification API"));
        }
    });
}

async function sendNotification(updateData, status){

    let data= {
        type: "",
        itemType: updateData.itemType,
        category: updateData.category
    }
    if (status == "submitted"){
        data.type = "CREDIT_APPLICATION_SUBMITTED";
    }
    else if (status == "in progress"){
        data.type = "CREDIT_APPLICATION_PROCESSED";
    }
    else if (status == "approved") {
        data.type = "CREDIT_APPLICATION_APPROVED";
    }
    else if (status == "rejected") {
        data.type = "CREDIT_APPLICATION_REJECTED";
    }
    else if (status == "canceled") {
        data.type = "CREDIT_APPLICATION_CANCELED";
    }
    data.refid = new Date().getTime();
    NotificationService.sendNotification(data,{loginid : updateData.userId},false,true,false);
}

function getNotificationDetail(userId, status, refNo) {
    return {
        loginid : userId,
        title : "Credit Application",
        desc : "Your application with reference no. "+refNo+" has been "+status,
        type : "CREDIT_APPLICATION"
    };
}