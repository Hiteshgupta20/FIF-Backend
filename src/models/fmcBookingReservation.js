const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports.fmcBookingDetails = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_nm_fmc_booking_detail
             ("customerno","bookingid", "qrcode", "contractno", "bookingcode", bookingdate, "bookingstatus", insertdate,loginid,"serviceid","brandName","officename","servicename","servOfficeCode")
             VALUES($1, $2, $3, $4 ,$5 ,$6, $7,$8,$9,$10,$11,$12,$13,$14) returning *;`,
            [data.customerno, data.bookingid, data.qrcode, data.contractno, data.bookingcode, data.bookingdate, data.bookingstatus, data.insertdate, data.loginid, data.serviceid, data.brandName, data.officename, data.servicename, data.servOfficeCode])
            .then(function (result) {
                resolve(result[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.bookingReservationData = function () {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_nm_fmc_booking_detail WHERE bookingdate >= NOW();`, [])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.bookingList = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_nm_fmc_booking_detail WHERE customerno = $1 order by bookingdate desc  ;`, [data.customerNo])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.bookingDetails = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_nm_fmc_booking_detail WHERE customerno = $1 And bookingid = $2 ;`, [data.customerNo, data.bookingId])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}