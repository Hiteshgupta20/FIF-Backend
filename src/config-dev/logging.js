'use strict';
const winston = require('winston');
const moment = require('moment');
const fs = require('fs');
const env = process.env.NODE_ENV || 'dev';
const logDir = 'log';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss').trim();
const logger = new (winston.Logger)({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      datePattern: 'yyyy-MM-dd',
      json: false,
      prepend: true,
      level: env === 'dev' ? 'debug' : 'info'
    }),
    new (winston.transports.File)({
      filename: `${logDir}/app.log`,
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      json: false,
      prepend: true,
      level: env === 'dev' ? 'debug' : 'info'
    })
  ]
});

module.exports= logger;