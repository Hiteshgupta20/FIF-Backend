const Promise = require('promise');
const Otp = require('../models/otp');
const Email = require('../models/email');
const Sms = require('../models/sms');
const util = require('../controllers/util');
const User = require('../models/user');


module.exports.getOtp = function (payload) {
    return new Promise(async function (resolve, reject) {


        let msisdn = req.body.msisdn || req.body.Mobile || "";
        let email = req.body.email || req.body.Email;

        if(msisdn && msisdn[0] !== "0"){
            msisdn = "0"+msisdn;
        }

        const details = {
            msisdn : msisdn,
            email : email
        }

        if(msisdn.length === 0 && email && email.length > 0 ){

            details.msisdn = await User.findUserByEmail(email);
        }


       this.sendEmail(payload);
       this.sendSms(payload);
    });
}

module.exports.sendOtp = function (payload) {
    return new Promise(function (resolve, reject) {

       this.sendEmail(payload);
       this.sendSms(payload);
    });
}

module.exports.sendEmail = function (payload) {
    return new Promise(function(resolve, reject) {

        db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
WHERE loginid=$1;`,
            [loginid])
            .then(function(results) {

                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.sendSms = function (payload) {
    return new Promise(function(resolve, reject) {

        db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
WHERE loginid=$1;`,
            [loginid])
            .then(function(results) {

                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

