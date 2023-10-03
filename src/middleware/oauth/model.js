
/**
 * Module dependencies.
 */

// var pg = require('pg-promise')();
const env = require('../../config/env/environment');
var pg = require('../../config/pg-db');
const schema = env.db.schema;
//pg = pg(env.db.pgURL);

/*
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
    var self = this;
    return pg.query(`SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM ${schema}.oauth_tokens WHERE access_token = $1`, [bearerToken])
        .then(async function(result) {
            var token = result[0];
            if(!token) return ;
            let isUserExist = await self.getUserByLoginid(token.user_id);
            if(!isUserExist) return;
            return {
                accessToken: token.access_token ,
                client: {id: token.client_id} ,
                accessTokenExpiresAt: token.access_token_expires_on ,
                user: {id: token.user_id }, // could be any object
            };
        });
};

/*
* Delete access token
*/
module.exports.deleteToken = function(bearerToken) {
    
    return pg.query(`DELETE FROM ${schema}.oauth_tokens WHERE access_token = $1 returning *;`, [bearerToken])
        .then(async function(result) {
            try{
                let loginid = result[0].user_id;
                if(loginid){
                    result.loginId = loginid;
                    pg.query(`UPDATE ${schema}.t_lm_app_login_detail SET fcm_token= null WHERE loginid = $1 returning *;`, [loginid])
                        .then(function(result) {});
                }
            }
            catch(err){
            }

            return result;
        });
};
/*
* Delete access token by userid
*/
module.exports.deleteTokenByUserId = function(userId) {
    
    return pg.query(`DELETE FROM ${schema}.oauth_tokens WHERE user_id = $1;`, [userId])
        .then(function(result) {
            
            return result;
        });
};

/**
 * Get client.
 */

module.exports.getClient = function *(clientId, clientSecret) {
    
    return pg.query(`SELECT client_id, client_secret, redirect_uri FROM ${schema}.oauth_clients WHERE client_id = $1 AND client_secret = $2`, [clientId, clientSecret])
        .then(function(result) {
            
            var oAuthClient = result[0];
            if (!oAuthClient) {
                return;
            }
            return {
                clientId: oAuthClient.client_id,
                clientSecret: oAuthClient.client_secret,
                grants: ['password','refresh_token'], // the list of OAuth2 grant types that should be allowed
            };
        });
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function *(bearerToken) {
    return pg.query(`SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM ${schema}.oauth_tokens WHERE refresh_token = $1`, [bearerToken])
        .then(function(result) {
            return result.length ? result[0] : false;
        });
};

/*
 * Get user.
 */

module.exports.getUser = async function (loginid, user) {
    
    let queryString = `SELECT loginid as id FROM ${schema}.t_lm_app_login_detail WHERE loginid = $1 `;
    await this.deleteTokenByUserId(loginid);
    return pg.query(queryString, loginid)
        .then(function(result) {
            
            return result.length ? result[0] : false;
        });
};

module.exports.getUserByLoginid = async function (loginid) {

    let queryString = `SELECT loginid as id FROM ${schema}.t_lm_app_login_detail WHERE loginid = $1 `;
    return pg.query(queryString, loginid)
        .then(function(result) {

            return result.length ? result[0] : false;
        });
};

/**
 * Save token.
 */

module.exports.saveToken =async function (token, client, user) {
    
    try{
        

        return pg.query(`INSERT INTO ${schema}.oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES ($1, $2, $3, $4 ,$5 , $6) RETURNING *;`, [
            token.accessToken,
            token.accessTokenExpiresAt,
            client.clientId,
            token.refreshToken,
            token.refreshTokenExpiresAt,
            user.id
        ]).then(function(result) {
            
            if(result.length ){
                return {
                    accessToken : result[0].access_token,
                    accessTokenExpiresAt : result[0].access_token_expires_on,
                    refreshTokenExpiresAt : result[0].refresh_token_expires_on,
                    refreshToken : result[0].refresh_token,
                    client : {
                        id : result[0].client_id
                    },
                    user : {
                        id : result[0].user_id
                    }
                };
            }
            return false;
        }).catch(function(err) {
            
        });;
    }
    catch(err){

    }

};

