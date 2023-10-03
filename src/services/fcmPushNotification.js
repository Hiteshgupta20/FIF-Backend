var FCM = require('fcm-push');
const logger = require('../config/logging');
const _ = require('lodash');
const appConstants = require('../config/appConstants');
const Notification = require("../models/notification");

exports.pushFCMNotification = function (notification, users) {
    let newArr = [];
    return new Promise(function (resolve, reject) {
        try {
            let userFcmTokens = getUserFcmToken(users);
            if (userFcmTokens.length > 0) {
                notification = {
                    title: notification.title || "",
                    desc: notification.desc || "",
                    icon: notification.icon || "",
                    type: notification.type || "",
                    refid: notification.refid || "",
                    imageurl: notification.imageurl || "",
                    insertDate: notification.insertdate,
                    expiryDate: notification.expirydate
                }

                const serverKey = appConstants.fcmServerKey;
                var fcm = new FCM(serverKey);

                var message = {
                    priority: 'high',
                    contentAvailable: true,
                    delayWhileIdle: true,
                    timeToLive: 0,
                    data: {
                        title: notification.title,
                        desc: notification.desc,
                        icon: notification.icon,
                        type: notification.type,
                        refid: notification.refid,
                        imageurl: notification.imageurl,
                        insertDate: notification.insertDate
                    },
                    notification: {
                        title: notification.title,
                        desc: notification.desc,
                        icon: notification.icon,
                        type: notification.type,
                        refid: notification.refid,
                        imageurl: notification.imageurl,
                        insertDate: notification.insertDate
                    }
                };

                const chunks = _.chunk(userFcmTokens, 500);

                let offset = 0;

                _.map(chunks, (e) => {
                    for (let i = 0; i < e.length; i++) {
                        if (newArr.indexOf(e[i]) == -1) {
                            let arr = [];
                            arr.push(e[i]);
                            newArr.push(e[i]);
                            message.to = e[i];
                            fcm.send(message)
                                .then(function (response) {
                                    logger.info("Notification Success");
                                    logger.info("Message Id for " + e[i] + ":" + JSON.stringify(response));
                                    resolve(response);
                                })
                                .catch(function (err) {
                                    logger.info('Notification Error: Testing');
                                    logger.error(err);
                                    resolve("error in push notification for " + e[i]);
                                    resolve(err)
                                })
                        }
                    }
                });
            }
            else {
                resolve();
            }

        } catch (err) {
            logger.error("Error occurred while pushing notification : ", err);
            resolve("error in push notification.");
        }
    });
}

exports.pushFCMBulkNotification = function (notification, users, excelData) {
    let newArr = [];
    return new Promise(async function (resolve, reject) {
        try {
            let userFcmTokens = getUserFcmToken(users);
            if (userFcmTokens.length > 0) {
                await pushChunkData(notification, users, excelData, userFcmTokens).then(async function () {
                    let data = {}
                    let expiryDate = new Date()
                    expiryDate.setDate(expiryDate.getDate() + 10);
                    data.title = notification.title || "";
                    data.desc = notification.message || ""
                    data.type = "EXCEL FILE NOTIFICATION";
                    data.imageurl = notification.imageurl || ""
                    data.refid = notification.fileid || "";
                    data.insertdate = notification.insertdate || "";
                    data.icon = notification.icon || ""
                    data.expiryDate = expiryDate || ""
                    users.forEach(async function (user) {
                        await Notification.createNotifications(data, user).then(async () => {
                            await Notification.getStatusCount(notification.fileid).then(async (response) => {
                                await Notification.updateExcelFilesStatus(excelData, response)
                            })
                        })
                    })

                })
                resolve(true)
            } else {
                resolve();
            }
        } catch (err) {
            logger.error("Error occurred while pushing notification : ", err);
            resolve("error in push notification.");
        }
        // await Notification.updateExcelFileStatus(excelData);
    });
}

async function pushChunkData(notification, users, excelData, userFcmTokens) {
    let newArr = [];
    let data1 = {}
    let flag = false;
    return new Promise(async function (resolve, reject) {

        notification = {
            fileid: notification.fileid || "",
            title: notification.title || "",
            desc: notification.message || "",
            icon: notification.icon || "",
            type: notification.type || "",
            refid: notification.refid || "",
            imageurl: notification.imageurl || "",
            insertDate: notification.insertdate,
            scheduleDate: notification.scheduledate
        }

        const serverKey = appConstants.fcmServerKey;
        var fcm = new FCM(serverKey);

        var message = {
            priority: 'high',
            contentAvailable: true,
            delayWhileIdle: true,
            timeToLive: 0,
            data: {
                title: notification.title,
                desc: notification.message,
                icon: notification.icon,
                type: notification.type,
                refid: notification.refid,
                imageurl: notification.imageurl,
                insertDate: notification.insertDate
            },
            notification: {
                fileid: notification.fileid,
                title: notification.title,
                desc: notification.message,
                icon: notification.icon,
                type: notification.type,
                refid: notification.refid,
                imageurl: notification.imageurl,
                insertDate: notification.insertDate
            }
        };

        const chunks = _.chunk(userFcmTokens, 500);

        let offset = 0;
        _.map(chunks, (e) => {
            // let j = 0;
            for (let i = 0; i < e.length; i++) {
                if (newArr.indexOf(e[i]) == -1) {
                    let arr = [];
                    arr.push(e[i]);
                    newArr.push(e[i]);
                    message.to = e[i];
                    fcm.send(message)
                        .then(function (response) {
                            logger.info("Notification Success");
                            logger.info("Message Id for " + e[i] + ":" + JSON.stringify(response));
                        })
                        .catch(async function (err) {
                            logger.info('Notification Error: Testing');
                            logger.error(err);
                            await Notification.updateNotificationDesc(e[i], notification.fileid, err)
                        })
                }
            }
        })
        setTimeout(() => {
            resolve()
        }, 60000)
    })
}

function getUserFcmToken(users) {
    let fcmTokens = []
    users.forEach(function (user) {
        if (user.fcm_token) {
            logger.info("\nSending Push notification to : " + user.name + " \nfcm token : " + user.fcm_token + " \n");
            fcmTokens.push(user.fcm_token);
        } else {
            logger.error("FCM token not found for user : " + user.loginid + " : " + user.name);
        }
    })
    return fcmTokens;
}