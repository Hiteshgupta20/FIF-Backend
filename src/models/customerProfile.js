const Promise = require('promise');
const db = require('../config/pg-db');
const utils = require('../controllers/util');
const logger = require('../config/logging');
var appConstants = require('../config/appConstants');

module.exports.listCustomerProfiles = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        let sortBy = data.sortByParam || 'insertdate::timestamp';
        db.query(`select userid,loginid,name,msisdn,email,custmainno,address,province,
                       userimage,district,subdistrict,village,neighbourhood,hamlet,postalcode,
                        insertdate,lastlogindate,isprofilecomplete,ismanualandsocialuser ,status,login_type, lastactivity as "activitytype",
                        fb_status, google_status, insta_status, twitter_status,
                        fb_email, google_email, insta_email, twitter_email,
                        apple_email, apple_status,
                        referral_id, app_version,ktp_no,branchname,branchid,
                        lastactivitydatetime as "ainsertdate"
                        from
                        ${db.schema}.t_lm_app_login_detail
                        ${data.whereClause}
                 ${data.orderByClause}
                 LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getCustomerProfilesListCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.listAllCustomerProfiles = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        let sortBy = data.sortByParam || 'insertdate::timestamp';
        db.query(`select userid,loginid,name,msisdn,email,custmainno,address,province,
        userimage,district,subdistrict,village,neighbourhood,hamlet,postalcode,
         insertdate,lastlogindate,isprofilecomplete,ismanualandsocialuser ,status,login_type, lastactivity as "activitytype",
         fb_status, google_status, insta_status, twitter_status,
         fb_email, google_email, insta_email, twitter_email,
         apple_email, apple_status,
         referral_id, app_version,ktp_no,branchname,branchid,
         lastactivitydatetime as "ainsertdate"
         from
         ${db.schema}.t_lm_app_login_detail
         ${data.whereClause}
  ${data.orderByClause}`, [])
            .then(async function (results) {
                let count = await self.getCustomerProfilesListCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}


module.exports.listCustomerProfilesDeviceId = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        let sortBy = data.sortByParam || 'insertdate::timestamp';
        db.query(`select u.userid,u.loginid,u.name,u.msisdn,u.email,u.custmainno,u.address,u.province,
                       u.userimage,u.district,u.subdistrict,u.village,u.neighbourhood,u.hamlet,u.postalcode,
                        u.insertdate,u.lastlogindate,u.isprofilecomplete,u.ismanualandsocialuser ,u.status,u.login_type, u.lastactivity as "activitytype",
                        u.fb_status, u.google_status, u.insta_status, u.twitter_status,
                        u.fb_email, u.google_email, u.insta_email, u.twitter_email,
                        u.apple_email, u.apple_status,
                        u.referral_id, u.app_version,u.ktp_no,u.branchname,u.branchid,
                        u.lastactivitydatetime as "ainsertdate",
                        d.deviceid
                        from
                        ${db.schema}.t_lm_app_login_detail as u
                        inner join
                        ${db.schema}.t_lm_device_info as d
                        on u.loginid = d.loginid
                        ${data.whereClauseDeviceId}
                 ${data.orderByClause}
                 LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getCustomerProfilesListCountDeviceId(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });


}

module.exports.listCustomerProfilesDeviceIdAll = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        let sortBy = data.sortByParam || 'insertdate::timestamp';
        db.query(`select u.userid,u.loginid,u.name,u.msisdn,u.email,u.custmainno,u.address,u.province,
                       u.userimage,u.district,u.subdistrict,u.village,u.neighbourhood,u.hamlet,u.postalcode,
                        u.insertdate,u.lastlogindate,u.isprofilecomplete,u.ismanualandsocialuser ,u.status,u.login_type, u.lastactivity as "activitytype",
                        u.fb_status, u.google_status, u.insta_status, u.twitter_status,
                        u.fb_email, u.google_email, u.insta_email, u.twitter_email,
                        u.apple_email, u.apple_status,
                        u.referral_id, u.app_version,u.ktp_no,u.branchname,u.branchid,
                        u.lastactivitydatetime as "ainsertdate",
                        d.deviceid
                        from
                        ${db.schema}.t_lm_app_login_detail as u
                        inner join
                        ${db.schema}.t_lm_device_info as d
                        on u.loginid = d.loginid
                        ${data.whereClauseDeviceId}
                 ${data.orderByClause};`, [])
            .then(async function (results) {
                let count = await self.getCustomerProfilesListCountDeviceId(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });


}

module.exports.listCustomerUserIdsForDeletion = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select loginid
                        from
                        ${db.schema}.t_lm_app_login_detail
                        ${data.whereClause};`, [])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });


}

module.exports.listAllCustomerWithoutPassword = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select userid,loginid
                    from ${db.schema}.t_lm_app_login_detail
                    WHERE 
                    status = 1 
                    AND login_type != 'cmsuser'
                    AND (password = '' OR password = NULL);`, [])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.listAllCustomerWithoutCustMainNo = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select userid,loginid
                    from ${db.schema}.t_lm_app_login_detail
                    WHERE 
                    status = 1 
                    AND login_type != 'cmsuser'
                    AND (custmainno = '' OR custmainno = NULL);`, [])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateCustomerProfile = function(data) {
    console.log(data)
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_lm_app_login_detail
                    SET "name"=$1, "email"=LOWER($2), is_email_verified = false
                    WHERE loginid=$3 returning loginid;`,
            [data.name,data.email,data.loginid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getOldAppVersionCustomers = function (data) {
    var latestIosVersion = appConstants.latestIosVersion;
    var latestAndroidVersion = appConstants.latestAndroidVersion;
    return new Promise(function (resolve, reject) {
        db.query(`select *
                    from ${db.schema}.t_lm_app_login_detail
                    WHERE 
                    status = 1 
                    AND login_type != 'cmsuser'
                    AND (app_version isnull or (app_version <> $1 and app_version <> $2));`,
            [latestIosVersion, latestAndroidVersion])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.listAllCustomersWithIncompleteProfiles = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select *
                    from ${db.schema}.t_lm_app_login_detail
                    WHERE 
                    status = 1 
                    AND login_type != 'cmsuser'
                    AND (isprofilecomplete IS NULL OR isprofilecomplete = 0);`, [])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.listAllCustomersWithIncompleteDocuments = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select *
                    from ${db.schema}.t_lm_app_login_detail
                    WHERE 
                    status = 1 
                    AND login_type != 'cmsuser'
                    AND (isdocumentuploaded IS NULL OR isdocumentuploaded = 0);`, [])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.listAllNonSocialMediaCustomers = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select *
                    from ${db.schema}.t_lm_app_login_detail
                    WHERE 
                    status = 1 
                    AND (fb_status != 1
                    OR google_status != 1);`, [])
            .then(async function (results) {
                let response = {
                    "data": results
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getCustomerProfilesListCount = function (data) {

    return new Promise(function (resolve, reject) {
        db.query(`select loginid
                    from ${db.schema}.t_lm_app_login_detail
                    ${data.whereClauseWithoutPrefix} ;`, [])
            .then(function (count) {
                let custCount = count.length;
                resolve(custCount);
            })
            .catch(function (err) {
                console.log("error=" + err);
                reject(0);
            });
    });
}

module.exports.getCustomerProfilesListCountDeviceId = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select count(*) 
                    from 
                    ${db.schema}.t_lm_app_login_detail u
                    inner join
                    ${db.schema}.t_lm_device_info d
                    on u.loginid = d.loginid
                    ${data.whereClauseDeviceId} ;`, [])
            .then(function (results) {
                console.log("count=" + results[0].count);
                resolve(results[0].count);
            })
            .catch(function (err) {
                console.log("error=" + err);
                reject(0);
            });
    });
}

function getCount(data) {
    return new Promise(function (resolve, reject) {
        db.query(`select loginid
                    from ${db.schema}.t_lm_app_login_detail
                    ${data.whereClauseWithoutPrefix} ;`, [])
            .then(function (count) {
                let custCount = count.length;
                resolve(custCount);
            })
            .catch(function (err) {
                console.log("error=" + err);
                reject(0);
            });
    });
}
