const logger = require('../config/logging');
const util = require('../controllers/util');
const  express  = require('../../app');

exports.isBasicAuthenticated =function(req, res, next) {
    var request = req.method+' ' + req.protocol + '://' + req.get('host') + req.originalUrl+ ' '+ JSON.stringify(req.body) +']';
    logger.info("Request: "+request);
    const auth = {login: 'FIFUser', password: 'FIFUser'};
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');
    
    if (!login || !password || login !== auth.login || password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="nope"');
        res.status(401);
        res.json(failed());
        return;
    }
    return next();
  }
exports.isAuthenticated1 =function(req, res, next) {
    var request = req.method+' ' + req.protocol + '://' + req.get('host') + req.originalUrl+ ' '+ JSON.stringify(req.body) +']';
    logger.info("Request: "+request);
    const auth = {login: 'FIFUser', password: 'FIFUser'};
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

    if (!login || !password || login !== auth.login || password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="nope"');

        res.status(401);
        res.json(failed());
        return;
    }
    return next();
  }
exports.isAuthenticated =function(req, res, next) {
    
    var request = req.method+' ' + req.protocol + '://' + req.get('host') + req.originalUrl+ ' '+ JSON.stringify(req.body) +']';
    logger.info("Request: "+request);

    if(req.headers.authorization){
        let authToken = req.headers.authorization.replace(/bearer/,"Bearer");
        req.headers.authorization = authToken;
    }
    express.app.oauth.authenticate()(req, res, errorHandler(req,res,next));
  }

exports.getAuthToken =function(){
    return "RklGVXNlcjpGSUZVc2Vy";
}

function errorHandler(req,res,next) {
    let response = res;
    return function (err) {
        
        if(err){
            logger.error(err);
            response.json(util.failed(null, "Anda sudah tidak terhubung. Silahkan Masuk kembali.",401));
        }else{
            next();
        }

    }
}


function failed(){
    let apiResponse={};
    apiResponse.statusCode=401;
    apiResponse.status="Failure";
    apiResponse.message="Unauthorized";
    apiResponse.object=null;
    return apiResponse;
}
