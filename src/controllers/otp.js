const express = require('express');
const router = express.Router();
const auth = require('../config/authorization');
const util = require('./util');
const logger = require('../config/logging');
const UserService = require('../services/user');
const OtpService = require('../services/otp');

router.post('/getOtp', auth.isBasicAuthenticated, async (req, res) => {
    try {

        req.body = verifyRequest(req.body);
        let error = validateGetOtpRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }

        let otp = await OtpService.getOtp(req.body);
        res.json(util.success(otp));
    }
    catch (err) {
        logger.error(err);
        res.json(util.failed(err));
    }

});
router.post('/getOtpForRegisteredUser', auth.isBasicAuthenticated, async (req, res) => {
    try {

        req.body = verifyRequest(req.body);
        let error = validateGetOtpRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }

        let otp = await OtpService.getOtpForRegisteredUser(req.body);
        res.json(util.success(otp));
    }
    catch (err) {
        logger.error(err);
        res.json(util.failed(err));
    }

});
router.post('/getEmailVerifyOtp', auth.isAuthenticated, async (req, res) => {
    try {

        req.body = verifyRequest(req.body);
        let error = validateGetOtpRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }

        let otp = await OtpService.getOtpForEmailVerify(req.body);
        res.json(util.success(otp));
    }
    catch (err) {
        logger.error(err);
        res.json(util.failed(err));
    }

});

router.post('/validateOtp', auth.isBasicAuthenticated, async (req, res) => {
    try {
        req.body = verifyRequest(req.body);
        let error = validateOtpRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }

        let isValidOtp = await OtpService.validateOtp(req.body);
        let pointsAdded = 0;
        let pointsDescription = util.getPointDescriptionContent(pointsAdded);
        if (isValidOtp.points) {
            pointsAdded = isValidOtp.points
        }
        res.json(util.success(isValidOtp, '', '', pointsAdded, pointsDescription));
    }
    catch (err) {

        logger.error(err);
        res.json(util.failed(err, err.message));
    }
});
router.post('/verifyEmailOtp', auth.isAuthenticated, async (req, res) => {
    try {
        req.body = verifyRequest(req.body);
        let error = validateOtpRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        req.body.verifyEmail = true;
        let isValidOtp = await OtpService.validateOtp(req.body);

        res.json(util.success(isValidOtp));
    }
    catch (err) {

        logger.error(err);
        res.json(util.failed(err, err.message));
    }
});

function validateGetOtpRequest(payload) {

    if (payload.msisdn === null && payload.email === null) {
        return new Error("Please enter valid phone no. or email.");
    }
    return false;
}

function validateOtpRequest(payload) {
    return false;
}

function verifyRequest(payload) {
    if (payload.msisdn === "null" || payload.msisdn === "") {
        payload.msisdn = null;
    } else if (payload.msisdn && payload.msisdn[0] !== "0") {
        payload.msisdn = "0" + payload.msisdn;
    }

    if (payload.email === "null" || payload.email === "") {
        payload.email = null;
    } else if (payload.email) {
        payload.email = payload.email.toLowerCase();
    }
    return payload;
}

function verifyEmailRequest(payload) {
    if (payload.email === "null" || payload.email === "") {
        payload.email = null;
    } else if (payload.email) {
        payload.email = payload.email.toLowerCase();
    }
    return payload;
}


module.exports = router;