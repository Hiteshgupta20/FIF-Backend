const Promise = require('promise');
const User = require('../models/user');
const Roles = require('../models/roles');
const OtpService = require('../services/otp');
const util = require('../controllers/util');
const bcrypt = require('bcrypt');
const auth = require('../config/authorization');
const request = require('request');
const env = require('../config/env/environment');
const TokenModel = require('../middleware/oauth/model');
const logger = require('../config/logging');
const RolesService = require('../services/roles');
const PointsService = require('../services/pointHistory');
const PointManagement = require('../services/pointManagement');
const CustService = require('../services/customerProfile');
const NotificationService = require('../services/notification');
const ContractService = require('../services/contracts');
const activityLogs = require('../services/activityLogs');
const AppConstants = require('../config/appConstants');
const CustomerModel = require('../models/customerProfile');
const _ = require('lodash');

module.exports = {

    registerUser: async function (payload) {
        return new Promise(async (resolve, reject) => {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                let checkData = {
                    socialId: payload.socialId,
                    accountEmail: payload.email
                }
                let user = await User.findUserByMsisdn(payload.msisdn);
                if (user) {
                    return reject(new Error("No. HP sudah terkait dengan akun lainnya"))
                }
                if (payload.login_type == "manual") {
                    if (payload.email) {
                        user = await User.findUserByEmail(payload.email);
                        if (user) {
                            // return reject(new Error("Email id is already linked with another account."))
                            //to be changed
                            return reject(new Error("Email ID telah di gunakan/ditautkan dengan akun lain"));
                        }
                    }
                    else {
                        payload.email = null;
                    }
                }
                else if (payload.login_type == "google") {
                    if (payload.socialId) {
                        if (payload.email) {
                            user = await User.findUserByGoogleSocialIdAndEmailRegisteration(checkData);
                        } else {
                            user = await User.findUserByGoogleSocialIdRegisteration(payload);
                        }
                        if (user) {
                            // return reject(new Error("Email id is already linked with another account."))
                            //to be changed
                            return reject(new Error("Email ID telah di gunakan/ditautkan dengan akun lain"));
                        }
                    } else {
                        return reject(new Error("Social ID is missing"));
                    }
                }
                else if (payload.login_type == "facebook") {
                    if (payload.socialId) {
                        if (payload.email) {
                            user = await User.findUserByFacebookSocialIdAndEmailRegisteration(checkData);
                        } else {
                            user = await User.findUserByFacebookSocialIdRegisteration(payload);
                        }

                        if (user) {
                            // return reject(new Error("Email id is already linked with another account."))
                            //to be changed
                            return reject(new Error("Email ID telah di gunakan/ditautkan dengan akun lain"));
                        }
                    } else {
                        return reject(new Error("Social ID is missing"));
                    }
                }
                else if (payload.login_type == "twitter") {
                    if (payload.socialId) {
                        if (payload.email) {
                            user = await User.findUserByTwitterSocialIdAndEmailRegisteration(checkData);
                        } else {
                            user = await User.findUserByTwitterSocialIdRegisteration(payload);
                        }

                        if (user) {
                            // return reject(new Error("Email id is already linked with another account."))
                            //to be changed
                            return reject(new Error("Email ID telah di gunakan/ditautkan dengan akun lain"));
                        }
                    } else {
                        return reject(new Error("Social ID is missing"));
                    }
                }
                else if (payload.login_type == "instagram") {
                    if (payload.socialId) {
                        if (payload.email) {
                            user = await User.findUserByInstaSocialIdAndEmailRegisteration(checkData);
                        } else {
                            user = await User.findUserByInstaSocialIdRegisteration(payload);
                        }

                        if (user) {
                            // return reject(new Error("Email id is already linked with another account."))
                            //to be changed
                            return reject(new Error("Email ID telah di gunakan/ditautkan dengan akun lain"));
                        }
                    } else {
                        return reject(new Error("Social ID is missing"));
                    }
                }
                else if (payload.login_type == "apple") {
                    if (payload.socialId) {
                        if (payload.email) {
                            user = await User.findUserByAppleSocialIdAndEmailRegisteration(checkData);
                        } else {
                            user = await User.findUserByAppleSocialIdRegisteration(payload);
                        }

                        if (user) {
                            // return reject(new Error("Email id is already linked with another account."))
                            //to be changed
                            return reject(new Error("Email ID telah di gunakan/ditautkan dengan akun lain"));
                        }
                    } else {
                        return reject(new Error("Social ID is missing"));
                    }
                }
                else {
                    return reject(new Error("Login type is missing"));
                }
                //check if user  already exists with email / msisdn with pending status
                let users = await findPendingRegistrationUser(payload);

                //remove partial registered users
                users.forEach((user) => {
                    User.deleteUser(user.loginid);
                })

                let data = await prepareRegisterData(payload);

                //create a new user
                userInfo = await User.createUser(data);
                if (userInfo) {
                    let date = util.getTimestamp();
                    let initData = {
                        loginId: userInfo.loginid
                    }
                    let deviceInfo = {
                        loginid: userInfo.loginid,
                        insertdate: date,
                        deviceid: payload.device_id || null
                    }
                    try {
                        let initUser = await PointsService.initialEntry(initData);
                        if (deviceInfo.deviceid) {
                            let deviceResponse = await User.createDeviceInfo(deviceInfo);
                        }
                        let accessToken = null;//await this.getOauth2Token(userInfo.loginid);
                        let obj = {
                            "access-token": accessToken,
                            "info": {
                                userName: userInfo.name,
                                msisdn: userInfo.msisdn,
                                email: userInfo.email,
                                userid: userInfo.loginid,
                                userimage: userInfo.userimage,
                                loginType: payload.login_type,
                                fb_status: userInfo.fb_status || 0,
                                google_status: userInfo.google_status || 0,
                                twitter_status: userInfo.twitter_status || 0,
                                insta_status: userInfo.insta_status || 0,
                                apple_status: userInfo.apple_status || 0,
                                fb_socialid: userInfo.fb_socialid,
                                google_socialid: userInfo.google_socialid,
                                twitter_socialid: userInfo.twitter_socialid,
                                insta_socialid: userInfo.insta_socialid,
                                apple_socialid: userInfo.apple_socialid
                            }
                        }
                        resolve(obj);
                    } catch (err) {
                        resolve(err);
                    }
                }
            } catch (err) {

                if (err.code === "23505") {
                    //to be changed
                    err = new Error("Mohon maaf, E-mail tersebut telah terdaftar, mohon gunakan E-mail lain");
                }
                reject(err);
            }
        });
    },

    updateUser: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                let date = util.getTimestamp();
                data.loginid = payload.loginId;
                data.userimage = payload.userImage;
                data.name = payload.userName;
                data.email = String(payload.email).toLowerCase();
                data.msisdn = payload.msisdn;
                data.homephone = payload.homePhone;
                data.gender = payload.gender;
                data.address = payload.address;
                data.province = payload.province;
                data.district = payload.district;
                data.subdistrict = payload.subDistrict;
                data.village = payload.village;
                data.neighbourhood = payload.neighbourhood;
                data.hamlet = payload.hamlet;
                data.postalcode = payload.postalCode;
                //create a new user
                userInfo = await User.updateUser(data);
                if (userInfo) {
                    if (!isEmpty(payload.userImage) && !isEmpty(payload.userName) && !isEmpty(payload.email)
                        && !isEmpty(payload.msisdn) && !isEmpty(payload.homePhone) && !isEmpty(payload.gender)
                        && !isEmpty(payload.address) && !isEmpty(payload.province) && !isEmpty(payload.district)
                        && !isEmpty(payload.subDistrict) && !isEmpty(payload.village) && !isEmpty(payload.neighbourhood)
                        && !isEmpty(payload.hamlet) && !isEmpty(payload.postalCode)) {

                        let profilePointsStatus = await User.getCompleteProfilePointsStatus(data);
                        if (profilePointsStatus && profilePointsStatus.length == 0) {
                            data.isprofilecomplete = 1;
                            let isProfileComplete = await User.updateUserCompleteProfileStatus(data);
                            let userPoints = await addActivityPoints(payload);
                            userInfo.pointsAdded = userPoints;
                        }
                    }
                    resolve(userInfo);
                }
            } catch (err) {
                if (err.code === "23505") {
                    //to be changed
                    // err = new Error("User already exists with provided details.");
                    err = new Error("Mohon maaf, E-mail tersebut telah terdaftar, mohon gunakan E-mail lain");
                }
                reject(err);
            }
        });
    },

    updateAppVersion: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                data.loginid = payload.loginId;
                data.appversion = payload.appVersion;
                //update app version
                userInfo = await User.updateAppVersion(data);
                if (userInfo) {
                    resolve(userInfo);
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    getUserDeviceInfo: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                data.loginId = payload.loginId;
                //update app version
                let userDeviceInfo = await User.getUserDeviceInfoByLoginId(data);
                if (userDeviceInfo) {
                    resolve(userDeviceInfo);
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    getAllDeviceInfo: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                let whereClause = [];
                data.limit = payload.limit || 10;
                data.offset = payload.page || 0;

                if (data.offset < 0)
                    data.offset = 0;
                let searchParams = payload.searchParams;
                if (searchParams) {
                    if (searchParams.name) {
                        whereClause.push(`u.name ilike '%${searchParams.name}%'`);
                    }
                    if (searchParams.msisdn) {
                        whereClause.push(`u.msisdn ilike '%${searchParams.msisdn}%'`);
                    }
                    if (searchParams.custmainno) {
                        whereClause.push(`u.custmainno ilike '%${searchParams.custmainno}%'`);
                    }
                    if (searchParams.referral_id) {
                        whereClause.push(`u.referral_id ilike '%${searchParams.referral_id}%'`);
                    }
                    if (searchParams.device_id) {
                        whereClause.push(`d.deviceid ilike '%${searchParams.device_id}%'`);
                    }
                }
                whereClause = whereClause.join(" and ");
                if (whereClause.length > 0) {
                    whereClause = "where " + whereClause;
                }
                data.whereClause = whereClause;
                let allDeviceInfo = await User.getAllDeviceInfo(data);
                if (allDeviceInfo) {
                    resolve(allDeviceInfo);
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    getAllDeviceInfoCount: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                let whereClause = [];
                let searchParams = payload.searchParams;
                if (searchParams) {
                    if (searchParams.name) {
                        whereClause.push(`u.name ilike '%${searchParams.name}%'`);
                    }
                    if (searchParams.msisdn) {
                        whereClause.push(`u.msisdn ilike '%${searchParams.msisdn}%'`);
                    }
                    if (searchParams.custmainno) {
                        whereClause.push(`u.custmainno ilike '%${searchParams.custmainno}%'`);
                    }
                    if (searchParams.referral_id) {
                        whereClause.push(`u.referral_id ilike '%${searchParams.referral_id}%'`);
                    }
                    if (searchParams.device_id) {
                        whereClause.push(`u.deviceid ilike '%${searchParams.device_id}%'`);
                    }
                }
                whereClause = whereClause.join(" and ");
                if (whereClause.length > 0) {
                    whereClause = "where " + whereClause;
                }
                data.whereClause = whereClause;
                let allDeviceInfoCount = await User.getAllDeviceInfoCount(data);
                if (allDeviceInfoCount) {
                    resolve(allDeviceInfoCount);
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    updateCustMainNo: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                data.loginid = payload.loginId;
                data.custmainno = payload.custMainNo;
                data.ktpno = payload.ktpNo
                data.branchname = payload.branchName
                data.branchid = payload.branchId
                //create a new user
                // userinfo = await User.updatebranchdetails(data)
                userInfo = await User.updateCustMainNo(data);
                if (userInfo) {
                    resolve(userInfo);
                }
            } catch (err) {
                if (err.code === "23505") {
                    //to be changed
                    err = new Error("This KTP No. is not associated with this account.");
                }
                reject(err);
            }
        });
    },

    updateFcmToken: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                data.loginId = payload.loginId;
                data.fcmToken = payload.fcmToken;
                userInfo = await User.updateFirebaseToken(data);
                if (userInfo) {
                    resolve(userInfo);
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    updateLastActivity: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                data.loginid = payload.loginId;
                data.lastActivity = payload.lastActivity;
                //create a new user
                let userActivity = await User.updateLastActivity(data);
                if (userActivity) {
                    resolve(userActivity);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    },

    updateCustTotalInstallments: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                data.loginid = payload.loginId;
                data.custtotalinstallments = payload.custTotalInstallments;
                //create a new user
                userInfo = await User.updateCustTotalInstallments(data);
                if (userInfo) {
                    resolve(userInfo);
                }
            } catch (err) {
                if (err.code === "23505") {
                    //to be changed
                    err = new Error("This KTP No. is not associated with this account.");
                }
                reject(err);
            }
        });
    },

    registerCmsUser: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                let user = await User.findUserByUserId(payload.userid);
                if (user) {
                    //to be changed
                    return reject(new Error("NPK/NPO ID is already linked with another account."))
                }

                let data = await prepareCmsRegisterData(payload);

                //create a new user

                userInfo = await User.createCmsUser(data);
                if (userInfo) {
                    let obj = {
                        name: userInfo.name,
                        userid: userInfo.userid
                    }
                    resolve(obj);
                }
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    cmsUserBulkUpload: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {
                let payloadData = payload.data;
                let res = [];
                let date = util.getTimestamp();
                let userInfo;
                let existingRoles = await Roles.getAllRolesList({});
                existingRoles = existingRoles.data || [];
                payloadData.forEach(async (record, index, obj) => {
                    let data = {};
                    userInfo = null;
                    let status = record.status;
                    status = status.toLowerCase();
                    if (status == 'active') {
                        status = 1;
                    } else if (status == 'inactive') {
                        status = 0
                    }
                    data.userId = record.userId || "";
                    data.name = record.userName || "";
                    data.loginType = record.loginType || "cmsuser";
                    data.status = status;

                    existingRoles.forEach((role) => {
                        if (record.roleId == role.id) {
                            data.role = record.roleId;
                        } else {
                            data.role = "";
                        }
                    })

                    data.insertDate = date;
                    data.lastLoginDate = null;
                    data.startdate1 = record.startDate;
                    data.startdate = "";
                    if (data.startdate1) {
                        var chunks1 = data.startdate1.split('-');
                        data.startdate = chunks1[1] + '-' + chunks1[0] + '-' + chunks1[2];
                    }
                    data.enddate1 = record.endDate;
                    data.enddate = "";
                    if (data.enddate1) {
                        var chunks2 = data.enddate1.split('-');
                        data.enddate = chunks2[1] + '-' + chunks2[0] + '-' + chunks2[2];
                    }
                    data.startdateformat = new Date(record.startDate);
                    data.enddateformat = new Date(record.endDate);
                    //create a new user
                    if ((status == 0 || status == 1) && data.startdateformat != "Invalid Date" && data.enddateformat != "Invalid Date" && data.userId != '' && data.name != '' && data.role) {
                        userInfo = await User.cmsUserBulkUpload(data).catch((err) => {
                            logger.error(err);
                        });
                    }
                    if (userInfo) {
                        res.push(userInfo);
                    }
                    if (index == obj.length - 1) {
                        if (obj.length != res.length) {
                            reject(new Error("Due to invalid data, some of the entries were not uploaded. Please check the data and try again."))
                        } else {
                            resolve(null);
                        }
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    },

    getUserDetails: async function (userId) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getAppUserDetails(userId)
                    .then(async function (result) {
                        let data = {
                            loginId: userId
                        };
                        console.log(data);
                        // result['fbSocialId'] = result['fb_socialid'];
                        // result['googleSocialId '] = result['google_socialid'];
                        // result['isFbConn'] = result['fb_status'] || 0;
                        // result['isGoogleConn '] = result['google_status'] || 0;
                        // result['loginType '] = result['login_type'];
                        let contractHis = await ContractService.getLastSyncContractsHistory(data);
                        console.log(contractHis);
                        if (contractHis && contractHis[0] && contractHis[0]['insertdate']) {
                            result['lastSyncedDate'] = util.formatTimeStamp(contractHis[0]['insertdate']);
                        }

                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getAllUsersByCustMainNo: async function (custMainNo) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getAllUsersByCustMainNo(custMainNo)
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getUserPointsByCustMainNo: async function (custMainNo) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getPointsByCustMainNo(custMainNo)
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getUsersBySameCustMainNo: async function () {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getUsersWithSameCustMainNo()
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getUserDetailsByCustMainNo: async function (custMainNo) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getUserDetailsByCustMainNo(custMainNo)
                    .then(async function (result) {
                        resolve(result[0]);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getAllUsersDetailsByCustMainNo: async function (custMainNo) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getUserDetailsByCustMainNo(custMainNo)
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getUserDetailsByPhoneNo: async function (data) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getUserDetailsByPhoneNo(data)
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                reject(new Error(err));
            }
        });
    },
    getUserDetailsByMsisdn: async function (data) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getUserDetailsByMsisdn(data)
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                reject(new Error(err));
            }
        });
    },

    getUserId: async function (data) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                // let user = await User.getAppUserDetails(userId);
                User.getUserDetailsByCustMainNo(custMainNo)
                    .then(async function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    getCmsUserDetails: async function (userId) {
        return new Promise(async function (resolve, reject) {
            try {
                //check if user  already exists with email / msisdn with status 1 ( registered user ).
                let user = await User.getUserDetailsByUserId(userId);
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    updateCmsUser: async function (payload) {
        return new Promise(async function (resolve, reject) {
            try {

                let data = {};
                let date = util.getTimestamp();
                data.userid = payload.userId;
                data.loginid = payload.loginId;
                data.name = payload.userName;
                data.status = payload.status;
                data.role = payload.roleId;
                data.startdate = payload.startDate;
                data.enddate = payload.endDate;

                //create a new user
                userInfo = await User.updateCmsUser(data);
                if (userInfo) {
                    resolve(userInfo);
                } else {
                    reject(new Error("Not able to update details"));
                }
            } catch (err) {
                if (err.code === "23505") {
                    err = new Error("User already exists with provided details.");
                }
                reject(err);
            }
        });
    },

    // deleteCmsUser: async function(id) {
    //     return new Promise(function(resolve, reject) {

    //         User.deleteUserByUserId(id)
    //             .then(function(result) {
    //                 resolve(result);
    //             })
    //             .catch(function(err) {
    //                 reject(err);
    //             });
    //     });
    // },

    deleteAppUser: async function (payload) {
        return new Promise(async function (resolve, reject) {
            let data = {};
            let whereClause = [];
            whereClause.push(`status = '1'`);
            whereClause.push(`login_type != 'cmsuser'`);
            if (payload) {
                if (payload.name) {
                    whereClause.push(`name = '${payload.name}'`);
                }
                if (payload.phone) {
                    whereClause.push(`msisdn = '${payload.phone}'`);
                }
                if (payload.email) {
                    whereClause.push(`email = '${payload.email}'`);
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            let matchedUsers = await CustomerModel.listCustomerUserIdsForDeletion(data);
            if (matchedUsers.data && matchedUsers.data.length > 0) {
                let usersForDeletion = matchedUsers.data;
                let loginIdArr = [];
                for (let i = 0; i < usersForDeletion.length; i++) {
                    loginIdArr.push(usersForDeletion[i].loginid);
                }
                let loginIdStr = loginIdArr.join(',');
                User.deleteMultipleUsers(loginIdStr)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                reject(new Error('No user found'));
            }

        });
    },

    deleteAppUserByName: async function (payload) {
        return new Promise(function (resolve, reject) {
            let name = payload.value || '';
            User.deleteAppUserByName(name)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteAppUserByEmail: async function (payload) {
        return new Promise(function (resolve, reject) {
            let email = payload.value || '';
            User.deleteAppUserByEmail(email)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteAppUserByPhone: async function (payload) {
        return new Promise(function (resolve, reject) {
            let phone = payload.value || '';
            User.deleteAppUserByPhone(phone)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getCmsUsersList: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.isExport = payload.isExport || 0;
            let prefixQuery = 'u.';
            data.orderByClause = util.formatOrderByClause(payload, prefixQuery);


            if (data.offset < 0) {
                data.offset = 0;
            }

            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.userId) {
                    whereClause.push(`u.userid ilike '%${searchParams.userId}%'`)
                }
                if (searchParams.name) {
                    whereClause.push(`u.name ilike '%${searchParams.name}%'`)
                }
                if (searchParams.roleId) {
                    whereClause.push(`u.role = '${searchParams.roleId}'`)
                }
            }
            whereClause.push(`u.login_type = 'cmsuser'`);
            // whereClause.push(`u.status = 1`);
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                User.getCmsUsersList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } else {
                User.getAllCmsUsersList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        });
    },

    authenticateAppUser: async function (payload) {
        return new Promise(async (resolve, reject) => {

            try {
                let input = payload.input || "";
                let inputType = payload.inputType || "";  //input type will be email / msisdn/cmsuser
                let pwd = payload.password || "";
                let userInfo;
                if (inputType === "email" && input) {
                    userInfo = await User.findUserByEmail(input);
                } else if ((inputType === "msisdn" || inputType === "phone") && input) {
                    if (input[0] !== "0") {
                        input = "0" + input;
                    }
                    userInfo = await User.findUserByMsisdn(input);
                } else {
                    // return reject(new Error("Invalid user details"));
                    return reject(new Error("Detail pengguna tidak valid"));
                }
                if (userInfo) {
                    let date = util.getTimestamp();
                    let userDeviceData = {
                        loginid: userInfo.loginid,
                        deviceid: payload.device_id || null
                    }

                    if (userDeviceData.deviceid) {
                        let userOldDeviceInfo = await User.getUserDeviceInfoByDeviceId(userDeviceData);
                        let deviceInfo = {
                            loginid: userInfo.loginid,
                            insertdate: date,
                            deviceid: payload.device_id || null
                        }
                        if (userOldDeviceInfo.length == 0) {
                            try {
                                let deviceResponse = await User.createDeviceInfo(deviceInfo);
                            }
                            catch (err) {
                                logger.error('Error while inserting device info:', err);
                            }
                        }
                        else {
                            try {
                                let updatedDeviceInfo = User.updateDeviceInfo(deviceInfo);
                            }
                            catch (err) {
                                logger.error('Error while updating device info:', err);
                            }
                        }
                    }

                    // if (payload.device_id) {
                    //     deviceNewArr.push({
                    //         "lastlogintime": date,
                    //         "deviceid": payload.device_id
                    //     })
                    // }
                    // console.log(deviceNewArr);
                    payload.loginid = userInfo.loginid;
                    payload.fcmtoken = payload.fcmtoken || null;
                    // payload.deviceInfo = JSON.stringify(deviceNewArr);
                    payload.lastlogindate = date;

                    User.updateFcmToken(payload)
                    if (userInfo.login_type === 'manual' || userInfo.ismanualandsocialuser) {
                        let isValidPassword = await verifyPassword(pwd, userInfo);
                        if (isValidPassword) {
                            let accessToken = await this.getOauth2Token(userInfo.loginid);
                            let obj = {
                                "access-token": accessToken,
                                "info": {
                                    userName: userInfo.name,
                                    msisdn: userInfo.msisdn,
                                    email: userInfo.email,
                                    userid: userInfo.loginid,
                                    userimage: userInfo.userimage,
                                    loginType: userInfo.login_type,
                                    fb_status: userInfo.fb_status || 0,
                                    google_status: userInfo.google_status || 0,
                                    twitter_status: userInfo.twitter_status || 0,
                                    insta_status: userInfo.insta_status || 0,
                                    apple_status: userInfo.apple_status || 0,
                                    fb_socialid: userInfo.fb_socialid,
                                    google_socialid: userInfo.google_socialid,
                                    twitter_socialid: userInfo.twitter_socialid,
                                    insta_socialid: userInfo.insta_socialid,
                                    apple_socialid: userInfo.apple_socialid
                                }
                            }
                            return resolve(obj);
                        } else {
                            // return reject(new Error("Invalid password."));
                            return reject(new Error("Kata sandi tidak valid"));
                        }
                    } else if (userInfo.login_type === 'google') {
                        // return reject(new Error("Entered email / mobile no. is associated with Google account.Please login using Google."));
                        return reject(new Error("Email/ No. HP yang dimasukkan terkait dengan e-mail Google. Mohon masuk dengan Google."));
                    } else if (userInfo.login_type === 'facebook') {
                        // return reject(new Error("Entered email / mobile no. is associated with Facebook account.Please login using Facebook."));
                        return reject(new Error("Email/ No. HP yang dimasukkan terkait dengan e-mail Facebook. Mohon masuk dengan Facebook."));
                    }
                } else {
                    return reject(new Error("Mohon maaf, Email/Nomor Handphone yang anda masukkan belum terdaftar di aplikasi FIFGROUP MOBILE CUSTOMER. Silahkan lakukan registrasi terlebih dahulu."));
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    authenticateSocialMediaUser: async function (payload) {
        return new Promise(async (resolve, reject) => {

            try {
                let data = {};
                data.socialId = payload.socialId;
                data.loginType = payload.login_type; //google or facebook or manual
                let user;
                if (data.loginType == "google") {
                    user = await User.authenticateGoogleSocialId(data);
                }
                else if (data.loginType == "facebook") {
                    user = await User.authenticateFacebookSocialId(data)
                }
                else if (data.loginType == "twitter") {
                    user = await User.authenticateTwitterSocialId(data)
                }
                else if (data.loginType == "instagram") {
                    user = await User.authenticateInstaSocialId(data)
                }
                else if (data.loginType == "apple") {
                    user = await User.authenticateAppleSocialId(data)
                }
                // let user = await User.findUserBySocialId(data);
                if (user) {
                    let date = util.getTimestamp();
                    payload.loginid = user.loginid;
                    payload.fcmtoken = payload.fcmtoken || null;
                    payload.lastlogindate = date;

                    User.updateFcmToken(payload)
                    //authenticate user by social Id using Oauth2
                    let accessToken = await this.getOauth2Token(user.loginid);
                    let obj = {
                        "access-token": accessToken,
                        "info": {
                            userName: user.name,
                            msisdn: user.msisdn,
                            email: user.email,
                            userid: user.loginid,
                            userimage: user.userimage,
                            loginType: payload.login_type,
                            fb_status: user.fb_status || 0,
                            google_status: user.google_status || 0,
                            twitter_status: user.twitter_status || 0,
                            insta_status: user.insta_status || 0,
                            apple_status: user.apple_status || 0,
                            fb_socialid: user.fb_socialid,
                            google_socialid: user.google_socialid,
                            twitter_socialid: user.twitter_socialid,
                            insta_socialid: user.insta_socialid,
                            apple_socialid: user.apple_socialid
                        }
                    }
                    resolve(obj);
                } else {
                    reject(util.apiError("login-via-socialId", 155, "Invalid credentials."));
                }
            } catch (err) {
                reject(util.apiError("login-via-socialId", 155, err.message));
            }
        });
    },

    connectSocialMedia: async function (payload) {
        return new Promise(async (resolve, reject) => {

            try {
                let data = {};
                data.socialId = payload.socialId; //social account id
                data.accountType = payload.accountType; //facebook or google
                data.loginType = payload.loginType; //google or facebook or manual
                data.accountEmail = payload.accountEmail || null;
                data.loginId = payload.loginId; //unique login id of user
                let validUser = await User.findUserByLoginId(data.loginId);
                let userExistWithSocialID = false;
                let lastSocIdVal = {};
                if (validUser.custmainno) {
                    let existingUsers = await getUsersWithSameCustMainNo(validUser.custmainno);
                    if (existingUsers.length > 1) {

                        for (let i = 0; i < existingUsers.length; i++) {

                            if (existingUsers[i].loginid != data.loginId) {
                                let thisData = {
                                    loginId: existingUsers[i].loginid
                                }

                                if (data.accountType == "google") {
                                    lastSocIdVal = await User.getGoogleSocialIdOfUser(thisData);
                                }
                                else if (data.accountType == "facebook") {
                                    lastSocIdVal = await User.getFbSocialIdOfUser(thisData);
                                }
                                else if (data.accountType == "twitter") {
                                    lastSocIdVal = await User.getTwitterSocialIdOfUser(thisData);
                                }
                                else if (data.accountType == "instagram") {
                                    lastSocIdVal = await User.getInstaSocialIdOfUser(thisData);
                                }
                                if (lastSocIdVal.social_id) {
                                    userExistWithSocialID = true;
                                    break;
                                }
                            }

                        }
                    }
                }

                if (validUser) {
                    let isLogout = false;
                    data.loginType == "manual" ? isLogout = false : isLogout = true;
                    let prUser = {};
                    if (data.accountType == "google") {
                        if (data.accountEmail) {
                            prUser = await User.findUserByGoogleSocialIdAndEmailRegisteration(data);
                        } else {
                            prUser = await User.findUserByGoogleSocialIdRegisteration(data);
                        }
                    }
                    else if (data.accountType == "facebook") {
                        if (data.accountEmail) {
                            prUser = await User.findUserByFacebookSocialIdAndEmailRegisteration(data);
                        } else {
                            prUser = await User.findUserByFacebookSocialIdRegisteration(data);
                        }
                    }
                    else if (data.accountType == "twitter") {
                        if (data.accountEmail) {
                            prUser = await User.findUserByTwitterSocialIdAndEmailRegisteration(data);
                        } else {
                            prUser = await User.findUserByTwitterSocialIdRegisteration(data);
                        }
                    }
                    else if (data.accountType == "instagram") {
                        if (data.accountEmail) {
                            prUser = await User.findUserByInstaSocialIdAndEmailRegisteration(data);
                        } else {
                            prUser = await User.findUserByInstaSocialIdRegisteration(data);
                        }
                    }
                    else if (data.accountType == "apple") {
                        if (data.accountEmail) {
                            prUser = await User.findUserByAppleSocialIdAndEmailRegisteration(data);
                        } else {
                            prUser = await User.findUserByAppleSocialIdRegisteration(data);
                        }
                    }
                    else {
                        return reject(new Error("Account type is missing"));
                    }
                    if (prUser && prUser.loginid && prUser.loginid != data.loginId) {
                        return reject(new Error("This social ID/Email is already associated with another account."));
                    }
                    let user = {};
                    if (data.accountType == "facebook") {
                        user = await User.findUserByFacebookSocialId(data)
                    }
                    else if (data.accountType == "google") {
                        user = await User.findUserByGoogleSocialId(data);
                    }
                    else if (data.accountType == "twitter") {
                        user = await User.findUserByTwitterSocialId(data);
                    }
                    else if (data.accountType == "instagram") {
                        user = await User.findUserByInstaSocialId(data);
                    }
                    else if (data.accountType == "apple") {
                        user = await User.findUserByAppleSocialId(data);
                    }
                    if (user) {
                        user.isLogout = false;
                        return resolve(user);
                    }
                    let date = util.getTimestamp();
                    let conn = {};
                    let lastSocialIdValue = {};
                    if (data.accountType == "facebook") {
                        try {
                            lastSocialIdValue = await User.getFbSocialIdOfUser(data);
                            conn = await User.connectFacebookSocialAccount(data);
                            if (data.loginType == "facebook") {
                                conn.isLogout = true;
                            }
                        }
                        catch (err) {
                            return reject(new Error(err));
                        }
                    }
                    else if (data.accountType == "google") {
                        try {
                            lastSocialIdValue = await User.getGoogleSocialIdOfUser(data);
                            conn = await User.connectGoogleSocialAccount(data);
                            if (data.loginType == "google") {
                                conn.isLogout = true;
                            }
                        }
                        catch (err) {
                            return reject(new Error(err));
                        }
                    }
                    else if (data.accountType == "twitter") {
                        try {
                            lastSocialIdValue = await User.getTwitterSocialIdOfUser(data);
                            conn = await User.connectTwitterSocialAccount(data);
                            if (data.loginType == "twitter") {
                                conn.isLogout = true;
                            }
                        }
                        catch (err) {
                            return reject(new Error(err));
                        }
                    }
                    else if (data.accountType == "instagram") {
                        try {
                            lastSocialIdValue = await User.getInstaSocialIdOfUser(data);
                            conn = await User.connectInstagramSocialAccount(data);
                            if (data.loginType == "instagram") {
                                conn.isLogout = true;
                            }
                        }
                        catch (err) {
                            return reject(new Error(err));
                        }
                    }
                    else if (data.accountType == "apple") {
                        try {
                            lastSocialIdValue = await User.getAppleSocialIdOfUser(data);
                            conn = await User.connectAppleSocialAccount(data);
                            if (data.loginType == "apple") {
                                conn.isLogout = true;
                            }
                        }
                        catch (err) {
                            return reject(new Error(err));
                        }
                    }
                    else {
                        return reject(new Error("Invalid Account Type"));
                    }
                    if (conn) {
                        if (lastSocialIdValue) {
                            if (!lastSocialIdValue.social_id && data.accountType != "apple" && !userExistWithSocialID) {
                                let userPoints = await addSocialMediaActivityPoints(conn);
                                if (userPoints) {
                                    conn.pointsAdded = userPoints;
                                }
                            } else {
                                logger.info('points not to be added')
                            }
                        }
                    }
                    return resolve(conn);
                } else {
                    return reject(new Error("Invalid User"));
                }
            } catch (err) {
                if (err.code == 23505) {
                    return reject(util.apiError("connect-social-media", 155, 'This social ID is already associated with another account.'));
                }
                return reject(util.apiError("connect-social-media", 155, err.message));
            }
        });
    },

    disconnectSocialMedia: async function (payload) {
        return new Promise(async (resolve, reject) => {

            try {
                let data = {};
                data.socialId = payload.socialId; //social account id
                data.accountType = payload.accountType; //facebook or google
                data.loginId = payload.loginId; //unique login id of user
                let validUser = await User.findUserByLoginId(data.loginId);

                console.log(validUser);


                if (validUser) {
                    let discconn = {};
                    if (data.accountType == "facebook") {
                        discconn = await User.disconnectFacebookSocialAccount(data);
                    }
                    else if (data.accountType == "google") {
                        discconn = await User.disconnectGoogleSocialAccount(data);
                    }
                    else if (data.accountType == "twitter") {
                        discconn = await User.disconnectTwitterSocialAccount(data);
                    }
                    else if (data.accountType == "instagram") {
                        discconn = await User.disconnectInstaSocialAccount(data);
                    }
                    else if (data.accountType == "apple") {
                        discconn = await User.disconnectAppleSocialAccount(data);
                    }
                    else {
                        return reject(new Error("Invalid Account Type"));
                    }
                    return resolve(discconn);
                } else {
                    return reject(new Error("Invalid User"));
                }
            } catch (err) {
                return reject(util.apiError("disconnect-social-media", 155, err.message));
            }
        });
    },

    authenticateCmsUser: async function (payload) {
        return new Promise(async function (resolve, reject) {

            try {
                let user = await User.findUserByUserId(payload.input);
                // console.log(user)
                if (!user) {
                    console.log("++++++++++++++++++++++++++++++")
                    reject(new Error("Invalid credentials."));
                }
                try {
                    console.log("------------------------------")
                    let user = await keyCloakApi(payload.input, payload.password)
                    console.log(user)
                    resolve(user);
                } catch (err) {
                    console.log(err)
                    reject(err);
                }
            } catch (err) {
                console.log(err)
                reject(err);
            }

        });
    },

    forgetPassword: async function (payload) {
        return new Promise(async function (resolve, reject) {

            try {
                let msisdn = payload.msisdn;
                let email = payload.email;
                let user;
                if (msisdn) {
                    try {
                        user = await User.findUserByMsisdn(msisdn);
                        if (!user) {
                            return reject(new Error("Nomor handphone yang anda masukkan belum terdaftar di FMC. Pastikan nomor handphone yang anda masukkan sudah benar."));
                        } else if (user.socialid && user.login_type === 'google' && user.ismanualandsocialuser != true) {
                            // return reject(new Error("Entered email / mobile no. is registered with Google.Please use Google account to reset password."));
                            return reject(new Error("Alamat Email/No Handphone yang dimasukkan sudah terdaftar di Google. Silahkan gunakan akun Google anda untuk mengatur ulang kata sandi /Reset Password."));
                        } else if (user.socialid && user.login_type === 'facebook' && user.ismanualandsocialuser != true) {
                            // return reject(new Error("Entered email / mobile no. is registered with Facebook.Please use Facebook account to reset password."));
                            return reject(new Error("Alamat Email/No Handphone yang dimasukkan sudah terdaftar di Facebook. Silahkan gunakan akun Facebook anda untuk mengatur ulang kata sandi /Reset Password."));
                        }
                    } catch (err) {
                        return reject(err);
                    }

                } else if (email) {
                    try {
                        user = await User.findUserByEmail(email);
                        if (!user) {
                            return reject(new Error("Email yang anda masukan belum terdaftar di  FMC. Pastikan email yang anda masukan sudah benar."));
                        } else if (user.socialid && user.login_type === 'google' && user.ismanualandsocialuser != true) {
                            // return reject(new Error("Entered email / mobile no. is registered with Google.Please use Google account to reset password."));
                            return reject(new Error("Alamat Email/No Handphone yang dimasukkan sudah terdaftar di Google. Silahkan gunakan akun Google anda untuk mengatur ulang kata sandi /Reset Password."));
                        } else if (user.socialid && user.login_type === 'facebook' && user.ismanualandsocialuser != true) {
                            // return reject(new Error("Entered email / mobile no. is registered with Facebook.Please use Facebook account to reset password."));
                            return reject(new Error("Alamat Email/No Handphone yang dimasukkan sudah terdaftar di Facebook. Silahkan gunakan akun Facebook anda untuk mengatur ulang kata sandi /Reset Password."));
                        }
                    } catch (err) {
                        return reject(err);
                    }
                } else {
                    return reject(new Error("Msisdn or Email are required."));
                }

                payload.email = user.email;
                payload.loginid = user.loginid;
                payload.msisdn = user.msisdn;
                let platform = payload.platform;
                let result = {};
                result = await OtpService.getOtpForRegisteredUser(payload);
                if (result) {
                    resolve(result);
                }
                // if (platform == 'Android') {

                // }
                // else {
                //     result = {
                //         "msisdn": payload.msisdn,
                //         "token": ""
                //     }
                //     resolve(result);
                // }

            } catch (err) {
                reject(err);
            }

        });
    },

    resetPassword: async function (payload) {
        return new Promise(async function (resolve, reject) {

            if (payload.userid !== null) {
                payload.hash = await hashPassword(payload.password);
                let updatedrecord = await User.updatePassword(payload);
                if (updatedrecord) {
                    return resolve(null);
                } else {
                    return reject(new Error("Not able to reset password."));
                }
            } else {
                return reject(new Error("User not found."));
            }
        });
    },

    changePassword: async function (payload) {
        return new Promise(async function (resolve, reject) {

            try {
                if (payload.userid !== null) {
                    let user = await User.findUserByLoginId(payload.userid);
                    if (!user) {
                        // return reject(new Error("User is not registered in FMC App."));
                        return reject(new Error("User/Pengguna tidak terdaftar di aplikasi FMC (FIFGROUP MOBILE CUSTOMER)"));
                    }
                    let isLoginTypeSocail = user.login_type == "google" || user.login_type == "facebook";
                    let isValidPassword = await verifyPassword(payload.oldPassword, user);
                    if (isLoginTypeSocail && !user.ismanualandsocialuser) {
                        isValidPassword = true;
                    }
                    if (isValidPassword) {
                        payload.hash = await hashPassword(payload.newPassword);
                        let updatedrecord = await User.updatePassword(payload);
                        if (isLoginTypeSocail) {
                            await User.updateLoginType(user.loginid);
                        }
                        if (updatedrecord) {
                            return resolve(null);
                        } else {
                            return reject(new Error("Not able to reset password."));
                        }
                    } else {
                        // return reject(new Error("Incorrect old password."));
                        return reject(new Error("Kata sandi lama salah/tidak benar"));
                    }

                } else {
                    return reject(new Error("User not found."));
                }
            } catch (err) {
                reject(err);
            }
        });
    },

    deleteToken: async function (token) {
        return new Promise(async function (resolve, reject) {
            try {
                if (token) {
                    let accessToken = token.split(" ");
                    accessToken[1];
                    let isDeleted = await TokenModel.deleteToken(accessToken[1]);
                    if (isDeleted) {

                        if (isDeleted.loginId) {
                            let loginId = isDeleted.loginId;

                            let activityData = util.prepareActivityLogsData(loginId, 'Logged out', 'Logged out');
                            await activityLogs.createActivityLog(activityData);
                        }

                        resolve("Logout successfully");
                    } else {
                        return resolve(null);
                    }
                } else {
                    return resolve(null);
                }
            } catch (err) {
                logger.error(err);
                resolve(null);
            }

        });
    },

    getFMCRegisteredUsers: async function () {
        return new Promise(function (resolve, reject) {

            User.getFMCRegisteredUsers()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });

        });
    },

    updateProfileReminder: async function () {
        return new Promise(async function (resolve, reject) {
            try {
                let getPointsData = {
                    activityappid: 'UPDATE PROFILE'
                }
                let points = await PointManagement.getPointsForActivity(getPointsData);

                if (points && points > 0) {
                    let payload = {
                        isExport: 1
                    }
                    let fmcUsers = await CustService.listCustomerProfiles(payload);
                    let usersIn = [];
                    if (fmcUsers.data) {
                        usersIn = fmcUsers.data;
                    }
                    const chunks = _.chunk(usersIn, 50000);
                    logger.info(chunks.length);
                    try {
                        for (let i = 0; i < chunks.length; i++) {
                            logger.info(i);
                            logger.info(chunks[i].length);
                            let userArr = chunks[i];

                            for (let j = 0; j < userArr.length; j++) {
                                let currentDate = new Date(util.getTimestamp());
                                let userNot = userArr[j];
                                if (userNot.isprofilecomplete != 1) {
                                    logger.info(userNot);
                                    logger.info("\n\n sending user update profile reminder .. \n\n" + j);
                                    let notificationData = {
                                        type: 'UPDATE_PROFILE_REMINDER',
                                        points: points,
                                        refid: new Date().getTime()
                                    }
                                    await NotificationService.sendNotification(notificationData, userNot, false, true, false);

                                }
                            }
                        }
                    }
                    catch (err) {
                        logger.info('Error' + err);
                    }
                }
                resolve(true);
            }
            catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },

    connectToSocialMediaReminderNew: async function () {
        return new Promise(async function (resolve, reject) {
            //
            try {
                let payload = {
                    isExport: 1
                }
                // let fmcUsers = await CustService.listAllNonSocialMediaCustomers();
                let fmcUsers = await CustService.listCustomerProfiles(payload);
                let usersIn = [];
                if (fmcUsers.data) {
                    usersIn = fmcUsers.data;
                }

                // logger.info("\n\n sending connect to social media reminder .. \n\n");
                // let notificationData = {
                //     type: 'CONNECT_TO_SOCIAL_MEDIA_REMINDER',
                //     refid: new Date().getTime()
                // }
                // let users = [];
                // users.push(user);
                // let not = NotificationService.sendNotificationNew(notificationData, users, false, true, false);
                const chunks = _.chunk(usersIn, 50000);
                for (let i = 0; i < chunks.length; i++) {
                    let userArr = chunks[i];
                    for (let j = 0; j < userArr.length; j++) {
                        let userNot = userArr[j];
                        //users.forEach(async function (user, index, obj) {

                        let currentDate = new Date(util.getTimestamp());

                        if (userNot.fb_status != 1 || userNot.google_status != 1 || userNot.twitter_status != 1 || userNot.insta_status != 1) {
                            logger.info("\n\n sending connect to social media reminder .. \n\n");
                            let accNotConnArr = [];
                            if (userNot.fb_status != 1) {
                                accNotConnArr.push('Facebook');
                            }
                            if (userNot.google_status != 1) {
                                accNotConnArr.push('Google');
                            }
                            if (userNot.twitter_status != 1) {
                                accNotConnArr.push('Twitter');
                            }
                            // if (userNot.insta_status != 1) {
                            //     accNotConnArr.push('Instagram');
                            // }
                            let accNotConnString = '';
                            if (accNotConnArr.length != 0) {
                                accNotConnString = accNotConnArr.join(",");
                                accNotConnString = " " + accNotConnString;
                            }
                            let notificationData = {
                                type: 'CONNECT_TO_SOCIAL_MEDIA_REMINDER',
                                refid: new Date().getTime(),
                                desc: accNotConnString
                            }
                            NotificationService.sendNotification(notificationData, userNot, false, true, false);
                        }

                        //});
                    }
                }
                resolve(true);
                //iterate through each and perform action for publish and expire date
            } catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },


    connectToSocialMediaReminder: async function () {
        return new Promise(async function (resolve, reject) {
            //
            try {
                let payload = {
                    isExport: 1
                }
                // let fmcUsers = await CustService.listAllNonSocialMediaCustomers();
                let fmcUsers = await CustService.listCustomerProfiles(payload);
                let users = [];
                if (fmcUsers.data) {
                    users = fmcUsers.data;
                }

                // logger.info("\n\n sending connect to social media reminder .. \n\n");
                // let notificationData = {
                //     type: 'CONNECT_TO_SOCIAL_MEDIA_REMINDER',
                //     refid: new Date().getTime()
                // }
                // let users = [];
                // users.push(user);
                // let not = NotificationService.sendNotificationNew(notificationData, users, false, true, false);

                users.forEach(async function (user, index, obj) {

                    let currentDate = new Date(util.getTimestamp());

                    if (user.fb_status != 1 || user.google_status != 1 || user.twitter_status != 1 || user.insta_status != 1) {
                        logger.info("\n\n sending connect to social media reminder .. \n\n");
                        let accNotConnArr = [];
                        if (user.fb_status != 1) {
                            accNotConnArr.push('Facebook');
                        }
                        if (user.google_status != 1) {
                            accNotConnArr.push('Google');
                        }
                        if (user.twitter_status != 1) {
                            accNotConnArr.push('Twitter');
                        }
                        // if (user.insta_status != 1) {
                        //     accNotConnArr.push('Instagram');
                        // }
                        let accNotConnString = '';
                        if (accNotConnArr.length != 0) {
                            accNotConnString = accNotConnArr.join(",");
                            accNotConnString = " " + accNotConnString;
                        }
                        let notificationData = {
                            type: 'CONNECT_TO_SOCIAL_MEDIA_REMINDER',
                            refid: new Date().getTime(),
                            desc: accNotConnString
                        }
                        // let users = [];
                        // users.push(user);
                        NotificationService.sendNotification(notificationData, user, false, true, false);
                    }

                });
                resolve(true);
                //iterate through each and perform action for publish and expire date
            } catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },

    createPasswordReminderNew: async function () {
        return new Promise(async function (resolve, reject) {
            //
            try {
                let fmcUsers = await CustService.getCustomersWithoutPassword();
                let users = [];
                if (fmcUsers.data) {
                    users = fmcUsers.data;
                }

                logger.info("\n\n sending create password reminder .. \n\n");
                // let notificationData = {
                //     type: 'CREATE_PASSWORD_REMINDER',
                //     refid: new Date().getTime()
                // }
                // let users = [];
                // users.push(user);
                // let not = NotificationService.sendNotificationNew(notificationData, users, false, true, false);

                users.forEach(async function (user, index, obj) {

                    logger.info("\n\n sending create password reminder .. \n\n");
                    let notificationData = {
                        type: 'CREATE_PASSWORD_REMINDER',
                        refid: new Date().getTime()
                    }
                    // let users = [];
                    // users.push(user);
                    NotificationService.sendNotification(notificationData, user, false, true, false);

                });
                resolve(true);
                //iterate through each and perform action for publish and expire date
            } catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },


    createPasswordReminder: async function () {
        return new Promise(async function (resolve, reject) {
            //
            try {
                let fmcUsers = await CustService.getCustomersWithoutPassword();
                let users = [];
                if (fmcUsers.data) {
                    users = fmcUsers.data;
                }

                logger.info("\n\n sending create password reminder .. \n\n");
                // let notificationData = {
                //     type: 'CREATE_PASSWORD_REMINDER',
                //     refid: new Date().getTime()
                // }
                // let users = [];
                // users.push(user);
                // let not = NotificationService.sendNotificationNew(notificationData, users, false, true, false);

                users.forEach(async function (user, index, obj) {

                    logger.info("\n\n sending create password reminder .. \n\n");
                    let notificationData = {
                        type: 'CREATE_PASSWORD_REMINDER',
                        refid: new Date().getTime()
                    }
                    // let users = [];
                    // users.push(user);
                    NotificationService.sendNotification(notificationData, user, false, true, false);

                });
                resolve(true);
                //iterate through each and perform action for publish and expire date
            } catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },

    syncContractReminder: async function () {
        // return new Promise(async function (resolve, reject) {
        //     //
        //     try {
        //         let payload = {
        //             isExport: 1
        //         }
        //         // let fmcUsers = await CustService.getUnsyncedCustomers();
        //         let fmcUsers = await CustService.listCustomerProfiles(payload);
        //         let users = [];
        //         if (fmcUsers.data) {
        //             users = fmcUsers.data;
        //         }

        //         // let currentDate = new Date(util.getTimestamp());
        //         // logger.info("\n\n sending sync contract reminder .. \n\n");
        //         // let notificationData = {
        //         //     type: 'SYNC_CONTRACT_REMINDER',
        //         //     refid: new Date().getTime()
        //         // }
        //         // let users = [];
        //         // users.push(user);
        //         // let not = NotificationService.sendNotificationNew(notificationData, users, false, true, false);

        //         users.forEach(async function (user, index, obj) {

        //             let currentDate = new Date(util.getTimestamp());
        //             if (!user.custmainno) {
        //                 logger.info("\n\n sending sync contract reminder .. \n\n");
        //                 let notificationData = {
        //                     type: 'SYNC_CONTRACT_REMINDER',
        //                     refid: new Date().getTime()
        //                 }
        //                 // let users = [];
        //                 // users.push(user);
        //                 NotificationService.sendNotification(notificationData, user, false, true, false);
        //             }

        //         });
        //         resolve(true);
        //         //iterate through each and perform action for publish and expire date
        //     } catch (err) {
        //         logger.error(err);
        //         reject(false);
        //     }
        // });

        return new Promise(async function (resolve, reject) {
            try {

                let payload = {
                    isExport: 1
                }
                let fmcUsers = await CustService.listCustomerProfiles(payload);
                let usersIn = [];
                if (fmcUsers.data) {
                    usersIn = fmcUsers.data;
                }
                const chunks = _.chunk(usersIn, 50000);
                logger.info(chunks.length);
                try {
                    for (let i = 0; i < chunks.length; i++) {
                        logger.info(i);
                        logger.info(chunks[i].length);
                        let userArr = chunks[i];

                        for (let j = 0; j < userArr.length; j++) {
                            let currentDate = new Date(util.getTimestamp());
                            let userNot = userArr[j];
                            if (userNot.custmainno == null) {
                                logger.info(userNot);
                                logger.info("\n\n sending sync contract reminder .. \n\n");
                                let notificationData = {
                                    type: 'SYNC_CONTRACT_REMINDER',
                                    refid: new Date().getTime()
                                }
                                await NotificationService.sendNotification(notificationData, userNot, false, true, false);

                            }
                        }
                    }
                }
                catch (err) {
                    logger.info('Error' + err);
                }
                resolve(true);
            }
            catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },

    appUpdateReminder: async function () {
        // return new Promise(async function (resolve, reject) {
        //     try {
        //         let fmcUsers = await CustService.getOldAppVersionCustomers();
        //         let users = [];
        //         if (fmcUsers.data) {
        //             users = fmcUsers.data;
        //         }
        //         const chunks = _.chunk(users, 50000);
        //         logger.info(chunks.length);
        //         try {
        //             for (let i = 0; i < chunks.length; i++) {
        //                 logger.info(i);
        //                 logger.info(chunks[i].length);
        //                 let userArr = chunks[i];

        //                 for (let j = 0; j < userArr.length; j++) {
        //                     let currentDate = new Date(util.getTimestamp());
        //                     let userNot = userArr[j];
        //                     logger.info(userNot);
        //                     logger.info("\n\n sending app update reminder .. \n\n");
        //                     let notificationData = {
        //                         type: 'APP_UPDATE_REMINDER',
        //                         refid: new Date().getTime()
        //                     }
        //                     NotificationService.sendNotification(notificationData, userNot, false, true, false);
        //                 }
        //             }
        //         }
        //         catch (err) {
        //             logger.info('Errorrrrrr' + err);
        //         }
        //         resolve(true);
        //     } catch (err) {
        //         logger.error(err);
        //         reject(false);
        //     }
        // });

        return new Promise(async function (resolve, reject) {
            try {
                let payload = {
                    isExport: 1
                }
                let fmcUsers = await CustService.listCustomerProfiles(payload);
                let usersIn = [];
                if (fmcUsers.data) {
                    usersIn = fmcUsers.data;
                }
                const chunks = _.chunk(usersIn, 50000);
                logger.info(chunks.length);
                try {
                    for (let i = 0; i < chunks.length; i++) {
                        logger.info(i);
                        logger.info(chunks[i].length);
                        let userArr = chunks[i];

                        for (let j = 0; j < userArr.length; j++) {
                            let currentDate = new Date(util.getTimestamp());
                            let latestAndroidVersion = AppConstants.latestAndroidVersion;
                            let latestIosVersion = AppConstants.latestIosVersion;
                            let userNot = userArr[j];
                            if (userNot.app_version == null || (userNot.app_version != latestAndroidVersion && userNot.app_version != latestIosVersion)) {
                                logger.info(userNot);
                                logger.info("\n\n sending app update reminder .. \n\n");
                                let notificationData = {
                                    type: 'APP_UPDATE_REMINDER',
                                    refid: new Date().getTime()
                                }
                                await NotificationService.sendNotification(notificationData, userNot, false, true, false);

                            }
                        }
                    }
                }
                catch (err) {
                    logger.info('Error' + err);
                }
                resolve(true);
            }
            catch (err) {
                logger.error(err);
                reject(false);
            }
        });
    },

    getOauth2Token(loginId) {
        return new Promise(function (resolve, reject) {
            let baseUrl = env.cms.baseUrl || "http://fmcdev001.southeastasia.cloudapp.azure.com/";

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

                    try {
                        if (!err) {
                            body = JSON.parse(body);
                            if (body.accessToken) {
                                return resolve(body.accessToken);
                            } else {
                                return reject(new Error('invalid credentials.'));
                            }
                        } else {
                            return reject(new Error('invalid credentials.'));
                        }
                    } catch (err) {
                        logger.error(err);
                        reject(err);
                    }

                });

        });

    }

}

function getUsersWithSameCustMainNo(custMainNo) {
    return new Promise(async function (resolve, reject) {
        try {
            //check if user  already exists with email / msisdn with status 1 ( registered user ).
            // let user = await User.getAppUserDetails(userId);
            User.getAllUsersByCustMainNo(custMainNo)
                .then(async function (result) {
                    console.lo
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        } catch (err) {
            if (err.code === "23505") {
                err = new Error("User already exists with provided details.");
            }
            reject(err);
        }
    });
}

function findPendingRegistrationUser(payload) {
    let whereClause = [];
    let data = {};
    whereClause.push(`status = 0`)
    if (payload.msisdn) {
        console.log(payload.msisdn);
        whereClause.push(`msisdn = '${payload.msisdn}'`)
    }
    if (payload.email) {
        whereClause.push(`email = '${payload.email}'`)
    }
    whereClause = whereClause.join(' or ');
    whereClause = whereClause.replace("status = 0 or", "status = 0 and");
    if (whereClause.length > 0) {
        whereClause = "where " + whereClause;
    }
    data.whereClause = whereClause;
    return User.findPendingUser(data)
}

function prepareRegisterData(payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let data = {};
            let date = util.getTimestamp();
            let fb_status;
            // let deviceIdArray = [];
            // if (payload.device_id){
            //     deviceIdArray.push({
            //         "lastlogintime": date,
            //         "deviceid": payload.device_id
            //     })
            // }
            data.userid = payload.userId || null;
            data.name = payload.userName || "";
            data.msisdn = payload.msisdn || null;
            data.email = payload.login_type == "manual" ? payload.email : null;
            data.fb_email = payload.login_type == "facebook" ? payload.email : null;
            data.google_email = payload.login_type == "google" ? payload.email : null;
            data.twitter_email = payload.login_type == "twitter" ? payload.email : null;
            data.insta_email = payload.login_type == "instagram" ? payload.email : null;
            data.apple_email = payload.login_type == "apple" ? payload.email : null;
            data.password = payload.password || "";
            data.login_type = payload.login_type || "";
            data.status = payload.status || 0;
            data.fb_status = payload.login_type == "facebook" ? 1 : 0;
            data.google_status = payload.login_type == "google" ? 1 : 0;
            data.twitter_status = payload.login_type == "twitter" ? 1 : 0;
            data.insta_status = payload.login_type == "instagram" ? 1 : 0;
            data.apple_status = payload.login_type == "apple" ? 1 : 0;
            // data.socialId = payload.socialId || "";
            data.fb_socialid = payload.login_type == "facebook" ? payload.socialId : null;
            data.google_socialid = payload.login_type == "google" ? payload.socialId : null;
            data.twitter_socialid = payload.login_type == "twitter" ? payload.socialId : null;
            data.insta_socialid = payload.login_type == "instagram" ? payload.socialId : null;
            data.apple_socialid = payload.login_type == "apple" ? payload.socialId : null;
            data.fcmToken = payload.fcmtoken || null;
            // data.deviceIdInfo = JSON.stringify(deviceIdArray);
            data.role = null;
            data.insertDate = date;
            data.lastLoginDate = null;
            data.referral_id = payload.referral_id;
            data.password = await hashPassword(data.password);
            resolve(data);

        } catch (err) {
            reject(err);
        }
    });
}

function prepareCmsRegisterData(payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let data = {};
            let date = util.getTimestamp();
            data.userId = payload.userId;
            data.name = payload.userName;
            data.loginType = payload.loginType || "cmsuser";
            data.status = payload.status;
            data.role = payload.roleId;
            data.insertDate = date;
            data.lastLoginDate = null;
            data.startdate = payload.startDate;
            data.enddate = payload.endDate;
            resolve(data);

        } catch (err) {
            reject(err);
        }
    });
}

function hashPassword(password) {
    return new Promise(function (resolve, reject) {
        if (password.length === 0) {
            return resolve("");
        }
        bcrypt.genSalt(10, function (err, salt) {

            if (err) {
                reject(err);
            } else {
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(hash);
                    }
                });
            }
        });
    });
}

function verifyPassword(password, user) {

    return new Promise(function (resolve, reject) {
        bcrypt.compare(password, user.password, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });

}

function keyCloakApi(userName, password) {

    return new Promise(function (resolve, reject) {
        request.post({
            url: AppConstants.fifCreditAuthUrl,
            form: {
                username: userName,
                password: password,
                client_id: AppConstants.crmAuthCredentials.authClientId,
                client_secret: AppConstants.crmAuthCredentials.authClientSecret,
                grant_type: AppConstants.crmAuthCredentials.authGrantType
            }
        },
            async function (err, httpResponse, body) {

                if (!err) {
                    try {
                        body = JSON.parse(body);
                        let user = await User.findUserByUserId(userName);
                        console.log(user)
                        if (!user) {
                            let data = {
                                userId: userName,
                                userName: userName || "",
                                login_type: "cmsuser",
                                status: 1
                            };
                            data = await prepareRegisterData(data);
                            //user = await User.createUser(data);
                        }


                        if (body.access_token) {
                            saveToken(user, body);
                            let obj = {
                                "access-token": body.access_token,
                                "info": {
                                    userName: userName,
                                    msisdn: null,
                                    email: null,
                                    userid: user.loginid,
                                    role: user.role,
                                    access: {}
                                }
                            }
                            let result = await RolesService.getRoleDetail(user.role);
                            if (result.length > 0) {
                                for (let i = 0; i < result.length; i++) {
                                    obj['info'].access[result[i]['module']] = result[i]['accesstype'];
                                }
                            }
                            // let userDetails = getCmsUserDetails(userName);

                            return resolve(obj);
                        } else {
                            return reject(new Error('Invalid credentials.'));
                        }
                    }
                    catch (error) {
                        return reject(new Error('Invalid credentials.'));
                    }
                } else {
                    return reject(new Error('Invalid credentials.'));
                }
            });

    });

}

function Oauth2Api(userName, password) {

    return new Promise(function (resolve, reject) {
        let baseUrl = env.cms.baseUrl || "http://fmcdev001.southeastasia.cloudapp.azure.com/";
        request.post({
            url: baseUrl + 'oauth/token',
            form: {
                username: userName,
                password: password,
                client_id: 'FIFUser',
                client_secret: 'FIFUser',
                grant_type: 'password'
            }
        },
            function (err, httpResponse, body) {

                if (!err) {
                    body = JSON.parse(body);
                    if (body.access_token) {
                        let obj = {
                            "access-token": body.access_token,
                            "info": {
                                userName: userName,
                                msisdn: null,
                                email: null,
                                userid: 153
                            }
                        }
                        return resolve(obj);
                    } else {
                        return reject(new Error('invalid credentials.'));
                    }
                } else {
                    return reject(new Error('invalid credentials.'));
                }
            });

    });

}

async function addActivityPoints(data) {
    return new Promise(async function (resolve, reject) {
        let pointsData = {
            loginid: data.loginId,
            activityappid: 'UPDATE PROFILE',
            description: 'Profile Updated'
        }
        try {
            let toAddPoints = await PointManagement.addPointsForActivity(pointsData);
            let pointsAdded = 0;
            if (toAddPoints.currentPoints) {
                pointsAdded = toAddPoints.currentPoints;
            }
            resolve(pointsAdded);
        } catch (err) {
            logger.error(err);
            reject(err);
        }
    });
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function saveToken(user, token) {
    var today = new Date();
    today.setYear(today.getFullYear() + 1);
    let tokenData = {
        accessToken: token.access_token,
        accessTokenExpiresAt: today,
        refreshToken: token.refresh_token,
        refreshTokenExpiresAt: today
    }
    let userId = {
        id: user.loginid
    }
    let client = {
        clientId: "FIFUser",
    }
    TokenModel.saveToken(tokenData, client, userId);
}

async function addSocialMediaActivityPoints(data) {
    return new Promise(async function (resolve, reject) {
        let pointsData = {
            loginid: data.loginid,
            activityappid: 'SOCIAL MEDIA',
            description: 'Connect to Social Media Request'
        }
        try {
            let toAddPoints = await PointManagement.addPointsForActivity(pointsData);
            let pointsAdded = 0;
            if (toAddPoints.currentPoints) {
                pointsAdded = toAddPoints.currentPoints;
            }
            resolve(pointsAdded);
        } catch (err) {
            logger.error(err);
        }
    });
}
