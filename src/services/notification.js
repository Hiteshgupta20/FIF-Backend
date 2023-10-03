const Promise = require("promise");
const Notification = require("../models/notification");
const ActivityService = require("../services/activity");
const NotificationSetting = require("../services/appNotificationSettings");
const FCMNotificationService = require("../services/fcmPushNotification");
const util = require("../controllers/util");
const AuctionService = require("../models/auction");
const SurveyModel = require("../models/surveyQuestioner");
const UserModel = require("../models/user");
const NewsPromoModel = require("../models/newsAndPromo");
const UserService = require("./user");
const User = require("../models/user");
const notificationContent = require("../services/notificationContent");
const logger = require("../config/logging");
const CustomerGroupModel = require("../models/customerGroup");
const Scheduler = require("../../../../../Downloads/socket/utils/jobScheduler");
const xlsx = require("xlsx");
const { result } = require("lodash");
module.exports.createNotification = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        let date = util.getTimestamp();
        data.loginid = payload.loginid || null;
        data.title = payload.title || "";
        data.desc = payload.desc || "";
        data.type = payload.type || "";
        data.imageurl = payload.imageurl || "";
        data.refid = payload.refid || null;
        data.insertDate = date;
        data.contract_url = payload.contract_url || "";
        data.contract_no = payload.contract_no || "";
        data.flag = payload.flag || 0;
        data.expiryDate = payload.expirydate || null;
        data.icon = payload.icon || "";

        Notification.createNotification(data)
            .then(function (result) {
                try {
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.updateNotification = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        let date = util.getTimestamp();
        data.loginid = payload.loginid || null;
        data.title = payload.title || "";
        data.desc = payload.desc || "";
        data.type = payload.type || "";
        data.oldtype = payload.oldtype || "";
        data.imageurl = payload.imageurl || "";
        data.refid = payload.refid || null;
        data.icon = payload.icon || "";
        data.insertDate = date;
        data.contract_url = payload.contract_url || "";
        data.contract_no = payload.contract_no || "";
        data.flag = payload.flag || 0;
        data.expiryDate = payload.expirydate || null;
        data.id = payload.notificationId || "";

        Notification.updateNotification(data)
            .then(function (result) {
                try {
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};
module.exports.updateNotificationType = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        let date = util.getTimestamp();
        data.loginid = payload.loginid;
        data.type = payload.type || "";
        data.refid = payload.refid || null;
        data.oldtype = payload.oldtype || "";
        data.insertdate = date;

        Notification.updateNotificationType(data)
            .then(function (result) {
                try {
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.deleteNotification = function (payload) {
    return new Promise(function (resolve, reject) {
        let notificationId = payload.notificationId;
        Notification.deleteNotification(notificationId)
            .then(function (result) {
                resolve(result);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.getNotificationByUserId = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        data.loginid = payload.loginId;
        data.limit = payload.limit || 10;
        data.offset = (payload.page - 1) * payload.limit || 0;

        if (data.offset < 0) {
            data.offset = 0;
        }

        Notification.getNotificationByUserId(data)
            .then(function (result) {
                result.forEach((record) => {
                    record["insertdate"] = util.formatTimeStamp(record["insertdate"]);
                });
                resolve(result);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};
module.exports.getUnreadNotificationCountByUserId = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        data.loginid = payload.loginId;
        Notification.getUnreadNotificationCountByUserId(data)
            .then(function (result) {
                resolve(result);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};
module.exports.notificationDetail = function (payload) {
    return new Promise(async function (resolve, reject) {
        let data = {};
        data.refid = payload.refid;
        data.type = payload.type;
        data.userid = payload.userid || null;
        data.read = true;

        //todo :  get table name from type in notification
        //for now hard-coding "AUCTION_SETUP"
        try {
            let notification =
                (await Notification.updateNotificationReadStatus(data)) || {};

            //handling only auction details

            let auctionNotificationType = [
                "AUCTION_SETUP",
                "PAYMENT_CONFIRMATION",
                "PAYMENT_SUBMITTED",
                "PAYMENT_DONE",
                "AUCTION_REG_VERIFICATION",
                "AUCTION_REG_CANCELLED",
                "BIDDING_COMPLETE",
                "AUCTION_WINNER",
                "AUCTION_LOSER",
                "AUCTION_REG_REMINDER",
            ];

            let surveyNotificationType = ["NEW_SURVEY"];

            let newsPromoNotificationType = ["NEW_NEWS", "NEW_PROMO"];

            if (auctionNotificationType.indexOf(data.type) !== -1) {
                let auction = await AuctionService.findAuctionById(data);
                if (auction) {
                    auction.expirydate = util.formatTimeStamp(auction["expirydate"]);
                    auction.insertdate = util.formatTimeStamp(auction["insertdate"]);
                    auction.publishdate = util.formatTimeStamp(auction["publishdate"]);

                    let notification = await Notification.getNotificationType(data);
                    if (notification) {
                        auction.notificationtype = notification.type;
                    }
                    resolve(auction);
                } else {
                    reject(new Error("Detail does not found."));
                }
            } else if (surveyNotificationType.indexOf(data.type) !== -1) {
                let survey = await SurveyModel.findSurveyById(data);
                if (survey) {
                    survey.expirydate = util.formatTimeStamp(survey["expirydate"]);
                    survey.publishdate = util.formatTimeStamp(survey["publishdate"]);
                    survey.insertdate = util.formatTimeStamp(survey["insertdate"]);

                    let notification = await Notification.getNotificationType(data);
                    if (notification) {
                        survey.notificationtype = notification.type;
                    }
                    resolve(survey);
                } else {
                    reject(new Error("Detail does not found."));
                }
            } else if (newsPromoNotificationType.indexOf(data.type) !== -1) {
                let query = {
                    newsPromoId: data.refid,
                };
                NewsPromoModel.find(query).exec(async function (err, result) {
                    if (!err) {
                        let newsPromoObj = result[0];
                        if (newsPromoObj) {
                            newsPromoObj.expirydate = util.formatTimeStamp(
                                newsPromoObj.expiryDate
                            );
                            newsPromoObj.publishdate = util.formatTimeStamp(
                                newsPromoObj.publishDate
                            );
                            newsPromoObj.insertdate = util.formatTimeStamp(
                                newsPromoObj.insertDate
                            );

                            let notification = await Notification.getNotificationType(data);
                            let resObj = {};
                            resObj["data"] = newsPromoObj;
                            if (notification) {
                                resObj["notificationtype"] = notification.type;
                            }
                            resolve(resObj);
                        } else {
                            reject(new Error("Detail does not found."));
                        }
                    } else {
                        logger.error(err);
                    }
                });
            } else {
                let imgUrlFormatted = [];
                if (notification.imageurl && notification.imageurl != "") {
                    imgUrlFormatted.push(notification.imageurl);
                }
                notification.imageurl = imgUrlFormatted;
                if (notification.insertdate) {
                    notification.insertdate = util.formatTimeStamp(
                        notification.insertdate
                    );
                }
                if (notification.expirydate) {
                    notification.expirydate = util.formatTimeStamp(
                        notification.expirydate
                    );
                }
                resolve(notification);
            }
        } catch (err) {
            reject(err);
        }
    });
};

/*
 * method to create/update notification for user inbox and push them in device tray
 * @params notification : Object - notification data
 * {
 *  loginid :"",
 *  title :"",
 *  desc : "",
 *  type : "",
 *  oldtype : "",
 *  imageurl : "",
 *  refid : "",
 *  insertDate : null,
 *  expirydate : "",
 *  icon : ""
 *  }
 *
 *  @param user : object
 *  @param update : boolean -- update exiting notification
 *  @param notify : boolean -- flag for sending push notification
 *  @param isUserGroup : boolean -- flag for sending notification to usergroup
 *
 * */
module.exports.sendNotification = async function (
    notificationData,
    user,
    update,
    notify,
    isUserGroup,
    isNotActivity
) {
    try {

        //get activity name based on notification type
        let activityName = notificationContent.getNotificationContent(
            notificationData
        ).activityName;
        //check if notitfication flag is active for this activity
        let activity = await ActivityService.getActivityByName(activityName);
        if ((activity && activity.notification_flag !== false) || isNotActivity) {
            var self = this;
            if (user && !isUserGroup) {
                user = await UserModel.findUserByLoginId(user.loginid);
                let userArr = [];
                userArr.push(user);

                if (user) {
                    let data = notificationContent.getNotificationDetail(
                        user,
                        notificationData
                    );
                    if (notify) {
                        FCMNotificationService.pushFCMNotification(data, userArr);
                    }
                    update
                        ? self.updateNotification(data, userArr, false)
                        : self.createNotification(data, userArr, false);
                }
            } else {
                let users = [];
                if (isUserGroup && user.length) {
                    let groups = user;

                    let customerList = await CustomerGroupModel.getCustomerGroupInfoByGroupId(
                        groups.join(",")
                    );

                    customerList.forEach(function (record) {
                        Array.prototype.push.apply(users, record.customer_list);
                    });
                } else {
                    users = await UserModel.getFMCRegisteredUsers();
                }
                let data = {};
                users.forEach(async function (user) {
                    data = notificationContent.getNotificationDetail(
                        user,
                        notificationData
                    );
                    update
                        ? self.updateNotification(data, user, false)
                        : self.createNotification(data, user, false);
                });
                if (notify) {

                    FCMNotificationService.pushFCMNotification(data, users);
                }
            }
        }
    } catch (err) {
        logger.error(err);
    }
};

module.exports.sendNotificationNew = async function (
    notificationData,
    users,
    update,
    notify,
    isUserGroup,
    isNotActivity
) {
    debugger;
    try {
        //get activity name based on notification type
        let activityName = notificationContent.getNotificationContent(
            notificationData
        ).activityName;
        //check if notitfication flag is active for this activity
        let activity = await ActivityService.getActivityByName(activityName);
        if ((activity && activity.notification_flag !== false) || isNotActivity) {
            var self = this;
            if (users && !isUserGroup) {
                let data = {};
                // users.forEach(async function (user) {

                //     data = notificationContent.getNotificationDetail(user, notificationData);
                //     update ? self.updateNotification(data, user, false) :
                //         self.createNotification(data, user, false);
                // });
                if (notify) {
                    FCMNotificationService.pushFCMNotification(data, users);
                }
            } else {
                let users = [];
                if (isUserGroup && users.length) {
                    let groups = users;

                    let customerList = await CustomerGroupModel.getCustomerGroupInfoByGroupId(
                        groups.join(",")
                    );

                    customerList.forEach(function (record) {
                        Array.prototype.push.apply(users, record.customer_list);
                    });
                } else {
                    users = await UserModel.getFMCRegisteredUsers();
                }
                let data = {};
                users.forEach(async function (user) {
                    data = notificationContent.getNotificationDetail(
                        user,
                        notificationData
                    );
                    update
                        ? self.updateNotification(data, user, false)
                        : self.createNotification(data, user, false);
                });
                if (notify) {
                    FCMNotificationService.pushFCMNotification(data, users);
                }
            }
        }
    } catch (err) {
        logger.error(err);
    }
};

module.exports.createNotificationFrequency = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        let date = util.getTimestamp();
        data.insertDate = date;
        data.insertBy = payload.loginId || "";
        data.activityAppId = payload.activityAppId || "";
        data.frequencyType = payload.frequencyType || "";
        data.frequency = payload.frequency || "";
        let reqDays = payload.days || [];
        let reqDates = payload.dates || [];
        let reqTimes = payload.times || [];

        data.days = makeUniqueArr(reqDays);
        data.dates = makeUniqueArr(reqDates);
        data.times = makeUniqueArr(reqTimes);

        Notification.createReminderNotificationFrequency(data)
            .then(function (result) {
                try {
                    Scheduler.rescheduleReminderJobs(
                        data.activityAppId,
                        data.activityAppId
                    );
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.updateNotificationFrequency = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        let date = util.getTimestamp();
        data.modifyDate = date;
        data.modifyBy = payload.loginId || "";
        data.activityAppId = payload.activityAppId || "";
        data.frequencyType = payload.frequencyType || "";
        data.frequency = payload.frequency || "";
        let reqDays = payload.days || [];
        let reqDates = payload.dates || [];
        let reqTimes = payload.times || [];

        data.days = makeUniqueArr(reqDays);
        data.dates = makeUniqueArr(reqDates);
        data.times = makeUniqueArr(reqTimes);

        console.log(data.days);
        console.log(data.dates);
        console.log(data.times);

        Notification.updateReminderNotificationFrequency(data)
            .then(function (result) {
                try {
                    let formattedActivityName = upperCaseFirstLetter(
                        lowerCaseAllWordsExceptFirstLetters(data.activityAppId)
                    );
                    Scheduler.rescheduleReminderJobs(
                        formattedActivityName,
                        formattedActivityName
                    );
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports.getNotificationFrequency = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        data.activityAppId = payload.activityAppId || "";

        Notification.getNotificationFrequency(data)
            .then(function (result) {
                try {
                    let res = result || {};
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};


module.exports.uploadFile = function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        let date = new Date();
        date.setMilliseconds(0);
        date.setSeconds(0);
        data.filepath = payload.filepath || "";
        data.loginid = payload.loginid || null;
        data.type = payload.type || "";
        data.insertdate = date;
        data.scheduledate = payload.scheduledate || date;
        data.status = payload.status || 0;
        data.title = payload.title || "";
        data.message = payload.message || "";
        Notification.uploadFile(data)
            .then(function (result) {
                try {
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.getUploadedData = async function (payload) {
    return new Promise(function (resolve, reject) {
        let data = {};
        //  data.orderByClause = util.formatOrderByClause(payload);
        data.limit = payload.limit || 10;
        data.offset = (payload.page - 1) * payload.limit || 0;

        if (data.offset < 0) {
            data.offset = 0;
        }
        let whereClause = [];
        let searchParams = payload.searchParams;
        if (searchParams) {
            debugger;
            if (searchParams.title) {
                console.log(searchParams.title);
                whereClause.push(`title ILike '%${searchParams.title}%'`);
            }
            if (searchParams.message) {
                console.log(searchParams.message);
                whereClause.push(`message ILike '%${searchParams.message}%'`);
            }
            if (searchParams.scheduledate && searchParams.scheduledate.from && searchParams.scheduledate.to) {
                console.log(searchParams.scheduledate);
                whereClause.push(
                    `date_trunc('day',scheduledate) between to_date('${searchParams.scheduledate.from}','YYYY-MM-DD: HH:MI:SS') and to_date('${searchParams.scheduledate.to}','YYYY-MM-DD: HH:MI:SS')`
                );
            }
            if (searchParams.insertdate && searchParams.insertdate.from && searchParams.insertdate.to) {
                console.log(searchParams.insertdate)
                whereClause.push(`date_trunc('day',insertdate) between to_date('${searchParams.insertdate.from}','YYYY-MM-DD: HH:MI:SS') and to_date('${searchParams.insertdate.to}','YYYY-MM-DD: HH:MI:SS')`)
            }
        }
        whereClause = whereClause.join(" and ");
        if (whereClause.length > 0) {
            whereClause = "where " + whereClause;
        }
        data.whereClause = whereClause;

        Notification.getUploadedData(data)
            .then(function (result) {
                resolve(result);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.excelFileScheduler = async function () {
    return new Promise(async function (resolve, reject) {
        try {
            logger.info(
                ".....................Excel File Scheduler executing..........."
            );
            let excelFiles = await Notification.getAllExcelFiles();
            if (excelFiles.length > 0) {
                excelFiles.forEach(async function (excelFile, index, obj) {
                    let excelFileData = xlsx.readFile(excelFile.filepath);
                    var file = xlsx.utils.sheet_to_json(
                        excelFileData.Sheets[excelFileData.SheetNames[0]]
                    );

                    let users = [];
                    let fileData = {};
                    let successCount = 0;
                    let failedCount = 0;
                    let scheduleDate = new Date(util.getTimestamp(excelFile.scheduledate)).getTime();
                    for (var i = 0; i < file.length; i++) {
                        let result = file[i];
                        var data = { phone: result.Number };
                        if (result.Type === "Mobile") {
                            userdata = await User.getUserDetailsByMsisdn(data);
                            if (userdata) {
                                if (!userdata.fcm_token) {
                                    fileData.fileid = excelFile.id;
                                    fileData.type = result.Type;
                                    fileData.number = result.Number;
                                    fileData.description = "Invalid Token";
                                    fileData.insertdate = excelFile.insertdate;
                                    fileData.scheduledate = excelFile.scheduledate;
                                    fileData.title = excelFile.title;
                                    fileData.message = excelFile.message;
                                    fileData.status = "Failed";
                                    fileData.fcm_token = null;
                                    failedCount = failedCount + 1;
                                } else {
                                    fileData.fileid = excelFile.id;
                                    fileData.type = result.Type;
                                    fileData.number = result.Number;
                                    fileData.description = "-";
                                    fileData.insertdate = excelFile.insertdate;
                                    fileData.scheduledate = excelFile.scheduledate;
                                    fileData.title = excelFile.title;
                                    fileData.message = excelFile.message;
                                    fileData.status = "Success";
                                    fileData.fcm_token = userdata.fcm_token;
                                    successCount = successCount + 1;
                                }
                                Notification.uploadUserData(fileData);
                                users.push(userdata);
                            } else {
                                fileData.fileid = excelFile.id;
                                fileData.type = result.Type;
                                fileData.number = result.Number;
                                fileData.description = "No Mobile Number Found";
                                fileData.insertdate = excelFile.insertdate;
                                fileData.scheduledate = excelFile.scheduledate;
                                fileData.title = excelFile.title;
                                fileData.message = excelFile.message;
                                fileData.status = "Failed";
                                failedCount = failedCount + 1;
                                fileData.fcm_token = null;
                                Notification.uploadUserData(fileData);
                            }
                        }
                        if (result.Type === "CustomerMainNumber") {
                            userdata = await User.getAllUsersByCustMainNo(result.Number);
                            userdata.forEach(function (userdata) {
                                if (userdata) {
                                    if (!userdata.fcm_token) {
                                        fileData.fileid = excelFile.id;
                                        fileData.type = result.Type;
                                        fileData.number = result.Number;
                                        fileData.description = "Invalid Token";
                                        fileData.insertdate = excelFile.insertdate;
                                        fileData.scheduledate = excelFile.scheduledate;
                                        fileData.title = excelFile.title;
                                        fileData.message = excelFile.message;
                                        fileData.status = "Failed";
                                        fileData.fcm_token = null;
                                        failedCount = failedCount + 1;
                                    } else {
                                        fileData.fileid = excelFile.id;
                                        fileData.type = result.Type;
                                        fileData.number = result.Number;
                                        fileData.description = "-";
                                        fileData.insertdate = excelFile.insertdate;
                                        fileData.scheduledate = excelFile.scheduledate;
                                        fileData.title = excelFile.title;
                                        fileData.message = excelFile.message;
                                        fileData.status = "Success";
                                        fileData.fcm_token = userdata.fcm_token
                                        successCount = successCount + 1;
                                    }
                                    Notification.uploadUserData(fileData);
                                    users.push(userdata);
                                } else {
                                    fileData.fileid = excelFile.id;
                                    fileData.type = result.Type;
                                    fileData.number = result.Number;
                                    fileData.description = "No Customer Main Number Found";
                                    fileData.insertdate = excelFile.insertdate;
                                    fileData.scheduledate = excelFile.scheduledate;
                                    fileData.title = excelFile.title;
                                    fileData.message = excelFile.message;
                                    fileData.status = "Failed";
                                    fileData.fcm_token = null;
                                    failedCount = failedCount + 1;
                                    Notification.uploadUserData(fileData);
                                }
                            })
                        }

                        if (result.Type === "ContractNumber") {
                            userData = await User.getUserDetailsByContractNo(result.Number);
                            if (userData) {
                                userdata = await User.getUserDetailsByLoginId(userData.loginid);
                                if (userdata) {
                                    if (!userdata.fcm_token) {
                                        fileData.fileid = excelFile.id;
                                        fileData.type = result.Type;
                                        fileData.number = result.Number;
                                        fileData.description = "Invalid Token";
                                        fileData.insertdate = excelFile.insertdate;
                                        fileData.scheduledate = excelFile.scheduledate;
                                        fileData.title = excelFile.title;
                                        fileData.message = excelFile.message;
                                        fileData.status = "Failed";
                                        fileData.fcm_token = null;
                                        failedCount = failedCount + 1;
                                    } else {
                                        fileData.fileid = excelFile.id;
                                        fileData.type = result.Type;
                                        fileData.number = result.Number;
                                        fileData.description = "-";
                                        fileData.insertdate = excelFile.insertdate;
                                        fileData.scheduledate = excelFile.scheduledate;
                                        fileData.title = excelFile.title;
                                        fileData.message = excelFile.message;
                                        fileData.status = "Success";
                                        fileData.fcm_token = userdata.fcm_token
                                        successCount = successCount + 1;
                                    }
                                    Notification.uploadUserData(fileData);
                                    users.push(userdata);
                                } else {
                                    fileData.fileid = excelFile.id;
                                    fileData.type = result.Type;
                                    fileData.number = result.Number;
                                    fileData.description = "No Contract Number Found";
                                    fileData.insertdate = excelFile.insertdate;
                                    fileData.scheduledate = excelFile.scheduledate;
                                    fileData.title = excelFile.title;
                                    fileData.message = excelFile.message;
                                    fileData.status = "Failed";
                                    fileData.fcm_token = null;
                                    failedCount = failedCount + 1;
                                    Notification.uploadUserData(fileData);
                                }
                            } else {
                                fileData.fileid = excelFile.id;
                                fileData.type = result.Type;
                                fileData.number = result.Number;
                                fileData.description = "No Contract Number Found";
                                fileData.insertdate = excelFile.insertdate;
                                fileData.scheduledate = excelFile.scheduledate;
                                fileData.title = excelFile.title;
                                fileData.message = excelFile.message;
                                fileData.status = "Failed";
                                fileData.fcm_token = null;
                                failedCount = failedCount + 1;
                                Notification.uploadUserData(fileData);
                            }
                        }
                    }

                    let status = 0;
                    let currentDate = new Date(util.getTimestamp()).getTime();
                    if (excelFile.scheduledate) {
                        scheduleDate = new Date(util.getTimestamp(excelFile.scheduledate)).getTime();
                        if (scheduleDate <= currentDate) {
                            status = 1;
                        }
                    }

                    let excelData = {
                        status: status,
                        id: excelFile.id,
                    }
                    if (status != excelFile.status) {
                        logger.info("\n activating excelFile.................... \n");
                        excelFile.type = "EXCEL_FILE";
                        await FCMNotificationService.pushFCMBulkNotification(fileData, users, excelData)
                    }
                    resolve(true)
                })

            } else {
                resolve(true)
            }
        } catch (err) {
            reject(false);
        }
    });
};

function upperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerCaseAllWordsExceptFirstLetters(string) {
    return string.replace(/\w\S*/g, function (word) {
        return word.charAt(0) + word.slice(1).toLowerCase();
    });
}

function makeUniqueArr(arr) {
    let tempArr = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] && tempArr.indexOf(arr[i]) == -1) {
            tempArr.push(arr[i]);
        }
    }
    return tempArr;
}
