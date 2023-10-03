const fs = require('fs');
const path = require('path');
const NODE_ENV = process.env.NODE_ENV;
let envBuffer = null;

// Init config_buffer according to the NODE_ENV
switch (NODE_ENV) {
  case 'local':
    envBuffer = fs.readFileSync(path.resolve(__dirname, 'local.json'), 'utf-8');
    break;
  case 'dev':
    envBuffer = fs.readFileSync(path.resolve(__dirname, 'dev.json'), 'utf-8');
    break;
  case 'qa':
    envBuffer = fs.readFileSync(path.resolve(__dirname, 'qa.json'), 'utf-8');
    break;
  case 'prod':
    envBuffer = fs.readFileSync(path.resolve(__dirname, 'prod.json'), 'utf-8');
    break;
  default:
    envBuffer = fs.readFileSync(path.resolve(__dirname, 'prod.json'), 'utf-8');
}

let env = JSON.parse(envBuffer);
module.exports = env;
