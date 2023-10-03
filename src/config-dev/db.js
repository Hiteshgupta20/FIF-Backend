var mongoose = require('mongoose');
const env = require('./env/environment');

mongoose.Promise = require('bluebird');
mongoose.connect(env.db.url, {
    useMongoClient: true,
    promiseLibrary: global.Promise
});




module.exports= mongoose

