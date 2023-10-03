const logger = require('../config/logging');
const moment = require('moment');
const nodeMailer = require("nodemailer");
const smtp_Transport = require('nodemailer-smtp-transport');
const request = require('request');
const pool = require('../config/postgreDB');
const NewsAndPromo = require('../models/newsAndPromo');
const autionService = require('../services/auction');
const db = require('../config/pg-db');
const NotificationService = require('../services/notification');
const CustService = require('../services/customerProfile');
const _ = require('lodash');
var nodeoutlook = require('nodejs-nodemailer-outlook');
const UserService = require("./user");
const User = require("../models/user");


exports.otpExpireTime = 5;
exports.resendOtpValidTime = 30;
exports.getTimestamp = function (date, format) {
    format = format || "YYYY-MM-DD HH:mm:ss";
    date = date || new Date();
    return moment(date).tz('Asia/Jakarta').format(format);
}

exports.success = function (response, message, ratingDesc, pointsDesc, pointsMessage) {
    let apiResponse = {};
    apiResponse.statusCode = 200;
    apiResponse.status = "Success";
    apiResponse.message = message || "Success";
    apiResponse.object = response;
    apiResponse.ratingDescription = ratingDesc;
    apiResponse.pointsAdded = pointsDesc;
    apiResponse.pointsDescription = pointsMessage;
    logger.info("Response:" + JSON.stringify(apiResponse));
    return apiResponse;
}

exports.failed = function (error, msg, errorCode) {

    let apiResponse = {};
    try {
        apiResponse.statusCode = errorCode || error.statusCode || 150;
        apiResponse.status = "Failure";
        apiResponse.message = msg || error.message || "Something went wrong";
        apiResponse.object = error;

        logger.error("Response: " + JSON.stringify(apiResponse));
        logger.error(error);
    }
    catch (error) {
        console.log(error)
        logger.error(error);
    }

    return apiResponse;
}

exports.ISSAPIFailed = function (response, msg, errorCode) {

    let apiResponse = {};
    try {
        apiResponse.statusCode = response.statusCode || 150;
        apiResponse.status = "Failure";
        apiResponse.message = msg || response.reason || "Something went wrong";
        apiResponse.object = {} || response.data[0]

        logger.error("Response: " + JSON.stringify(apiResponse));
    }
    catch (error) {
        console.log(error)
        logger.error(error);
    }

    return apiResponse;
}

exports.triggerSms = function (smsDetails) {
    if (!smsDetails.msisdn) return;
    let expireTime = this.otpExpireTime;
    logger.info("sending sms ........")

    let msisdn = smsDetails.msisdn || "";
    if (msisdn && msisdn[0] !== "0") {
        msisdn = "0" + msisdn;
    }
    // var url = 'http://sms-api.jatismobile.com/index.ashx?'
    // var queryObject = {
    //     userid:"crmdatamining",
    //     password:"crmdatamining235",
    //     msisdn: msisdn,
    //     message:smsDetails.message || `Pelanggan yang terhormat, password satu kali Anda (OTP) untuk aplikasi FMC adalah ${smsDetails.otp}, Berlaku selama ${expireTime} menit. Mohon jangan bagikan OTP ini kepada siapa pun.`,
    //     sender:"FIFGROUP",
    //     division:"CRM DATA MINING",
    //     batchname:"fmcustomernew",
    //     uploadby:"OTP",
    //     channel:2,
    // }
    var dateObj = new Date();
    var month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    var date = ('0' + dateObj.getDate()).slice(-2);
    var year = dateObj.getFullYear();
    var shortDate = year + '' + month + '' + date;
    var batchName = "fmc_" + shortDate;

    var url = 'http://103.85.62.52:8888/FIFRECEIVER/Receiver.aspx?'
    var queryObject = {
        userid: "crmdatamining",
        password: "crmdatamining235",
        msisdn: msisdn,
        message: smsDetails.message || `Pelanggan yang terhormat, password satu kali Anda (OTP) untuk aplikasi FMC adalah ${smsDetails.otp}, Berlaku selama ${expireTime} menit. Mohon jangan bagikan OTP ini kepada siapa pun.`,
        sender: "FIFGROUP",
        division: "CRM DATA MINING",
        batchname: batchName,
        uploadby: "CRM Data Mining",
        channel: 2
    }

    logger.info(url + JSON.stringify(queryObject));
    addSmsDetails(queryObject, this);
    // logger.info(queryObject);
    request({
        url: url,
        qs: queryObject
    }, function (error, response, body) {
        if (error) {
            logger.error('error while sending sms :', error); // Print the error if one occurred
            response.json(util.failed(error));
        } else if (response && body) {
            logger.info("response body of sms api : ", body);
        }
    })
}

exports.triggerEmail = function (emailDetails) {
    if (emailDetails && !emailDetails.email) return;

    let expireTime = this.otpExpireTime;
    emailDetails.from = emailDetails.from || 0;
    emailDetails.email = emailDetails.email || '';
    emailDetails.subject = emailDetails.subject || 'FIF Consumer App OTP';
    emailDetails.text = emailDetails.text || `Pelanggan yang terhormat,\n\nPassword satu kali Anda (OTP) untuk aplikasi FMC adalah ${emailDetails.otp}, Berlaku selama ${expireTime} menit. Mohon jangan bagikan OTP ini kepada siapa pun.
                                     \nSalam,\nFIF Group`;
    emailDetails.html = emailDetails.html || "";


    logger.info("sending email ........");
    addEmailDetails(emailDetails, this);

    nodeoutlook.sendEmail({
        host: 'smtp.office365.com',
        auth: {
            user: "fmc.admin@fif.co.id",
            pass: "4dmf3c123!"
        },
        from: 'fmc.admin@fifgroup.astra.co.id',
        to: emailDetails.email,
        subject: emailDetails.subject,
        html: emailDetails.html,
        text: emailDetails.text,
        onError: (e) => {
            logger.error('email sending failed');
            logger.error(e);
        },
        onSuccess: (i) => {
            logger.info('email sending success');
            logger.info(i);
        }
    });




    // var transporter;
    // if(true){
    //    transporter = nodeMailer.createTransport(smtp_Transport({
    //        host: 'mail.fifgroup.co.id',
    //        debug: true,
    //        tls: {
    //            rejectUnauthorized: false
    //        },
    //        secure: false,
    //        port: 25,
    //        auth: {
    //            user: "fmc.admin",
    //            pass: "4dmf3c123!"
    //        }
    //     }));

    // }
    // else{
    //     var transporter = nodeMailer.createTransport('smtps://nirmal.singh@digispice.com:password@smtp.gmail.com');
    // }

    // transporter.sendMail({
    //     from: 'fmc.admin@fifgroup.astra.co.id',
    //     to: emailDetails.email ,
    //     subject: emailDetails.subject,
    //     text: emailDetails.text ,
    //     html : emailDetails.html
    // }, (err, info) => {
    //     logger.error(err);
    //     if(info){
    //         logger.info(info);
    //         logger.info(info.messageId);
    //     }
    //     else{
    //         logger.info("info", info);
    //     }

    // });

}

exports.triggerBookingEmail = async function (emailDetails) {
    userdata = await User.getUserNameDetailsByLoginId(emailDetails.loginid);
    let customerName = userdata.name
    if (emailDetails && !emailDetails.email) return;

    emailDetails.from = emailDetails.from || 0;
    emailDetails.email = emailDetails.email || '';
    emailDetails.subject = emailDetails.subject || 'FIFGROUP MOBILE CUSTOMER';
    emailDetails.text = emailDetails.text || `Hai, ${customerName}! \nPermintaan Surat Kuasa anda telah berhasil. Berikut kami lampirkan template Surat Kuasa yang dapat langsung diunduh oleh perwakilan pelanggan FIFGROUP.
                                     \n\nHormat Kami,\n\nFIFGROUP MOBILE CUSTOMER`;
    emailDetails.html = emailDetails.html || "";
    emailDetails.attachments = {
        filename: 'SURAT_KUASA.pdf',
        path: "./public/staticdata/suratkuasa/SURAT_KUASA.pdf"
    }


    logger.info("sending email ........");
    addEmailDetails(emailDetails, this);

    nodeoutlook.sendEmail({
        host: 'smtp.office365.com',
        auth: {
            user: "fmc.admin@fif.co.id",
            pass: "4dmf3c123!"
        },
        from: 'fmc.admin@fifgroup.astra.co.id',
        to: emailDetails.email,
        subject: emailDetails.subject,
        html: emailDetails.html,
        text: emailDetails.text,
        attachments: emailDetails.attachments,
        onError: (e) => {
            logger.error('email sending failed');
            logger.error(e);
        },
        onSuccess: (i) => {
            logger.info('email sending success');
            logger.info(i);
        }
    });
}

function addSmsDetails(queryObject, util) {

    let insertDate = util.getTimestamp();
    pool.connect(function (err, client, done) {

        let loginQuery = `INSERT INTO ${db.schema}.t_send_sms
(login_id, msisdn, sms_text, sms_length, route, sender_id, insert_date)
VALUES('', '${queryObject.msisdn}', '${queryObject.message}', '${queryObject.message.length}', '${queryObject.channel}', '${queryObject.sender}', '${insertDate}');`;
        logger.info(loginQuery);
        if (err) {
        }
        else if (client) {
            client.query(loginQuery, function (err, result) {
                done();
                if (err) {
                }
                else if (result && result.rowCount && result.rowCount > 0) {
                    //logger.info(result.rows);
                    let userInfo = result.rows[0];

                } else {
                    var errorCode = 155;
                }
            });
        }
    });
}

function addEmailDetails(details, util) {

    let insertDate = util.getTimestamp();
    pool.connect(function (err, client, done) {

        let loginQuery = `INSERT INTO ${db.schema}.t_send_email
(login_id, vmid, receipt_emailid, cc_emailid, bcc_emailid, subject, variables, insert_date)
VALUES('${details.loginid}', '${details.from}', '${details.email}', '', '', '${details.subject}', '${details.text}', '${insertDate}');`
        logger.info(loginQuery);
        if (err) {
            logger.error(err);
        }
        else if (client) {
            client.query(loginQuery, function (err, result) {
                done();
                if (err) {
                    logger.error(err);
                }
                else if (result && result.rowCount && result.rowCount > 0) {
                    logger.info(result.rows);
                    let userInfo = result.rows[0];

                } else {
                    var errorCode = 155;
                }
            });
        }
    });
}

exports.getUserDetails = function (loginId) {

    return new Promise(function (resolve, reject) {
        pool.connect(function (err, client, done) {

            let loginQuery = `SELECT * FROM ${db.schema}.t_lm_app_login_detail where loginid = ${loginId}`;

            logger.info(loginQuery);
            if (err) {
                reject(err);
            }
            else if (client) {
                client.query(loginQuery, function (err, result) {
                    done();
                    if (err) {
                        reject(err);
                    }
                    else if (result && result.rowCount && result.rowCount > 0) {
                        //logger.info(result.rows);
                        let userInfo = result.rows[0];
                        resolve(userInfo);

                    } else {
                        var errorCode = 155;
                        reject(errorCode);
                    }
                });
            }
        });
    });
    // 
    // let insertDate = util.getTimestamp();

}

exports.changeStatusOfExpiredNewsAndPromo = function () {

    return new Promise(function (resolve, reject) {
        const d = new Date();
        var query = {
            'expiryDate': {
                $lt: new Date().toISOString()
            }
        }
        NewsAndPromo.find(query)
            .exec(function (err, result) {
                if (!err) {
                    for (var i = 0; i < result.length; i++) {
                        result[i] = result[i].toObject();
                        var updated_record = { "status": 0 };
                        let newsPromoId = result[i].newsPromoId;
                        if (result[i].status != updated_record.status) {
                            NewsAndPromo.findOneAndUpdate({ "newsPromoId": newsPromoId }, updated_record, (err, result) => {
                                if (err) {
                                    logger.error(err);
                                }
                                else {

                                }
                            })
                        }
                    }
                } else {
                    logger.error(err)
                }
            });
        query = {
            'expiryDate': {
                $gte: new Date().toISOString()
            },
            'publishDate': {
                $lte: new Date().toISOString()
            }
        }
        console.log("#########################################");
        console.log(query);
        console.log("%%%%%%%%%%%%%%%%%%%");
        NewsAndPromo.find(query)
            .exec(function (err, result) {
                if (!err) {
                    for (var i = 0; i < result.length; i++) {
                        result[i] = result[i].toObject();
                        var updated_record = { "status": 1 };
                        let newsPromoRes = result[i];
                        let newsPromoId = result[i].newsPromoId;
                        if (result[i].status != updated_record.status) {
                            NewsAndPromo.findOneAndUpdate({ "newsPromoId": newsPromoId }, updated_record, async (err, result) => {
                                console.log(newsPromoRes);
                                if (err) {
                                    logger.error(err)
                                }
                                else {
                                    sendNewsAndPromoNotification(newsPromoRes);
                                }
                            })
                        }

                    }
                } else {
                    logger.error(err);
                }
            });

        resolve(true);
    });
}


async function sendNewsAndPromoNotification(newsPromo) {
    let data = {
        type: newsPromo.type == 1 ? "NEW_NEWS" : "NEW_PROMO",
        refid: newsPromo.newsPromoId,
        title: newsPromo.title,
        itemTitle: newsPromo.title,
        itemType: newsPromo.type == 1 ? "News" : "Promo"
    }
    let userData = null;
    let isGroup = false;

    if (newsPromo.sendNotification.length > 0) {
        userData = newsPromo.sendNotification;
        isGroup = true;
        NotificationService.sendNotification(data, userData, false, true, isGroup);
    }
    else {
        let payload = {
            isExport: 1
        }
        let fmcUsers = await CustService.listCustomerProfiles(payload);
        let usersIn = [];
        if (fmcUsers.data) {
            usersIn = fmcUsers.data;
        }
        const chunks = _.chunk(usersIn, 50000);
        logger.info(chunks.length);
        try {
            for (let i = 0; i < chunks.length; i++) {
                logger.info(chunks[i].length);
                let userArr = chunks[i];
                for (let j = 0; j < userArr.length; j++) {
                    let userNot = userArr[j];
                    logger.info("\n\n sending news and promo notification .. \n\n" + j);
                    await NotificationService.sendNotification(data, userNot, false, true, false);
                }
            }
        }
        catch (err) {
            logger.info('Error while sending news and promo notification');
        }
    }
}

exports.formatTimeStamp = function (timestamp) {
    console.log(timestamp);
    let timestampFormatted = timestamp.getTime();
    return timestampFormatted;
}
exports.getDateDiff = function (timestamp) {
    let a = moment(new Date(), 'M/D/YYYY');
    let b = moment(timestamp, 'M/D/YYYY');
    let diffDays = b.diff(a, 'days');
    return diffDays;
}
exports.formatAmountFields = function (amt) {
    amt = amt || "";
    let amtFormatted = amt.replace(/,/g, '').trim();
    return amtFormatted;
}
exports.apiError = function (moduleName, statusCode, message) {
    let error = new Error(message);
    error.moduleName = moduleName;
    error.statusCode = statusCode;
    return error;
}

exports.formatOrderByClause = function (data, prefix) {
    let sortBy = data.sortBy || 'insertdate';
    let prefixQuery = prefix || '';
    let orderBy = sortBy != 'insertdate' ? prefixQuery + sortBy : prefixQuery + 'insertdate::timestamp';
    let sortOrderData = data.ascending || false;
    let sortOrder = data.ascending == false ? 'DESC' : 'ASC';
    return 'ORDER BY ' + orderBy + ' ' + sortOrder;
}
exports.formatOrderByClauseScheduler = function (data, prefix) {
    let sortBy = data.sortBy || 'startdate';
    let prefixQuery = prefix || '';
    let orderBy = sortBy != 'startdate' ? prefixQuery + sortBy : prefixQuery + 'startdate::timestamp';
    let sortOrderData = data.ascending || false;
    let sortOrder = data.ascending == false ? 'DESC' : 'ASC';
    return 'ORDER BY ' + orderBy + ' ' + sortOrder;
}

exports.formatOrderByClauseMongo = function (data) {
    let orderBy = data.sortBy || "insertDate";
    let sortOrderData = data.ascending || false;
    let sortOrder = data.ascending == false ? -1 : 1;
    let retData = {};
    retData[orderBy] = sortOrder;
    return retData;
}

exports.getPointDescriptionContent = function (points) {
    let pointsDesc = "";
    if (points) {
        pointsDesc = "Terima kasih! Anda mendapat tambahan " + points + " poin. Tukarkan poin Anda sekarang!";
    }
    return pointsDesc;
}

exports.prepareActivityLogsData = function (loginId, actType, actDesc, actModule, remarks, modifyBy) {
    let data = {
        loginid: loginId,
        activitytype: actType || '',
        activitydesc: actDesc || '',
        activitymodule: actModule || loginId,
        remarks: remarks || '',
        modifyby: modifyBy || null
    }
    return data;
}

async function sendNotification(userId) {

    NotificationService.sendNotification(data, { loginid: userId }, false, false, false);
}
