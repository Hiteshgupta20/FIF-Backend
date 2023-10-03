const Promise = require('promise');
const request = require('request');
const db = require('./../config/pg-db');
const util = require('../controllers/util');
const env = require('../config/env/environment');
const logger = require('../config/logging');
// methods for login detail table
module.exports = {

    createUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`INSERT INTO ${db.schema}.t_lm_app_login_detail 
                     (userid, name, msisdn, email, fb_email, google_email, insta_email, twitter_email, apple_email,
                         "password", login_type, fb_socialid, google_socialid, insta_socialid, twitter_socialid, apple_socialid,
                         "role", insertdate, lastlogindate, status, fb_status, google_status, insta_status, twitter_status, apple_status,
                         fcm_token, referral_id)
                      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27) returning *;`,
                [data.userid, data.name, data.msisdn, data.email, data.fb_email, data.google_email,
                data.insta_email, data.twitter_email, data.apple_email, data.password, data.login_type, data.fb_socialid,
                data.google_socialid, data.insta_socialid, data.twitter_socialid, data.apple_socialid, data.role, data.insertDate,
                data.lastLoginDate, data.status, data.fb_status, data.google_status, data.insta_status,
                data.twitter_status, data.apple_status, data.fcmToken, data.referral_id
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    createDeviceInfo: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`INSERT INTO ${db.schema}.t_lm_device_info 
                     (loginid, lastlogintime, deviceid)
                      VALUES($1, $2, $3) returning *;`,
                [data.loginid, data.insertdate, data.deviceid])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    createCmsUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`INSERT INTO ${db.schema}.t_lm_app_login_detail 
                     (userid, name, login_type, "role", insertdate, lastlogindate, status,startdate,enddate)
                      VALUES($1, $2, $3, $4, $5, $6, $7,$8,$9) returning *;`,
                [data.userId, data.name, data.loginType,
                data.role, data.insertDate, data.lastLoginDate, data.status, data.startdate, data.enddate
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    cmsUserBulkUpload: function (data) {
        debugger;
        return new Promise(function (resolve, reject) {

            db.query(`INSERT INTO ${db.schema}.t_lm_app_login_detail 
                     (userid, name, login_type, "role", insertdate, lastlogindate, status,startdate,enddate)
                      VALUES($1, $2, $3, $4, $5, $6, $7,$8,$9)
                      ON CONFLICT (userid) DO UPDATE SET userid = EXCLUDED.userid , name =  EXCLUDED.name,role =  EXCLUDED.role,
                      status =  EXCLUDED.status,startdate =  EXCLUDED.startdate,enddate =  EXCLUDED.enddate 
                      returning *;`,
                [data.userId, data.name, data.loginType,
                data.role, data.insertDate, data.lastLoginDate, data.status, data.startdate, data.enddate
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateCmsUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  name= $1, role= $2, status=$3,userid = $4,startdate = $5,enddate=$6
                     WHERE loginid = $7 returning userid;`,
                [data.name, data.role, data.status,
                data.userid, data.startdate, data.enddate, data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  userimage= $1, name= $2, email=$3, homephone= $4, gender=$5, address= $6, province= $7, 
                     district=$8, subdistrict=$9, village=$10, neighbourhood=$11, hamlet=$12, postalcode=$13
                     WHERE loginid = $14 returning loginid;`,
                [data.userimage, data.name, data.email, data.homephone, data.gender, data.address, data.province,
                data.district, data.subdistrict, data.village, data.neighbourhood, data.hamlet, data.postalcode,
                data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getCompleteProfilePointsStatus: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * from ${db.schema}.t_wm_wallet_hist
                     WHERE login_id = $1 AND description = 'Profile Updated';`,
                [data.loginid])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateUserCompleteProfileStatus: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET isprofilecomplete= $1
                     WHERE loginid = $2 returning loginid;`,
                [data.isprofilecomplete,
                data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateUserCompleteDocumentsStatus: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET isdocumentuploaded= $1
                     WHERE loginid = $2 returning loginid;`,
                [data.isdocumentuploaded,
                data.loginId
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateAppVersion: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  app_version= $1
                     WHERE loginid = $2 returning loginid;`,
                [data.appversion,
                data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateFirebaseToken: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  fcm_token= $1
                     WHERE loginid = $2 returning loginid;`,
                [data.fcmToken,
                data.loginId
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateCustMainNo: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  custmainno= $1,
                     ktp_no = $2, branchname= $3, branchid = $4
                     WHERE loginid = $5 returning loginid;`,
                [data.custmainno,
                data.ktpno,
                data.branchname, data.branchid,
                data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateLastActivity: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  lastactivity= $1, lastactivitydatetime = now()
                     WHERE loginid = $2 returning loginid;`,
                [data.lastActivity,
                data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateDeviceInfo: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_device_info 
                     SET  lastlogintime= $1
                     WHERE loginid = $2 and deviceid = $3 returning loginid;`,
                [data.insertdate, data.loginid, data.deviceid])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateCustTotalInstallments: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail 
                     SET  custtotalinstallments= $1, custtotalinstallmentsdatetime = now()
                     WHERE loginid = $2 returning loginid;`,
                [data.custtotalinstallments,
                data.loginid
                ])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getCmsUsersList: function (data) {
        var self = this;
        return new Promise(function (resolve, reject) {

            db.query(`SELECT u.userid,u.loginid,u.startdate,u.enddate, u.name, u.status, u.role, u.insertdate, r.name AS roleName FROM ${db.schema}.t_lm_app_login_detail u
            LEFT JOIN ${db.schema}.t_ma_user_role r ON u.role = r.id
            ${data.whereClause} 
            ${data.orderByClause} LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
                .then(async function (results) {
                    let count = await self.getTotalCount(data);
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
    },

    getAllCmsUsersList: function (data) {
        var self = this;
        return new Promise(function (resolve, reject) {

            db.query(`SELECT u.userid,u.loginid,u.startdate,u.enddate, u.name, u.status, u.role, u.insertdate, r.name AS roleName FROM ${db.schema}.t_lm_app_login_detail u
            LEFT JOIN ${db.schema}.t_ma_user_role r ON u.role = r.id
            ${data.whereClause} ORDER BY u.insertdate::timestamp DESC;`, [])
                .then(async function (results) {
                    let count = await self.getTotalCount(data);
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
    },

    activateUserByMsisdn: function (msisdn) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET status = 1 WHERE msisdn = $1 returning *;`,
                [msisdn])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updatePassword: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET password = $1 WHERE loginid = $2 returning *;`,
                [data.hash, data.userid])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateStatusOnRoleDeletion: function (roleId) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET status = 0 WHERE role = $1 returning *;`,
                [roleId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    updateLoginType: function (loginId) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET ismanualandsocialuser = true WHERE loginid = $1 returning *;`,
                [loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateEmailFlag: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET email = LOWER($1),is_email_verified = true WHERE loginid = $2 returning *;`,
                [data.email, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateFcmToken: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET fcm_token = $1 ,lastlogindate = $3, login_type = $4 WHERE loginid = $2 returning *;`,
                [data.fcmtoken, data.loginid, data.lastlogindate, data.login_type])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteFcmToken: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail WHERE loginid = $1;`,
                [data.loginid])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    connectGoogleSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET google_socialid = $1 , google_email = $2, google_status = $3, ismanualandsocialuser = $4 WHERE loginid = $5 returning *;`,
                [data.socialId, data.accountEmail, 1, true, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    connectFacebookSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET fb_socialid = $1 , fb_email = $2, fb_status = $3, ismanualandsocialuser = $4 WHERE loginid = $5 returning *;`,
                [data.socialId, data.accountEmail, 1, true, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    connectTwitterSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET twitter_socialid = $1 , twitter_email = $2, twitter_status = $3, ismanualandsocialuser = $4 WHERE loginid = $5 returning *;`,
                [data.socialId, data.accountEmail, 1, true, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    connectInstagramSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET insta_socialid = $1 , insta_email = $2, insta_status = $3, ismanualandsocialuser = $4 WHERE loginid = $5 returning *;`,
                [data.socialId, data.accountEmail, 1, true, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    connectAppleSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET apple_socialid = $1 , apple_email = $2, apple_status = $3, ismanualandsocialuser = $4 WHERE loginid = $5 returning *;`,
                [data.socialId, data.accountEmail, 1, true, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    disconnectGoogleSocialAccount: function (data) {
        debugger;
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET google_status = $1 WHERE google_socialid = $2 returning *;`,
                [0, data.socialId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    disconnectFacebookSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET fb_status = $1 WHERE loginid = $2 returning *;`,
                [0, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    disconnectTwitterSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET twitter_status = $1 WHERE loginid = $2 returning *;`,
                [0, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    disconnectInstaSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET insta_status = $1 WHERE loginid = $2 returning *;`,
                [0, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    disconnectAppleSocialAccount: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`UPDATE ${db.schema}.t_lm_app_login_detail SET apple_status = $1 WHERE loginid = $2 returning *;`,
                [0, data.loginId])
                .then(function (results) {
                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserByFcmToken: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT loginid FROM ${db.schema}.t_lm_app_login_detail WHERE fcm_token = $1;`,
                [data.fcmToken])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findPendingUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail ${data.whereClause};`,
                [])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByMsisdn: function (msisdn) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where msisdn = $1 and status = 1;`,
                [msisdn])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findNewUserByMsisdn: function (msisdn) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where msisdn = $1;`,
                [msisdn])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findNewInactiveUserByMsisdn: function (msisdn) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where msisdn = $1;`,
                [msisdn])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByUserId: function (userId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where userid = $1 and status = 1;`,
                [userId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getFilteredUsers: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT loginid, name, fcm_token FROM ${db.schema}.t_lm_app_login_detail ${data.whereClause};`,
                [])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAppUserDetails: function (userId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT userid, custmainno, name, msisdn, email, login_type, socialid, status, userimage, homephone, gender, address,
             province, district, subdistrict, village, neighbourhood, hamlet, postalcode,is_email_verified,ismanualandsocialuser,
             fb_socialid, google_socialid, insta_socialid, twitter_socialid, apple_socialid, fb_email, google_email, insta_email, twitter_email, apple_email,
             fb_status, google_status, insta_status, twitter_status, apple_status, referral_id, ktp_no, branchname, branchid
             FROM ${db.schema}.t_lm_app_login_detail WHERE loginid = $1;`,
                [userId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAllUsersByCustMainNo: function (custmainno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * from ${db.schema}.t_lm_app_login_detail where custmainno = $1;`,
                [custmainno])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAllUsersByCustMainNoForCustGroupExcel: function (custmainno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT loginid, name, fcm_token from ${db.schema}.t_lm_app_login_detail where custmainno = $1;`,
                [custmainno])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getPointsByCustMainNo: function (custmainno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT l.loginid,w.cur_bal, w.red_point, w.total_point from 
            ${db.schema}.t_lm_app_login_detail l
            inner join
            ${db.schema}.t_wm_wallet_info w
            on l.loginid = w.login_id
            where l.custmainno = $1;`,
                [custmainno])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUsersWithSameCustMainNo: function (custmainno) {
        return new Promise(function (resolve, reject) {

            db.query(`select count(*),custmainno from ${db.schema}.t_lm_app_login_detail group by custmainno having count(*) > 1 and 
            custmainno is not null and custmainno != '' and custmainno ~ '^[0-9]*$';`,
                [custmainno])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDetailsByCustMainNo: function (custmainno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * from ${db.schema}.t_lm_app_login_detail where custmainno = $1;`,
                [custmainno])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDetailsByMsisdn: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * from ${db.schema}.t_lm_app_login_detail where msisdn = $1;`,
                [data.phone])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDetailsByMsisdnforCustomerGroupExcel: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT name, loginid, fcm_token  from ${db.schema}.t_lm_app_login_detail where msisdn = $1;`,
                [data.phone])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getUserDetailsByContractNo: function (contractno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT t2.name.t2.loginid,t2.fcm_token from ${db.schema}.t_rm_installments_points as t1
            join ${db.schema}.t_lm_app_login_detail as t2
            ON t2.loginid = t1.loginid
             where t1.contractno = $1;`,
                [contractno])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDetailsByContractNo: function (contractno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT t2.* from ${db.schema}.t_rm_installments_points as t1
            join ${db.schema}.t_lm_app_login_detail as t2
            ON t2.loginid = t1.loginid
             where t1.contractno = $1;`,
                [contractno])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDetailsByContractNoForCustGroupExcel: function (contractno) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT t2.name, t2.loginid, t2.fcm_token from ${db.schema}.t_rm_installments_points as t1
            join ${db.schema}.t_lm_app_login_detail as t2
            ON t2.loginid = t1.loginid
             where t1.contractno = $1;`,
                [contractno])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getUserDetailsByLoginId: async function (loginid) {
        return await new Promise(function (resolve, reject) {

            db.query(`SELECT * from ${db.schema}.t_lm_app_login_detail where loginid = $1;`,
                [loginid])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDetailsByUserId: function (userId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT u.*, r.module, r.accesstype FROM ${db.schema}.t_lm_app_login_detail u INNER JOIN ${db.schema}.t_rm_role_details r ON u.role = r.roleid where userid = $1;`,
                [userId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findInactiveUserByMsisdn: function (msisdn) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where msisdn = $1 and status = 0;`,
                [msisdn])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findInactiveUserByEmail: function (email) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where LOWER(email) = LOWER($1) and status = 0;`,
                [email])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByEmail: function (email) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where (LOWER(email) = LOWER($1) or LOWER(google_email) = LOWER($1) or LOWER(fb_email) = LOWER($1) or LOWER(insta_email) = LOWER($1) or LOWER(twitter_email) = LOWER($1)) and status = 1;`,
                [email])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getTotalCount: function (data) {
        return new Promise(function (resolve, reject) {
            db.query(`SELECT count(*) FROM ${db.schema}.t_lm_app_login_detail u ${data.whereClause};`, [])
                .then(function (results) {
                    console.log("count=" + results[0].count);
                    resolve(results[0].count);
                })
                .catch(function (err) {
                    console.log("error=" + err);
                    reject(0);
                });
        });
    },

    findUserBySocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where login_type = $1 and socialid = $2 and status = 1;`,
                [data.loginType, data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    authenticateFacebookSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where fb_socialid = $1 and fb_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    authenticateGoogleSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where google_socialid = $1 and google_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    authenticateTwitterSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where twitter_socialid = $1 and twitter_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    authenticateInstaSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where insta_socialid = $1 and insta_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    authenticateAppleSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where apple_socialid = $1 and apple_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByFacebookSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where loginid = $1 and fb_socialid = $2 and fb_status = 1 and status = 1;`,
                [data.loginId, data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByFacebookSocialIdAndEmailRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where ((fb_socialid = $1 and fb_status = 1) or (email = $2) or (google_email = $2) or (fb_email = $2) or (twitter_email = $2) or (insta_email = $2) ) and status = 1;`,
                [data.socialId, data.accountEmail])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByFacebookSocialIdRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where fb_socialid = $1 and fb_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByGoogleSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where loginid = $1 and google_socialid = $2 and google_status = 1 and status = 1;`,
                [data.loginId, data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByGoogleSocialIdAndEmailRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where ((google_socialid = $1 and google_status = 1) or (email = $2) or (google_email = $2) or (fb_email = $2) or (twitter_email = $2) or (insta_email = $2) ) and status = 1;`,
                [data.socialId, data.accountEmail])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByGoogleSocialIdRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where google_socialid = $1 and google_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByTwitterSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where loginid = $1 and twitter_socialid = $2 and twitter_status = 1 and status = 1;`,
                [data.loginId, data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByTwitterSocialIdAndEmailRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where ((twitter_socialid = $1 and twitter_status = 1) or (email = $2) or (google_email = $2) or (fb_email = $2) or (twitter_email = $2) or (insta_email = $2) ) and status = 1;`,
                [data.socialId, data.accountEmail])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByTwitterSocialIdRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where twitter_socialid = $1 and twitter_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByInstaSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where loginid = $1 and insta_socialid = $2 and insta_status = 1 and status = 1;`,
                [data.loginId, data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByInstaSocialIdAndEmailRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where ((insta_socialid = $1 and insta_status = 1) or (email = $2) or (google_email = $2) or (fb_email = $2) or (twitter_email = $2) or (insta_email = $2) ) and status = 1;`,
                [data.socialId, data.accountEmail])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByInstaSocialIdRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where insta_socialid = $1 and insta_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByAppleSocialId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where loginid = $1 and apple_socialid = $2 and apple_status = 1 and status = 1;`,
                [data.loginId, data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByAppleSocialIdAndEmailRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where (apple_socialid = $1 and apple_status = 1) and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByAppleSocialIdRegisteration: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail where apple_socialid = $1 and apple_status = 1 and status = 1;`,
                [data.socialId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getFbSocialIdOfUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT fb_socialid AS social_id FROM ${db.schema}.t_lm_app_login_detail where loginid = $1;`,
                [data.loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getGoogleSocialIdOfUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT google_socialid AS social_id FROM ${db.schema}.t_lm_app_login_detail where loginid = $1;`,
                [data.loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getTwitterSocialIdOfUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT twitter_socialid AS social_id FROM ${db.schema}.t_lm_app_login_detail where loginid = $1;`,
                [data.loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getInstaSocialIdOfUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT insta_socialid AS social_id FROM ${db.schema}.t_lm_app_login_detail where loginid = $1;`,
                [data.loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAppleSocialIdOfUser: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT apple_socialid AS social_id FROM ${db.schema}.t_lm_app_login_detail where loginid = $1;`,
                [data.loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByUserId: function (userId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail 
                      where login_type = 'cmsuser' and userid = $1 and status = 1;`,
                [userId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    findUserByLoginId: function (loginId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail 
                      where  loginid = $1 and status = 1;`,
                [loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getUserNameDetailsByLoginId: function (loginId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail 
                      where  loginid = $1;`,
                [loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    findUserByCustMainNo: function (loginId) {
        return new Promise(function (resolve, reject) {

            db.query(`SELECT * FROM ${db.schema}.t_lm_app_login_detail 
                      where  custmainno = $1 and status = 1;`,
                [loginId])
                .then(function (results) {

                    resolve(results[0]);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteUser: function (loginid) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
                      WHERE loginid=$1;`,
                [loginid])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteAppUserByEmail: function (email) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
                      WHERE email=$1 OR google_email=$1 OR fb_email=$1 OR insta_email=$1 OR twitter_email=$1;`,
                [email])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteAppUserByPhone: function (phone) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
                      WHERE msisdn=$1;`,
                [phone])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteAppUserByName: function (name) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
                      WHERE LOWER(name)=LOWER($1);`,
                [name])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteUserByUserId: function (userid) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
WHERE userid=$1;`,
                [userid])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteMultipleUsers: function (loginIdStr) {
        return new Promise(function (resolve, reject) {

            db.query(`DELETE FROM ${db.schema}.t_lm_app_login_detail
WHERE loginid IN (${loginIdStr});`,
                [])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getFMCRegisteredUsers: function () {
        return new Promise(function (resolve, reject) {

            db.query(`Select * FROM ${db.schema}.t_lm_app_login_detail
            WHERE login_type != 'cmsuser' and status = 1;`,
                [])
                .then(function (results) {

                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDeviceInfoByLoginId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`select u.name, u.msisdn, d.* FROM 
            ${db.schema}.t_lm_app_login_detail u inner join
            ${db.schema}.t_lm_device_info d
            on u.loginid = d.loginid
            WHERE d.loginid = $1;`,
                [data.loginId])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getUserDeviceInfoByDeviceId: function (data) {
        return new Promise(function (resolve, reject) {

            db.query(`select deviceid FROM ${db.schema}.t_lm_device_info
            WHERE loginid = $1 and deviceid = $2;`,
                [data.loginid, data.deviceid])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAllDeviceInfo: function (data) {
        return new Promise(function (resolve, reject) {
            db.query(`select u.loginid, u.name, u.msisdn, d.lastlogintime, d.deviceid FROM 
            ${db.schema}.t_lm_app_login_detail u inner join
            ${db.schema}.t_lm_device_info d
            on u.loginid = d.loginid
            ${data.whereClause}
             order by u.insertdate desc
             LIMIT $1 OFFSET $2;`,
                [data.limit, data.offset])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAllDeviceInfoCount: function (data) {
        return new Promise(function (resolve, reject) {
            db.query(`select count(*) FROM 
            ${db.schema}.t_lm_app_login_detail u inner join
            ${db.schema}.t_lm_device_info d
            on u.loginid = d.loginid
            ${data.whereClause};`,
                [])
                .then(function (results) {
                    resolve(results);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getOauth2Token(loginId) {
        return new Promise(function (resolve, reject) {
            let baseUrl = env.cms.baseUrl || "http://fmcdev001.southeastasia.cloudapp.azure.com/";
            logger.info("Auth token to be generated for  : ", loginId);
            request.post({
                url: baseUrl + 'cms/oauth/token',
                rejectUnauthorized: false,
                form: {
                    username: loginId,
                    password: 'msisdn',
                    client_id: 'FIFUser',
                    client_secret: 'FIFUser',
                    grant_type: 'password'
                }
            },
                function (err, httpResponse, body) {

                    if (!err) {
                        try {
                            logger.info("Token api response : ", body);
                            body = JSON.parse(body);
                            if (body.accessToken) {
                                return resolve(body.accessToken);
                            } else {
                                return reject(new Error('invalid credentials.'));
                            }
                        } catch (err) {
                            logger.error('Error in token api response:' + err);
                            return reject(new Error('invalid credentials.'));
                        }
                    } else {
                        return reject(new Error('invalid credentials.'));
                    }
                });

        });

    }

}