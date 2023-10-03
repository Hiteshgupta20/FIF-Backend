const Promise = require('promise');
const dropdown = require('../models/dropdownList');
const util = require('../controllers/util');
const appConstants = require('../config/appConstants');
const crmAuthService = require('../services/crmAuth');
const request = require('request');

module.exports = {

        addDropdown: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.name = payload.name || '';
            data.parentId = payload.parentId || 0;
            data.catId = payload.catId || 0;
            data.filters = payload.values || [];
            data.insertDate = payload.insertDate || date;
            data.insertBy = payload.insertBy || 153;
            data.lastModifyDate = data.insertDate;
            data.lastModifyBy = data.insertBy;

            // Unique value chaeck

            let findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) != index);
            let duplicates = findDuplicates(data.filters);
            if (duplicates.length > 0) {
                reject({
                    "message": "Duplicate value exists."
                })
            }

            let tempData = {
                "name": payload.name
            };
            dropdown.checkDropdownUnique(tempData)
                .then(function (resultCount) {
                    if (resultCount > 0 && data.parentId == 0) {
                        reject({
                            "message": "Dropdown already exists."
                        })
                    } else if (resultCount > 0 && data.parentId != 0) {
                        dropdown.parentIdExists(data.parentId)
                            .then(function (resultCount) {
                                if (resultCount > 0) {
                                    reject({
                                        "message": "Values already exists for this category."
                                    })
                                } else {
                                    dropdown.addDropdown(data, 'update')
                                        .then(function (result) {
                                            resolve(result);
                                        })
                                        .catch(function (err) {
                                            reject(err);
                                        });
                                }

                            });
                    } else if (resultCount == 0) {
                        dropdown.addDropdown(data, 'new')
                            .then(function (result) {
                                resolve(result);
                            })
                            .catch(function (err) {
                                reject(err);
                            });
                    }
                });
        });
    },


    updateDropdown: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.name = payload.name || '';
            data.parentId = payload.parentId || 0;
            data.catId = payload.catId || 0;
            data.filters = payload.values || [];
            data.insertDate = payload.insertDate || date;
            data.insertBy = payload.modifyBy || 153;
            data.lastModifyDate = data.insertDate;
            data.lastModifyBy = data.insertBy;
            data.id = payload.id;


            // Unique value chaeck

            let findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) != index);
            let duplicates = findDuplicates(data.filters);
            if (duplicates.length > 0) {
                reject({
                    "message": "Duplicate value exists."
                })
            }

            let tempData = {
                "name": payload.name,
                "id": payload.id
            };
            dropdown.checkDropdownUnique(tempData)
                .then(function (resultCount) {
                    // logger.debug(resultCount);
                    if (resultCount > 0) {
                        reject({
                            "message": "Dropdown already exists."
                        })
                    } else {

                        // Get existing values
                        dropdown.getValuesByCatId(data.id, data.parentId)
                            .then(function (res) {
                                let existingValues = res;


                                existingValues.forEach(async (existEle, existIdx, existArr) => {

                                    for (var i = 0; i < data.filters.length; i++) {
                                        if (existEle.value.toLowerCase() == data.filters[i].toLowerCase()) {
                                            console.log('----------------------------');
                                            console.log(existEle.value.toLowerCase());
                                            console.log(data.filters[i].toLowerCase());
                                            if (existEle.status == 0) {
                                                let status = 1;
                                                await dropdown.updateDropdownMapStatus(existEle, status);
                                            }
                                            break;
                                        }
                                        if ((existEle.value.toLowerCase() != data.filters[i].toLowerCase()) && (data.filters.length == i + 1)) {

                                            let status = 0;
                                            dropdown.updateDropdownMapStatus(existEle, status)
                                                .then(function (result) {
                                                    resolve(result);
                                                })
                                                .catch(function (err) {
                                                    reject(err);
                                                });
                                            // dropdown.deleteDropdownMappingWithParentId(existEle.id, existEle.catid, existEle.parentid)
                                            //     .then(function(result) {
                                            //         resolve(result);
                                            //     })
                                            //     .catch(function(err) {
                                            //         reject(err);
                                            //     });
                                        }
                                    }
                                });

                                data.filters.forEach((addedEle, addedIdx, addedArr) => {

                                    for (var i = 0; i < existingValues.length; i++) {
                                        if (addedEle.toLowerCase() == existingValues[i].value.toLowerCase()) {
                                            break;
                                        }
                                        if ((addedEle.toLowerCase() != existingValues[i].value.toLowerCase()) && (existingValues.length == i + 1)) {
                                            dropdown.updateDropdownMapping(data, addedEle)
                                                .then(function (result) {
                                                    resolve(result);
                                                })
                                                .catch(function (err) {
                                                    reject(err);
                                                });
                                        }

                                    }
                                    if (existingValues.length == 0) {
                                        dropdown.updateDropdownMapping(data, addedEle)
                                            .then(function (result) {
                                                resolve(result);
                                            })
                                            .catch(function (err) {
                                                reject(err);
                                            });
                                    }

                                });


                            }).catch(function () {

                            });

                        dropdown.updateDropdown(data)
                            .then(function (result) {
                                resolve(result);
                            })
                            .catch(function (err) {
                                reject(err);
                            });
                    }
                });
        });
    },
    getDropdownList: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.isExport = payload.isExport || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    console.log(searchParams.name);
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
            }
            whereClause = whereClause.join(" and ");


            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                dropdown.getDropdownList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } else {
                dropdown.getAllDropdownList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },
    getDropdownListById: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.catId = payload.catId || 0;
            data.parentId = payload.parentId || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            let whereClause = [`catid = ${data.catId}`, `parentid = ${data.parentId}`, `status = 1`];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    console.log(searchParams.name);
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
            }
            whereClause = whereClause.join(" and ");


            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            console.log("where clause********************: ", data.whereClause);
            dropdown.getDropdownListById(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getCategoryIdById: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.id = payload.id;
            let whereClause = [];

            if (data.id) {
                whereClause.push(`id = '${data.id}'`)
            }
            whereClause.push(`status = 1`)
            whereClause = whereClause.join(" and ");


            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            dropdown.getDropdownInfoById(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getCategoryList: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.catId = payload.catId || 0;
            data.parentId = payload.parentId || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            // let whereClause = [`catid = ${data.catId}`];
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    console.log(searchParams.name);
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
            }
            whereClause = whereClause.join(" and ");


            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            console.log("where clause********************: ", data.whereClause);
            dropdown.getCategoryList(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getDropdownValues: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.catId = payload.catId || 0;


            let whereClause = [`catid = ${data.catId}`, `status = 1`];
            whereClause = whereClause.join(" and ");


            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            dropdown.getCategoryValues(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getCategoryValues: async function (payload) {
        return new Promise(function (resolve, reject) {

            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            data.catId = payload.catId || 0;
            // data.parentId = payload.parentId || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }

            let whereClause = [`catid = ${data.catId}`, `status = 1`];
            // let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.name) {
                    console.log(searchParams.name);
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
            }
            whereClause = whereClause.join(" and ");


            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            console.log("where clause********************: ", data.whereClause);
            dropdown.getCategoryValues(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    deleteDropdown: async function (id) {
        return new Promise(function (resolve, reject) {

            dropdown.deleteDropdown(id)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    syncBranchData: async function (payload) {
        return new Promise(async function (resolve, reject) {
            let insertBy = payload.insertBy;
            let branchNameCatData = await dropdown.getCatIdByName('Branch Name');
            let branchIdCatData = await dropdown.getCatIdByName('Branch Id');

            let branchNameCatId = branchNameCatData.id || '';
            let branchIdCatId = branchIdCatData.id || '';

            let syncStatusData = {
                status: 1,
                ids: [branchNameCatId, branchIdCatId]
            }

            await dropdown.setDropdownSyncStatus(syncStatusData);

            let deleteBranchIdData = await dropdown.deleteDropdownDataByCatId(branchIdCatId);
            let deleteBranchNameData = await dropdown.deleteDropdownDataByCatId(branchNameCatId);

            let branchNameApiUrl = appConstants.crmQaUrl + appConstants.branchApiUrl;
            let branchIdApiUrl = appConstants.crmQaUrl + appConstants.branchApiUrl;

            try {
                let loginData = await crmAuthService.getCRMAuthToken();
                if (loginData.accessToken) {
                    let headersObj = {
                        "Authorization": "bearer " + loginData.accessToken,
                        "Content-Type": "application/json"
                    }
                    try {
                        resolve(true);
                        // for (let i = 0; i < getProvinceData.length; i++) {

                        let loginData2 = await crmAuthService.getCRMAuthToken();
                        let headersObj2;
                        if (loginData2.accessToken) {
                            headersObj2 = {
                                "Authorization": "bearer " + loginData2.accessToken,
                                "Content-Type": "application/json"
                            }
                        }

                        let branchNameData = await getDropdownCrmData(branchNameApiUrl, headersObj2);
                        console.log(" branchNameData", branchNameData);
                        for (let i = 0; i < branchNameData.length; i++) {
                            console.log('Branch Name ' + i);
                            await insertEntityData('Branch Name', branchNameCatId, branchNameData[i], insertBy);
                        }
                        let branchIdData = await getDropdownCrmData(branchIdApiUrl, headersObj2);
                        console.log("branchIdData ", branchIdData);
                        for (let j = 0; j < branchIdData.length; j++) {
                            console.log('Branch Id ' + j);
                            await insertEntityData('Branch Id', branchIdCatId, branchIdData[j], insertBy);


                            if (j == (branchIdData.length - 1)) {
                                let syncStatusData = {
                                    status: 0,
                                    ids: [branchNameCatId, branchIdCatId]
                                }

                                await dropdown.setDropdownSyncStatus(syncStatusData);

                            }
                        }


                    } catch (err) {
                        console.log('CRM API failed', err);
                        reject(err);
                    }
                }
            } catch (err) {
                reject(new Error(err));
            }
        });

    },

    syncDataCommon: async function (payload) {
        return new Promise(async function (resolve, reject) {
            let insertBy = payload.insertBy;
            let provinceCatData = await dropdown.getCatIdByName('Province');
            let cityCatData = await dropdown.getCatIdByName('City');
            let subDistrictCatData = await dropdown.getCatIdByName('Sub District');
            let villageCatData = await dropdown.getCatIdByName('Village');

            let provinceCatId = provinceCatData.id || '';
            let cityCatId = cityCatData.id || '';
            let subDistrictCatId = subDistrictCatData.id || '';
            let villageCatId = villageCatData.id || '';

            let syncStatusData = {
                status: 1,
                ids: [provinceCatId, cityCatId, subDistrictCatId, villageCatId]

            }

            await dropdown.setDropdownSyncStatus(syncStatusData);

            let deleteVillageData = await dropdown.deleteDropdownDataByCatId(villageCatId);
            let deleteSubdistrictData = await dropdown.deleteDropdownDataByCatId(subDistrictCatId);
            let deleteCityData = await dropdown.deleteDropdownDataByCatId(cityCatId);
            let deleteProvinceData = await dropdown.deleteDropdownDataByCatId(provinceCatId);

            let provinceApiUrl = appConstants.crmQaUrl + appConstants.provinceApiUrl;
            let cityApiUrl = appConstants.crmQaUrl + appConstants.cityApiUrl;
            let subDistrictApiUrl = appConstants.crmQaUrl + appConstants.districtApiUrl;
            let villageApiUrl = appConstants.crmQaUrl + appConstants.villageApiUrl;

            try {
                let loginData = await crmAuthService.getCRMAuthToken();
                if (loginData.accessToken) {
                    let headersObj = {
                        "Authorization": "bearer " + loginData.accessToken,
                        "Content-Type": "application/json"
                    }
                    try {
                        let getProvinceData = await getDropdownCrmData(provinceApiUrl, headersObj);
                        resolve(true);
                        for (let i = 0; i < getProvinceData.length; i++) {

                            // if (i === 0) {
                            let loginData2 = await crmAuthService.getCRMAuthToken();
                            let headersObj2;
                            if (loginData2.accessToken) {
                                headersObj2 = {
                                    "Authorization": "bearer " + loginData2.accessToken,
                                    "Content-Type": "application/json"
                                }
                            }
                            await insertEntityData('Province', provinceCatId, getProvinceData[i], insertBy);
                            let getCityData = await getDropdownCrmData(cityApiUrl, headersObj2, getProvinceData[i].provCode);
                            console.log("getCityData ", getCityData);
                            console.log("newParentIdProvData", getProvinceData[i])
                            let newParentIdProvData = await dropdown.getParentId(getProvinceData[i].provCode);
                            let provParentId;
                            if (newParentIdProvData.length > 0) {
                                provParentId = newParentIdProvData[0].id || 0;
                            }
                            for (let j = 0; j < getCityData.length; j++) {
                                getCityData[j].parentId = provParentId;
                                console.log('city' + j);
                                await insertEntityData('City', cityCatId, getCityData[j], insertBy);

                                let getSubDistData = await getDropdownCrmData(subDistrictApiUrl, headersObj2, getCityData[j].cityCode);
                                console.log("getSubDistData ", getSubDistData);
                                console.log("newParentIdCityData", getCityData[j])
                                let newParentIdCityData = await dropdown.getParentId(getCityData[j].cityCode);
                                let cityParentId;
                                if (newParentIdCityData.length > 0) {
                                    cityParentId = newParentIdCityData[0].id || 0;
                                }
                                for (let k = 0; k < getSubDistData.length; k++) {
                                    console.log('subd' + k);
                                    getSubDistData[k].parentId = cityParentId;
                                    await insertEntityData('Sub District', subDistrictCatId, getSubDistData[k], insertBy);

                                    let villageData = await getDropdownCrmData(villageApiUrl, headersObj2, getSubDistData[k].kecCode);
                                    console.log("villageData ", villageData);
                                    console.log("newParentIdSubDistData", getSubDistData[k])
                                    let newParentIdSubDistData = await dropdown.getParentId(getSubDistData[k].kecCode);
                                    let subDistParentId;
                                    if (newParentIdSubDistData.length > 0) {
                                        subDistParentId = newParentIdSubDistData[0].id || 0;
                                    }
                                    for (let l = 0; l < villageData.length; l++) {
                                        console.log('village' + l);
                                        villageData[l].parentId = subDistParentId;
                                        await insertEntityData('Village', villageCatId, villageData[l], insertBy);
                                    }
                                }
                            }

                            if (i == (getProvinceData.length - 1)) {
                                let syncStatusData = {
                                    status: 0,
                                    ids: [provinceCatId, cityCatId, subDistrictCatId, villageCatId]
                                }

                                await dropdown.setDropdownSyncStatus(syncStatusData);
                            }

                        }


                    } catch (err) {
                        console.log('CRM API failed', err);
                        reject(err);
                    }
                }
            } catch (err) {
                reject(new Error(err));
            }
        });
    },
    syncData: async function (payload) {
        return new Promise(async function (resolve, reject) {
            let type = payload.name;
            let typeId = payload.id;
            let insertBy = payload.insertBy;
            let apiUrl = "";
            if (type == 'Province') {
                apiUrl = appConstants.crmQaUrl + appConstants.provinceApiUrl;
            } else if (type == 'City') {
                apiUrl = appConstants.crmQaUrl + appConstants.cityApiUrl;
            } else if (type == 'Sub District') {
                apiUrl = appConstants.crmQaUrl + appConstants.districtApiUrl;
            } else if (type == 'Village') {
                apiUrl = appConstants.crmQaUrl + appConstants.villageApiUrl;
            } else if (type == 'Branch Name') {
                apiUrl = appConstants.crmQaUrl + appConstants.branchApiUrl;
            } else if (type == 'Branch Id') {
                apiUrl = appConstants.crmQaUrl + appConstants.branchApiUrl;
            }

            try {
                let loginData = await crmAuthService.getCRMAuthToken();
                if (loginData.accessToken) {
                    let headersObj = {
                        "Authorization": "bearer " + loginData.accessToken,
                        "Content-Type": "application/json"
                    }
                    try {
                        console.log(apiUrl);
                        request({
                            headers: headersObj,
                            url: apiUrl,
                        }, async function (err, response, body) {
                            if (err) {
                                console.error('syncing failed:', err);
                                reject(err);
                            }
                            let result = JSON.parse(body);
                            if (result) {
                                resolve(true);
                                let resultLength = result.length;
                                let existingData = await dropdown.getCatValue(typeId);
                                let resetData = {
                                    status: 0,
                                    catid: typeId
                                }
                                let syncStatusData = {
                                    status: 1,
                                    id: typeId
                                }
                                await dropdown.setDropdownSyncStatus(syncStatusData);
                                await dropdown.resetDropdownStatus(resetData);
                                for (let i = 0; i < resultLength; i++) {
                                    let newData = {
                                        code: "",
                                        name: "",
                                        parent: ""
                                    };
                                    if (type == "Province") {
                                        newData.code = result[i].provCode;
                                        newData.name = result[i].provinsi;
                                    } else if (type == "City") {
                                        newData.code = result[i].cityCode;
                                        newData.name = result[i].city;
                                        newData.parent = result[i].provCode;
                                    } else if (type == "Sub District") {
                                        newData.code = result[i].kecCode;
                                        newData.name = result[i].kecamatan;
                                        newData.parent = result[i].cityCode;
                                    } else if (type == "Village") {
                                        newData.code = result[i].kelCode;
                                        newData.name = result[i].kelurahan;
                                        newData.parent = result[i].kecCode;
                                    } else if (type == "Branch Name") {
                                        newData.code = result[i].nameFull;
                                        newData.name = result[i].branch;
                                        // newData.parent = result[i].kelCode;
                                    } else if (type == "Branch Id") {
                                        newData.code = result[i].officeCode;
                                        newData.name = result[i].branch;
                                    }
                                    let newParentId = 0
                                    console.log(newData.parent);
                                    if (newData.parent) {
                                        let newParentIdData = await dropdown.getParentId(newData.parent);
                                        if (newParentIdData.length > 0) {
                                            newParentId = newParentIdData[0].id || 0;
                                        }
                                    }
                                    let existingEntry = await dropdown.getExistingDropdownValue(newData);
                                    if (existingEntry.length == 0) {
                                        let date = util.getTimestamp();
                                        newData.parentId = newParentId || 0;
                                        newData.catId = typeId || 0;
                                        newData.insertDate = payload.insertDate || date;
                                        newData.insertBy = payload.insertBy || 153;
                                        newData.lastModifyDate = payload.insertDate || date;
                                        newData.lastModifyBy = payload.insertBy || 153;
                                        await dropdown.addDropdownValueFromCrmApi(newData);
                                    } else {
                                        let date = util.getTimestamp();
                                        newData.id = existingEntry[0].id;
                                        newData.parentId = newParentId || 0;
                                        newData.catId = typeId || 0;
                                        newData.status = 1;
                                        newData.lastModifyDate = payload.insertDate || date;
                                        newData.lastModifyBy = payload.insertBy || 153;
                                        await dropdown.updateDropdownValueFromCrmApi(newData);
                                    }
                                    if (i == resultLength - 1) {
                                        let syncStatusData = {
                                            status: 0,
                                            id: typeId
                                        }
                                        await dropdown.setDropdownSyncStatus(syncStatusData);
                                    }
                                }

                            }

                        });
                    } catch (err) {
                        console.log('CRM API failed', err);
                        reject(err);
                    }
                }
            } catch (err) {
                reject(new Error(err));
            }
        });
    }
}

async function getDropdownCrmData(apiUrl, headersObj, param) {

    return new Promise(function (resolve, reject) {
        let apiPath = param ? apiUrl + '/' + param : apiUrl;
        console.log('-------------------------------');
        console.log(apiPath);
        request({
            headers: headersObj,
            url: apiPath
        }, function (err, response, body) {
            if (err) {
                console.error('syncing failed:', err);
                reject(err);
            }
            let result = JSON.parse(body);
            console.log(body);
            resolve(result);
        });
    });
}

async function insertEntityData(type, catId, data, insertBy) {
    return new Promise(async function (resolve, reject) {
        let newData = {
            code: "",
            name: "",
            parent: ""
        };
        if (type == "Province") {
            newData.code = data.provCode;
            newData.name = data.provinsi;
        } else if (type == "City") {
            newData.code = data.cityCode;
            newData.name = data.city;
        } else if (type == "Sub District") {
            newData.code = data.kecCode;
            newData.name = data.kecamatan;
        } else if (type == "Village") {
            newData.code = data.kelCode;
            newData.name = data.kelurahan;
        } else if (type == "Branch Name") {
            newData.code = "";
            newData.name = data.nameFull;
        } else if (type == "Branch Id") {
            newData.code = "";
            newData.name = data.officeCode;
        }

        let date = util.getTimestamp();
        newData.parentId = data.parentId || 0;
        newData.catId = catId || 0;
        newData.insertDate = date;
        newData.insertBy = insertBy || 909;
        newData.lastModifyDate = date;
        newData.lastModifyBy = insertBy || 909;
        newData.sourceType = 'crm';
        await dropdown.addDropdownValueFromCrmApi(newData);
        resolve(true);
    });
}