const Promise = require('promise');
const Roles = require('../models/roles');
const UserModel = require('../models/user');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports = {

    addRole: async function (payload) {
        return new Promise(function(resolve, reject) {
            let data = {};
            let date = util.getTimestamp();
            // data.roleId = date;
            data.name = payload.name;
            data.isActive = payload.isactive;
            data.access = payload.access;
            data.insertBy = payload.insertby;
            data.insertDate = date;
            Roles.addRole(data)
                .then(function (result) {
                    if(result){

                        let roleData = {
                            id: result.id,
                            access: payload.access
                        }
                        Roles.addRoleDetails(roleData)
                            .then(function (result) {
                                if(result){

                                   resolve(result);
                                }
                            })
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    updateRole: async function (payload) {
        return new Promise(function(resolve, reject) {
            

            let data = {};
            let date = util.getTimestamp();
            data.name = payload.name;
            data.isActive = payload.isactive;
            data.access = payload.access;
            data.modifyDate = date;
            data.modifyBy = payload.modifyby;
            data.roleId = payload.roleid;

            Roles.updateRole(data)
                .then(function (result) {
                    console.log(result);
                    if(result){
                        let delRoleData = {
                            id: result.id
                           }
                        Roles.deleteRoleDetails(delRoleData.id)
                            .then(function (result) {
                                console.log(result);
                                if (result) {
                                    let roleData = {
                                        id: data.roleId,
                                        access: payload.access
                                    }
                                    Roles.addRoleDetails(roleData)
                                        .then(function (result) {
                                            if(result){

                                                resolve(result);
                                            }
                                        })
                                }
                            })
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getRoleList: async function (payload) {
        return new Promise(async function(resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0;
            data.isExport = payload.isExport || 0;
            data.userRole = payload.userRoleId;
            let userRoleDetails = await Roles.getRolesDetail(data.userRole);
            console.log(userRoleDetails);
            if(data.offset <0){
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.roleName) {
                    whereClause.push(`name ilike '%${searchParams.roleName}%'`)
                }
            }
            whereClause = whereClause.join(" and ");
            if(whereClause.length > 0){
                whereClause = "where "+ whereClause;
            }
            data.whereClause = whereClause;

            if (data.isExport == 0) {
                Roles.getRolesList(data)
                    .then(async function (result) {
                        console.log(result);
                        let validRoles = {
                            data: []
                        }
                        if (result['data'] && result['data'].length > 0) {
                           for (let i = 0; i < result['data'].length; i++){
                               let roleValid = true;
                               let thisRoleId = result['data'][i]['id'];
                               let thisRoleDetails = await Roles.getRolesDetail(thisRoleId);


                               for (let i =0; i < userRoleDetails.length; i++) {
                                   for (let j =0; j < thisRoleDetails.length; j++) {
                                       if (userRoleDetails[i]['module'] == thisRoleDetails[j]['module']){
                                           if ((userRoleDetails[i]['accesstype'] == 'H' && thisRoleDetails[j]['accesstype'] == 'R')
                                           || (userRoleDetails[i]['accesstype'] == 'H' && thisRoleDetails[j]['accesstype'] == 'RW')
                                               || (userRoleDetails[i]['accesstype'] == 'R' && thisRoleDetails[j]['accesstype'] == 'RW'))
                                           {
                                               roleValid = false;
                                           }
                                       }
                                   }
                               }

                               if (roleValid) {
                                   validRoles['data'].push(result['data'][i]);
                               }
                           }
                        }

                        resolve(validRoles);

                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                Roles.getAllRolesList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },
    getModuleList: async function () {
        return new Promise(function(resolve, reject) {
            
            Roles.getModuleList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getRoleDetail: async function (roleId) {
        return new Promise(function(resolve, reject) {
            
            Roles.getRolesDetail(roleId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    deleteRole: async function (roleId) {
        return new Promise(function(resolve, reject) {
            
            Roles.deleteRole(roleId)
                .then(function (result) {
                    UserModel.updateStatusOnRoleDeletion(roleId).catch((err)=>{logger.error(err)});
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }
};


async function getValidRoles(data, result){
    return new Promise(async function(resolve, reject) {
        try{
            let validRoles = [];
            let userRolePermissions = await Roles.getRolesDetail(data.userRole);
            if (result && result.data) {
                result.data.forEach(async function (record) {
                    let roleValid = true;
                    let thisRolePermissions = await Roles.getRolesDetail(record.id);
                    for (let i = 0; i < thisRolePermissions.length; i++) {
                        for (let j = 0; j < userRolePermissions.length; j++) {
                            if (thisRolePermissions[i]['module'] == userRolePermissions[j]['module']) {
                                if ((thisRolePermissions[i]['accesstype'] == 'RW' && userRolePermissions[j]['accesstype'] == 'H')
                                    || (thisRolePermissions[i]['accesstype'] == 'R' && userRolePermissions[j]['accesstype'] == 'H')
                                    || (thisRolePermissions[i]['accesstype'] == 'RW' && userRolePermissions[j]['accesstype'] == 'R')) {
                                    roleValid = false;
                                }
                            }
                        }
                    }
                    if (roleValid) {
                        validRoles.push(record);
                    }
                })

                resolve(validRoles);
            }
        }
        catch(err) {
            reject(err);
        }

    });
}


async function ifRoleValid(data, result){
    return new Promise(async function(resolve, reject) {

    });
}

