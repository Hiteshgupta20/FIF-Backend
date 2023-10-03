const express = require('express');
const router = express.Router();
const auth = require('../config/authorization');
const util = require('./util');
const logger = require('../config/logging');
const UserService = require('../services/user');
const OtpService = require('../services/alert');
const activityLogs = require('../services/activityLogs');
const customerProfileService = require('../services/customerProfile');

router.post('/users/getCmsUsers',auth.isAuthenticated,async (req, res) => {
    try{
        let usersList = await UserService.getCmsUsersList(req.body);
        res.json(util.success(usersList));
    }catch(err){
        res.json(util.failed(err));
    }
});

router.post('/register',auth.isBasicAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.registerUser(req.body);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/editProfile',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.updateUser(req.body);
        let data = {}
        if (registeredUser.loginid){
            data.loginid = registeredUser.loginid;
        }
        let points = 0;
        let pointDescription = "";
        if (registeredUser.pointsAdded){
            points = registeredUser.pointsAdded;
            pointDescription = util.getPointDescriptionContent(points);
        }

        let loginId = req.body.loginId;
        let activityData = util.prepareActivityLogsData(loginId, 'Profile updated', 'Profile updated');
        await activityLogs.createActivityLog(activityData);
        res.json(util.success(data,'','',points,pointDescription));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/updateFcmToken',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let userUpdated = await UserService.updateFcmToken(req.body);
        res.json(util.success(userUpdated));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/getProfile',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.getUserDetails(req.body.loginId);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/oauth/getToken',auth.isBasicAuthenticated,async (req, res) => {
    try{
        
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let authUser = await UserService.Oauth2Api(req.body.loginId);
        res.json(util.success(authUser));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/registerCmsUser',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.registerCmsUser(req.body);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});
router.post('/cmsUserBulkUpload',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.cmsUserBulkUpload(req.body);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/updateCmsUser',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRegisterRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let updatedUser = await UserService.updateCmsUser(req.body);
        res.json(util.success(updatedUser));
    }
    catch(err){
        res.json(util.failed(err ,err.message));
    }
});

router.post('/deleteCmsUser',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let result = await UserService.deleteCmsUser(req.body.userId);
        res.json(util.success(result));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/deleteAppUser',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payload = req.body;
        let deleteType = payload.type || null;
        let userDeleted = {}
        if (!deleteType){
            return res.json(util.failed('Please enter Delete Type'));
        }
        if (deleteType == 'email'){
            userDeleted = await UserService.deleteAppUserByEmail(payload);
        }
        else if (deleteType == 'phone'){
            userDeleted = await UserService.deleteAppUserByPhone(payload);
        }
        else if (deleteType == 'name'){
            userDeleted = await UserService.deleteAppUserByName(payload);
        }
        res.json(util.success(userDeleted));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/forgetPassword',auth.isBasicAuthenticated,async (req, res) => {
    try{
        logger.info('===============HEADERS======================');
        logger.info(req.headers);
        let platform = req.headers['platform'];
        let sourceModule = 'FORGOT_PASSWORD';
        req.body = verifyRequest(req.body);
        let error = validateForgetPasswordRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        req.body.platform = platform;
        req.body.module = sourceModule;
        let registeredUser = await UserService.forgetPassword(req.body);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/resetPassword',auth.isBasicAuthenticated,async (req, res) => {
    try{
        let error = validateResetPasswordRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.resetPassword(req.body);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err));
    }
});
router.post('/changePassword',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateResetPasswordRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let registeredUser = await UserService.changePassword(req.body);
        let loginId = req.body.userid;
        let activityData = util.prepareActivityLogsData(loginId, 'Password updated', 'Password updated');
        await activityLogs.createActivityLog(activityData);
        res.json(util.success(registeredUser));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/login',auth.isBasicAuthenticated,async (req, res) => {
    try{
        let error = validateLoginRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let user;
        if(req.body.inputType == "cmsuser"){
            user = await UserService.authenticateCmsUser(req.body);
        }
        else {
            user = await UserService.authenticateAppUser(req.body);
        }
        if(user){
            res.json(util.success(user));
        }else {
            res.json(util.failed("User Not Found."));
        }

    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/login-via-socialId',auth.isBasicAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let user = await UserService.authenticateSocialMediaUser(req.body);
        res.json(util.success(user));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/connectSocialMedia', async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let loginId = req.body.loginId;
        let connection = await UserService.connectSocialMedia(req.body);
        let pointsAdded = 0;
        let pointDescription = "";
        if (connection && connection.pointsAdded){
            pointsAdded = connection.pointsAdded;
            pointDescription = util.getPointDescriptionContent(pointsAdded);
        }
        let activityData = util.prepareActivityLogsData(loginId, 'Connect to Social Media', 'Connect to Social Media');
        await activityLogs.createActivityLog(activityData);
        res.json(util.success(connection,'','',pointsAdded, pointDescription));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/disconnectSocialMedia',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let loginId = req.body.loginId;
        let connection = await UserService.disconnectSocialMedia(req.body);
        let activityData = util.prepareActivityLogsData(loginId, 'Disconnect Social Media', 'Disconnect Social Media');
        await activityLogs.createActivityLog(activityData);
        res.json(util.success(connection));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/getUserDeviceInfo',auth.isAuthenticated, async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let userDevices = await UserService.getUserDeviceInfo(req.body);
        res.json(util.success(userDevices));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/getAllDeviceInfo',auth.isAuthenticated, async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let allDevices = await UserService.getAllDeviceInfo(req.body);
        res.json(util.success(allDevices));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

router.post('/getAllDeviceInfoCount',auth.isAuthenticated, async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let allDevices = await UserService.getAllDeviceInfoCount(req.body);
        res.json(util.success(allDevices));
    }
    catch(err){
        res.json(util.failed(err));
    }
});


router.get('/logout',async (req, res) => {
    try{
        let user = await UserService.deleteToken(req.headers.authorization);

        res.json(util.success(user));
    }
    catch(err){
        res.json(util.failed(err));
    }
});

function validateLoginRequest(payload) {
    return false;
}

function validateRegisterRequest(payload) {
   return false;
}

function validateForgetPasswordRequest(payload) {
   return false;
}

function validateResetPasswordRequest(payload) {
    if(payload.password ==  ""  || payload.password === null){
        return new Error("Please enter new password.");
    }
    if(payload.userid ==  ""  || payload.userid === null || payload.userid === "null" ){
        return new Error("User not found.");
    }
   return false;
}

function validateRequest(payload) {
   return false;
}

function verifyRequest(payload) {
    let msisdn = payload.msisdn || payload.Mobile || "";
    let email = payload.email || payload.Email;
    if(msisdn === 'null')msisdn = "";
    if(msisdn && msisdn[0] !== "0"){
        msisdn = "0"+msisdn;
    }

    payload.msisdn = msisdn;
    payload.email = email;
    return payload;
}

module.exports = router;
