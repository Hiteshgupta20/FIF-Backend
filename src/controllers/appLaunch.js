var express = require('express');
var router = express.Router();
var IntroScreen = require('../models/introScreen');
var auth = require('../config/authorization');
var appConstants = require('../config/appConstants');
var request = require("request");
var util = require('./util');
const logger = require('../config/logging');
var userService = require('../services/user');

router.get('/app/launch', auth.isBasicAuthenticated, async (req, res) => {
  var currentAppVersion = req.headers['appversion'];
  var loginId = req.headers['loginid'];
  var platform = req.headers['platform'];
  var latestVersion = '';
  var data = {};
  var query = {
  }

  logger.info('---------Request Headers-------------');
  logger.info(req.headers);
  data.termsAndContionsURL = 'https://www.fifgroup.co.id/pages/kebijakan-privasi';
  data.privacyURL = '';
  data.updateLink = null;
  data.splashDelay = 3;
  data.isUpdateAvailable = false;
  data.isForceUpdate = false;
  data.customerCareNo = "1500-343";
  data.webChatUrl = "https://fmc-prod.fifgroup.co.id/staticdata/webchat/index-mobile.html";
  if (currentAppVersion) {
    if (platform == 'Android') {
      latestVersion = appConstants.latestAndroidVersion;
    } else if (platform == 'iOS') {
      latestVersion = appConstants.latestIosVersion;
    }
    if (latestVersion != currentAppVersion) {
      data.isUpdateAvailable = true;
      data.isForceUpdate = false;
    } else {
      data.isUpdateAvailable = false;
      data.isForceUpdate = false;
    }
    let appUpdateData = {
      loginId: loginId,
      appVersion: currentAppVersion
    }
    if (loginId) {
      try {
        await userService.updateAppVersion(appUpdateData);
      }
      catch (err) {
        logger.error('Error updating app version' + err);
      }
    }
  }
  IntroScreen.find(query, { _id: 0, sno: 1, title: 1, imageURL: 1, imageDesc: 1 }).exec(function (err, result) {
    data.introScreenData = result || [];
    res.json(util.success(data));

  });
});

module.exports = router;
