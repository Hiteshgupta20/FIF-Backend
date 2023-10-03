var express = require('express');
var router = express.Router();
var app = express();
var path = require("path");
var bodyParser = require('body-parser');
var auth = require('basic-auth');
var CronJob = require('cron').CronJob;
const env = require('./src/config/env/environment');
const logger = require('./src/config/logging');
const utils = require('../../../Downloads/socket/utils/jobScheduler');
const oauth2 = require('./src/middleware/oauth/oauth2');
const Util = require('./src/controllers/util');
const cors = require("cors");
const nodeoutlook = require('nodejs-nodemailer-outlook');

logger.info('fif cms');
app.use('/assets', express.static(__dirname + '/assets'));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(bodyParser.json({ limit: "100mb" }));
var corsOptions = {
  origin: "http://localhost:4200"
};
app.use(cors(corsOptions));
app.use(require('./src/controllers'));

//creating oauth2 server
oauth2.createOauthServer(app);

process.on('uncaughtException', function (exception) {
  logger.info('Uncaught Exception');
  logger.info(exception);
});

app.listen(env.server.port, () => {
  logger.info('listening on ' + env.server.port);
  utils.scheduleJobs();
  utils.scheduleReminderJobs();
});
exports.app = app;
