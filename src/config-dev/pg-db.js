const Promise = require('promise');
const env = require('./env/environment');
const logger = require('./logging');
var pg = require('pg-promise')();
pg = pg(env.db.pgURL);
module.exports = {
    query: function(text, values) {
        logger.info("query : "+text+ " query params : "+values);
        return new Promise(function(resolve, reject) {
            //
            try{
                pg.query(text, values)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        handleErrorMessages(err)
                            .then(function(message) {
                                reject(message);
                            })
                            .catch(function() {
                                reject();
                            });
                    });
            }
            catch (err){
                logger.error(err);
            }
        });
    },
    schema : env.db.schema || "public"
};

function handleErrorMessages(err) {
    
    return new Promise(function(resolve, reject) {
        logger.error("db error : ",err);
        if (err.code == '23505') {
            err.message = 'email already in use, please use a different one'
        }
        if (err.code == '22P02') {
            err.message = 'invalid user UUID'
        }
        else if (process.env.NODE_ENV !== 'development') {
            err.message = 'something went wrong, please check your input and try again'
        }

        resolve(err);
    });
}