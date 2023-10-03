const { Pool } = require('pg')
const env = require('./env/environment');
const logger = require('./logging');
var config = {
    user: env.db.psqlUrl.user,
    host: env.db.psqlUrl.host,
    database: env.db.psqlUrl.database,
    password: env.db.psqlUrl.password,
    port: env.db.psqlUrl.port,
    max: 100000000, // Poolsize
    min: 10,
    keepAlive: true,
    idleTimeoutMillis: 259200000
}

var pool = new Pool(config);

pool.on('connect', (err,client) => {
    logger.info('connected to the db');
});
pool.on('error', (err, client) => {
    logger.error('Unexpected error on idle client', err);
})


module.exports = pool;