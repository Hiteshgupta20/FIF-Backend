const Promise = require('promise');
const CustomerProfile = require('../models/customerProfile');
const utils = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const logger = require('../config/logging');
const util = require('../controllers/util');
const _ = require('lodash');

module.exports = {
    listCustomerProfiles: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.isExport = payload.isExport || 0;

            data.limit = payload.limit || 10;
            data.offset = payload.page || 0;

            if (data.offset < 0)
                data.offset = 0;

            data.orderByClause = util.formatOrderByClause(payload, '');
            // data.orderByClauseDeviceId = util.formatOrderByClause(payload,'u');
            let whereClause = [];
            let whereClauseWithoutPrefix = [];
            let whereClauseDeviceId = [];
            let searchParams = payload.searchParams || {};
            whereClause.push(`status = '1'`);
            whereClause.push(`login_type != 'cmsuser'`);
            whereClauseWithoutPrefix.push(`status = '1'`);
            whereClauseWithoutPrefix.push(`login_type != 'cmsuser'`);
            whereClauseDeviceId.push(`u.status = '1'`);
            whereClauseDeviceId.push(`u.login_type != 'cmsuser'`);
            if (searchParams) {
                if (searchParams.name) {
                    whereClause.push(`name ilike '%${searchParams.name}%'`);
                    whereClauseWithoutPrefix.push(`name ilike '%${searchParams.name}%'`);
                    whereClauseDeviceId.push(`u.name ilike '%${searchParams.name}%'`);
                }
                if (searchParams.msisdn) {
                    whereClause.push(`msisdn ilike '%${searchParams.msisdn}%'`);
                    whereClauseWithoutPrefix.push(`msisdn ilike '%${searchParams.msisdn}%'`);
                    whereClauseDeviceId.push(`u.msisdn ilike '%${searchParams.msisdn}%'`);
                }
                if (searchParams.custmainno) {
                    whereClause.push(`custmainno ilike '%${searchParams.custmainno}%'`);
                    whereClauseWithoutPrefix.push(`custmainno ilike '%${searchParams.custmainno}%'`);
                    whereClauseDeviceId.push(`u.custmainno ilike '%${searchParams.custmainno}%'`);
                }
                if (searchParams.referral_id) {
                    whereClause.push(`referral_id ilike '%${searchParams.referral_id}%'`);
                    whereClauseWithoutPrefix.push(`referral_id ilike '%${searchParams.referral_id}%'`);
                    whereClauseDeviceId.push(`u.referral_id ilike '%${searchParams.referral_id}%'`);
                }
                if (searchParams.device_id) {
                    whereClause.push(`deviceid ilike '%${searchParams.device_id}%'`);
                    whereClauseWithoutPrefix.push(`deviceid ilike '%${searchParams.device_id}%'`);
                    whereClauseDeviceId.push(`d.deviceid ilike '%${searchParams.device_id}%'`);
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            whereClauseWithoutPrefix = whereClauseWithoutPrefix.join(" and ");
            if (whereClauseWithoutPrefix.length > 0) {
                whereClauseWithoutPrefix = "where " + whereClauseWithoutPrefix;
            }
            whereClauseDeviceId = whereClauseDeviceId.join(" and ");
            if (whereClauseDeviceId.length > 0) {
                whereClauseDeviceId = "where " + whereClauseDeviceId;
            }
            data.whereClause = whereClause;
            data.whereClauseWithoutPrefix = whereClauseWithoutPrefix;
            data.whereClauseDeviceId = whereClauseDeviceId;
            let sortBy = payload.sortBy || 'insertdate::timestamp';
            data.sortByParam = sortBy;
            if (searchParams.device_id) {
                if (data.isExport == 0) {
                    CustomerProfile.listCustomerProfilesDeviceId(data)
                        .then(function (result) {
                            resolve(result);
                        }).catch(function (err) {
                            reject(err);
                        });
                }
                else {
                    CustomerProfile.listCustomerProfilesDeviceIdAll(data)
                        .then(function (result) {
                            resolve(result);
                        }).catch(function (err) {
                            reject(err);
                        });
                }
            } else {
                if (data.isExport == 0) {
                    CustomerProfile.listCustomerProfiles(data)
                        .then(function (result) {
                            resolve(result);
                        }).catch(function (err) {
                            reject(err);
                        });
                }
                else {
                    CustomerProfile.listAllCustomerProfiles(data)
                        .then(function (result) {
                            resolve(result);
                        }).catch(function (err) {
                            reject(err);
                        });
                }
            }



        });
    },

    updateCustomerProfile: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {
                name: payload.name,
                email: payload.email,
                loginid: payload.customerProfileId
            };

            CustomerProfile.updateCustomerProfile(data)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getAllCustomersCount: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};

            data.orderByClause = util.formatOrderByClause(payload, '');
            let whereClauseWithoutPrefix = [];
            let searchParams = payload.searchParams || {};
            whereClauseWithoutPrefix.push(`status = '1'`);
            whereClauseWithoutPrefix.push(`login_type != 'cmsuser'`);
            if (searchParams) {
                if (searchParams.name) {
                    whereClauseWithoutPrefix.push(`name ilike '%${searchParams.name}%'`);
                }
                if (searchParams.msisdn) {
                    whereClauseWithoutPrefix.push(`msisdn ilike '%${searchParams.msisdn}%'`);
                }
                if (searchParams.custmainno) {
                    whereClauseWithoutPrefix.push(`custmainno ilike '%${searchParams.custmainno}%'`);
                }
                if (searchParams.referral_id) {
                    whereClauseWithoutPrefix.push(`referral_id ilike '%${searchParams.referral_id}%'`);
                }
                if (searchParams.device_id) {
                    whereClauseWithoutPrefix.push(`deviceid ilike '%${searchParams.device_id}%'`);
                }
            }

            whereClauseWithoutPrefix = whereClauseWithoutPrefix.join(" and ");
            if (whereClauseWithoutPrefix.length > 0) {
                whereClauseWithoutPrefix = "where " + whereClauseWithoutPrefix;
            }
            data.whereClauseWithoutPrefix = whereClauseWithoutPrefix;
            let sortBy = payload.sortBy || 'insertdate::timestamp';
            data.sortByParam = sortBy;
            CustomerProfile.getCustomerProfilesListCount(data)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getUnsyncedCustomers: async function () {
        return new Promise(function (resolve, reject) {
            CustomerProfile.listAllCustomerWithoutCustMainNo()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getCustomersWithoutPassword: async function () {
        return new Promise(function (resolve, reject) {
            let data = {};
            let whereClause = [];
            CustomerProfile.listAllCustomerWithoutPassword()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getIncompleteProfileCustomers: async function () {
        return new Promise(function (resolve, reject) {
            CustomerProfile.listAllCustomersWithIncompleteProfiles()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getIncompleteDocumentCustomers: async function () {
        return new Promise(function (resolve, reject) {
            CustomerProfile.listAllCustomersWithIncompleteDocuments()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getNonSocialMediaCustomers: async function () {
        return new Promise(function (resolve, reject) {
            CustomerProfile.listAllCustomersWithIncompleteDocuments()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    listAllNonSocialMediaCustomers: async function () {
        return new Promise(function (resolve, reject) {
            CustomerProfile.listAllNonSocialMediaCustomers()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },

    getOldAppVersionCustomers: async function () {
        return new Promise(function (resolve, reject) {
            CustomerProfile.getOldAppVersionCustomers()
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
}
