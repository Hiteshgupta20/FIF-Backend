
/**
 * Module dependencies.
 */

const oauth2Server = require('express-oauth-server');
const model = require('./model');
module.exports.createOauthServer = function (app) {
    // Add OAuth server.
    app.oauth = new oauth2Server({
        debug :true,
        model: model,
        continueMiddleware: true,
        useErrorHandler :true,
        accessTokenLifetime: 25 * 60 * 60 * 60
    });
// Post token.
    app.post('/cms/oauth/token', app.oauth.token(),function (req,res) {
        try{
            res.json(res.locals.oauth.token);
        }catch (err){
            res.json({});
        }
    });

    return app.oauth;
}


