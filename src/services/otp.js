const Promise = require('promise');
const Otp = require('../models/otp');
const Util = require('../controllers/util');
const UserModel = require('../models/user');
const UserService = require('./user');
const auth = require('../config/authorization');
const PointManagement = require('../services/pointManagement');
const PointHistory = require('../services/pointHistory');
const notification = require('../services/notification');
const logger = require('../config/logging');

module.exports = {

    getOtp: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                let msisdn = payload.msisdn || "";
                let email = payload.email || "";
                if(msisdn.length === 0 && email && email.length > 0 ){
                    
                    let user = await UserModel.findInactiveUserByEmail(email);
                    if(user){
                        payload.msisdn = user.msisdn;
                    }
                    else{
                        return reject(new Error("Email yang anda masukan belum terdaftar di  FMC. Pastikan email yang anda masukan sudah benar."));
                    }
                }
                let user = await  UserModel.findInactiveUserByMsisdn(payload.msisdn);
                if(!user){
                    user = await  UserModel.findUserByMsisdn(payload.msisdn);
                }
                if(!user){
                    return reject(new Error("Nomor handphone yang anda masukan belum terdaftar di  FMC. Pastikan nomor yang anda masukan sudah benar."));
                }
                payload.email = user.email;
                payload.loginid = user.loginid;

               let result = await checkForValidOtp(payload);
                if(result){
                    const response = {
                        "token" : result.otp,
                        "msisdn" : result.entity
                    }
                    payload.otp = result.otp;
                    triggerAlert(payload);
                    resolve(response);

                }
            }
            catch (err) {
                reject(err);
            }
        });
    },
    getOtpForRegisteredUser: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                let msisdn = payload.msisdn || "";
                let email = payload.email || "";
                if(msisdn.length === 0 && email && email.length > 0 ){

                    let user = await UserModel.findInactiveUserByEmail(email);
                    if(user){
                        payload.msisdn = user.msisdn;
                    }
                    else{
                        return reject(new Error("Email yang anda masukan belum terdaftar di  FMC. Pastikan email yang anda masukan sudah benar."));
                    }
                }
                let user = await  UserModel.findUserByMsisdn(payload.msisdn);
                if(!user){
                    return reject(new Error("Nomor handphone yang anda masukan belum terdaftar di  FMC. Pastikan nomor yang anda masukan sudah benar."));
                }
                payload.email = user.email;
                payload.loginid = user.loginid;

                let result = await checkForValidOtp(payload);
                if(result){
                    const response = {
                        "token" : result.otp,
                        "msisdn" : result.entity
                    }
                    payload.otp = result.otp;
                    triggerAlert(payload);
                    resolve(response);

                }
            }
            catch (err) {
                reject(err);
            }
        });
    },
    getOtpForEmailVerify: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                payload.loginid = payload.loginId;
                payload.otpType = "Email_Verify";
                let result = await checkForValidOtp(payload);
                if(result){
                    const response = {
                        "token" : result.otp,
                        "msisdn" : result.entity
                    }
                    payload.otp = result.otp;
                    payload.msisdn ="";
                    triggerAlert(payload);
                    resolve(response);

                }
            }
            catch (err) {
                reject(err);
            }
        });
    },

    validateOtp: async function (payload) {
        return new Promise(async (resolve, reject) => {
            try {
                let record =await Otp.getOtpByMsisdn(payload.msisdn,payload);
                if(record){
                    const systemDate = new Date(Util.getTimestamp());
                    let otpExpireDate = new Date(record.expirydate);
                    if( (record.otp === payload.token) && (otpExpireDate.getTime() > systemDate.getTime())){
                        Otp.deleteOtp(payload.msisdn);
                        if(payload.type == "CheckPlafond"){
                            let userInfo = await UserModel.findUserByMsisdn(payload.msisdn);
                            return resolve({userid : userInfo.loginid});
                        }
                        if(payload.type == "forgotPassword"){
                            let userInfo = await UserModel.findUserByMsisdn(payload.msisdn);
                            let accessToken = "";
                            // if(userInfo){
                            //     accessToken = await UserModel.getOauth2Token(userInfo.loginid);
                            // }
                            return resolve({"userid" : userInfo.loginid, "access-token" : accessToken});
                        }
                        if(payload.verifyEmail){
                            UserModel.updateEmailFlag(payload);
                            return resolve(null);
                        }

                        let userInfo = await UserModel.activateUserByMsisdn(payload.msisdn);

                            if(userInfo){
                                let response ={};
                                let accessToken = await UserModel.getOauth2Token(userInfo.loginid);
                                let pointsAdded = 0;
                                let pointsData = {
                                    loginid: userInfo.loginid,
                                    activityappid: 'REGISTER PROCESS',
                                    description: 'Registration'
                                }
    
                                let checkRegisterPoints = await PointHistory.checkRegistrationPoints(pointsData);
    
                                if (checkRegisterPoints && checkRegisterPoints == 0) {
                                    let userPoints = await PointManagement.addPointsForActivity(pointsData);
                                    // let pointsAdded = 0;
                                    if (userPoints.currentPoints){
                                        pointsAdded = userPoints.currentPoints;
                                    }
                                    let data = {
                                        loginId: userInfo.loginid,
                                        points: pointsAdded
                                    }
                                    if (pointsAdded > 0) {
                                        sendRegisterPointsNotification(data);
                                    }
                                }
                                response = {
                                    "access-token" : accessToken,
                                    "userid":userInfo.loginid,
                                    "points": pointsAdded
                                };
    
                                resolve(response);
                            }

                        
                        reject(new Error("User not found."));
                    }
                    else{
                        reject(new Error("Invalid otp."));
                    }
                }
                else{
                    reject(new Error("Invalid otp."));
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }

}



async function checkForValidOtp(details){
    return new Promise(async function (resolve ,reject) {
        
        try{
            let record = await  Otp.getOtpByMsisdn(details.msisdn);
            if(record){
                const systemDate = new Date(Util.getTimestamp());
                let otpExpireDate = new Date(record.expirydate);
                let currentDate = new Date();
                details.insertdate = Util.getTimestamp(currentDate);
                let resendOtpValidDate = new Date(record.resendotpvaliddate);
                let otpLimitRecord = await Otp.getOtpLimitDetails(details);
                let requestType = details.otpType;
                if(requestType != 'Email_Verify' && (resendOtpValidDate.getTime() > systemDate.getTime())){
                   return reject(new Error('Silahkan coba kembali setelah 30 menit.'));
                }
                else if (requestType != 'Email_Verify' && (otpLimitRecord && otpLimitRecord.length != 0 && otpLimitRecord[0].count >= 3)) {
                    return reject(new Error('Mohon maaf, anda sudah melewati batas pengiriman OTP. Silahkan coba kembali besok.'));
                }
                else
                {
                    details = prepareOtpData(details);
                    record = await updateOtp(details);
                    if(record){
                        if (requestType != 'Email_Verify') {
                            let otpLimitRecord = await Otp.getOtpLimitDetails(details);
                            console.log(otpLimitRecord);
                            if (otpLimitRecord && otpLimitRecord.length != 0) {
                                await updateOTPLimitDetails(details);
                            }
                            else {
                                await addOTPLimitDetails(details);
                            }
                            resolve(record);
                        }
                        else {
                            resolve(record);
                        }
                    }
                }
            }
            else{
                details = prepareOtpData(details);
                record =  await  createOtp(details);
                if(record){
                    let otpLimitRecord = await Otp.getOtpLimitDetails(details);
                        if (otpLimitRecord && otpLimitRecord.length != 0) {
                            await updateOTPLimitDetails(details);
                        }
                        else {
                            await addOTPLimitDetails(details);
                        }
                    resolve(record);
                }
            }
        }
        catch (err){
            reject(err);
        }
    });
}

function createOtp(details){
    return new Promise(function (resolve ,reject) {
        try{
            let record = Otp.createOtp(details);
            if(record){
                resolve(record);
            }
        }
        catch(err){
            reject(err);
        }
    });
}

function updateOtp(details){

    return new Promise(function (resolve,reject) {
        try{
            if (details.otpType != 'Email_Verify') {
                let record = Otp.updateOtp(details);
                if(record){
                    resolve(record);
                }
            }
            else {
                let record = Otp.updateOtpEmail(details);
                if(record){
                    resolve(record);
                }
            }
        }
        catch(err){
            reject(err);
        }
    });
}

function addOTPLimitDetails(details){

    return new Promise(function (resolve,reject) {
        try{
            let record = Otp.createOtpLimitDetails(details);
            if(record){
                resolve(record);
            }
        }
        catch(err){
            reject(err);
        }
    });
}

function updateOTPLimitDetails(details){

    return new Promise(function (resolve,reject) {
        try{
            let record = Otp.updateOtpLimitDetails(details);
            if(record){
                resolve(record);
            }
        }
        catch(err){
            reject(err);
        }
    });
}

function triggerEmail (emailDetails){
    if(!emailDetails.email) return;
    logger.info("sending email .........");
}

function triggerAlert(details){
    if(details.msisdn){
        Util.triggerSms(details);
    }
    if(details.email){
        details = getEmailContent(details);
        Util.triggerEmail(details);
    }

}

function getEmailContent(details){
    details.content = ""
    return details;
}

function getUniqueOtp() {
    let otpLength = 6;
    let baseNumber = Math.pow(10, otpLength -1 );
    let number = Math.floor(Math.random()*baseNumber);
    /*
    Check if number have 0 as first digit
    */
    if (number < baseNumber) {
        number += baseNumber;
    }
    return number;
}

function prepareOtpData(details){
    details.otp = getUniqueOtp();
    let currentDate = new Date ();
    let expiryDate = new Date ( currentDate );
    let resendOtpValidDate = new Date ( currentDate );
    expiryDate.setMinutes ( currentDate.getMinutes() + Util.otpExpireTime );
    resendOtpValidDate.setMinutes ( currentDate.getMinutes() + Util.resendOtpValidTime );
    details.insertdate = Util.getTimestamp(currentDate);
    details.expirydate = Util.getTimestamp(expiryDate);
    details.resendotpvaliddate = Util.getTimestamp(resendOtpValidDate);
    details.otptype = details.otptype || "register";
    return details;
}

function sendRegisterPointsNotification(data) {
    let type = "REGISTER_POINTS_ADDED";
    data = data || {};
    data.type = type;
    data.desc = data.points;
    data.refid = new Date().getTime();
    let user = {
        loginid: data.loginId
    }
    // data.sendnotification = data.loginId;
    notification.sendNotification(data,user,false,true,false,true);
}
