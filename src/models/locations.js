const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.getLocations = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`select * from 
	                (SELECT distinct on (latitude, longitude) id, branch_id, postal_kiosk_branch_id, branch_name, postal_kiosk_branch_name, region, 
                    networking_status, networking_type, full_office_address, village_districts, 
	                city_district, latitude, longitude,(point($1,$2) <@> point(latitude,longitude)) as distance 
	                FROM ${db.schema}.t_ma_location_details) as t
                   WHERE abs(distance) < 10 ;`,
            [data.lat,data.long])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getAllLocations = function (searchValue) {
    return new Promise(function(resolve, reject) {

        db.query(`SELECT distinct on (latitude, longitude) id, branch_id, postal_kiosk_branch_id, branch_name, postal_kiosk_branch_name, region, 
                    networking_status, networking_type, full_office_address, village_districts, 
	                city_district, latitude, longitude
	                FROM ${db.schema}.t_ma_location_details	                
	                where branch_name ilike '%${searchValue}%' or networking_type  ilike '%${searchValue}%'
	                LIMIT 100 OFFSET 0;`,
            [])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}