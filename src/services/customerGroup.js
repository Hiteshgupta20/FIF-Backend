const Promise = require('promise');
const CustomerGroupModel = require('../models/customerGroup');
// const UserModel = require('../models/user');
const utils = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const logger = require('../config/logging');
const xlsx = require("xlsx");
const UserModel = require("../models/user");
const UserService = require("./user");
const User = require("../models/user");

module.exports = {
    listCustomerGroups: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.isExport = payload.isExport || 0;

            if (data.offset < 0)
                data.offset = 0;
            data.orderByClause = utils.formatOrderByClause(payload);
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.groupName) {
                    whereClause.push(`name ilike '%${searchParams.groupName}%'`);
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                CustomerGroupModel.getCustomerGroupList(data)
                    .then(function (result) {
                        resolve(result);
                    }).catch(function (err) {
                        reject(err);
                    });
            } else {
                CustomerGroupModel.getAllCustomerGroupList(data)
                    .then(function (result) {
                        resolve(result);
                    }).catch(function (err) {
                        reject(err);
                    });
            }

        });
    },
    addCustomerGroup: async function (payload) {
        return new Promise(function (resolve, reject) {
            let filter = payload.filter || "{}";
            let customerList = payload.customerList || "{}";
            let data = {
                name: payload.name,
                status: payload.status || 1,
                insertby: payload.insertBy || null,
                insertdate: utils.getTimestamp(),
                filter: JSON.stringify(filter),
                lastmodifieddate: null,
                lastmodifiedby: null,
                customer_list: JSON.stringify(customerList),
                isexcelupload: payload.isExcelUpload,
                excelFileId: payload.excelFileId
            };

            CustomerGroupModel.addCustomerGroup(data)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
    updateCustomerGroup: async function (payload) {
        return new Promise(function (resolve, reject) {
            let filter = payload.filter || "{}";
            let customerList = payload.customerList || "{}";
            let data = {
                name: payload.name,
                status: payload.status || 1,
                filter: JSON.stringify(filter),
                lastmodifieddate: utils.getTimestamp(),
                lastmodifiedby: payload.modifyBy,
                customer_list: JSON.stringify(customerList),
                groupId: payload.groupId
            };

            CustomerGroupModel.updateCustomerGroup(data)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
    deleteCustomerGroup: async function (payload) {
        return new Promise(function (resolve, reject) {
            CustomerGroupModel.deleteCustomerGroup(payload.groupId)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
    applyFilter: async function (payload) {
        return new Promise(function (resolve, reject) {
            let filters = payload.filters;
            let whereClause = [];
            filters.forEach(function (filter) {
                if (filter.value) {

                    if (filter.key == "gender") {
                        whereClause.push(`lower(${filter.key}) = lower('${filter.value}')`);
                    } else if (filter.key == "city") {
                        whereClause.push(`lower(district) = lower('${filter.value}')`);
                    } else if (filter.key == "Sub District") {
                        whereClause.push(`lower(subdistrict) = lower('${filter.value}')`);
                    } else if (filter.key == "yearOfBorn") {
                        whereClause.push(`extract(year from dob) = '${filter.value}'`);
                    } else if (filter.key == "monthOfBorn") {
                        whereClause.push(`extract(month from dob) = '${filter.value}'`);
                    } else if (filter.key == "age") {
                        whereClause.push(`date_part('year',age(dob)) = '${filter.value}'`);
                    } else if (filter.key == "Branch Name") {
                        whereClause.push(`lower(branchname) = lower('${filter.value}')`);
                    } else if (filter.key == "Branch Id") {
                        whereClause.push(`lower(branchid) = lower('${filter.value}')`);
                    } else {
                        whereClause.push(`${filter.key} ILIKE '%${filter.value}%'`);
                    }
                }
            })
            let where = whereClause.join(" AND ");
            if (whereClause.length > 0) {
                whereClause = "WHERE " + where;
            } else {
                whereClause = "";
            }
            payload.whereClause = whereClause;
            UserModel.getFilteredUsers(payload)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
    uploadFile: function (payload) {
        return new Promise(async function (resolve, reject) {
            let data = {};
            let date = new Date();
            date.setMilliseconds(0);
            date.setSeconds(0);
            data.filepath = payload.filepath || "";
            data.loginid = payload.loginid || null;
            data.insertdate = date;
            data.status = 0
            CustomerGroupModel.uploadFile(data)
                .then(async function (result) {
                    resolve(result)
                })
                .catch(function (err) {
                    reject(err);
                });

        })
    },

    customerGroupExcelScheduler: async function () {
        return new Promise(async function (resolve, reject) {
            try {
                logger.info(
                    "..................... Customer Group Excel File Scheduler executing..........."
                );
                let customerGRoupexcelFiles = await CustomerGroupModel.getAllExcelFiles();
                if (Object.keys(customerGRoupexcelFiles).length > 0) {
                    customerGRoupexcelFiles.forEach(async function (excelFile, index, obj) {
                        let customerGRoupexcelFileData = xlsx.readFile(excelFile.filepath);
                        var file = xlsx.utils.sheet_to_json(
                            customerGRoupexcelFileData.Sheets[customerGRoupexcelFileData.SheetNames[0]]
                        );
                        let response = {
                            data: [],
                        }
                        let fileData = {};
                        for (var i = 0; i < file.length; i++) {
                            let result = file[i];
                            var data = { phone: result.Number };
                            if (result.Type === "Mobile") {
                                userdata = await User.getUserDetailsByMsisdnforCustomerGroupExcel(data);
                                if (userdata) {
                                    response.data.push(userdata);
                                }
                            }
                            if (result.Type === "CustomerMainNumber") {
                                userdata = await User.getAllUsersByCustMainNoForCustGroupExcel(result.Number);
                                if (userdata) {
                                    userdata.forEach(async function (userdata) {
                                        response.data.push(userdata);
                                    })
                                }
                            }
                            if (result.Type === "ContractNumber") {
                                userData = await User.getUserDetailsByContractNoForCustGroupExcel
                                (result.Number);
                                if (userData) {
                                    let userArr = [];
                                    userData.forEach(function (objData) {
                                        if (userArr && userArr.length > 0) {
                                            const objUser = userArr.find(x => x.loginid == objData.loginid);
                                            if (!objUser) {
                                                userArr.push(objData)
                                            }
                                        }
                                        else {
                                            userArr.push(objData)
                                        }
                                    })
                                    response.data.push(...userArr);
                                }
                            }
                        }
                        if (response.data) {
                            let cust_list = JSON.stringify(response.data)
                            let excelData = {
                                status: 1,
                                id: excelFile.id,
                                cust_list: cust_list
                            }
                            await CustomerGroupModel.updateCustomerGroupExcelFilesStatus(excelData, response)
                            resolve(true)
                        }
                    })
                    resolve(true)
                } else {
                    resolve(true)
                }
            } catch (err) {
                reject(false);
            }
        });
    },


    getExcelCustomers: async function (payload) {
        return new Promise(async function (resolve, reject) {
            CustomerGroupModel.getCustomerGroupUploadedData(payload)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    }
}
