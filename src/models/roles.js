const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util');
const format = require('pg-format');
const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

module.exports.addRole = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_ma_user_role
                    (name, isactive, insertby, insertdate)
                    VALUES($1, $2, $3, $4) returning *;`,
            [data.name, data.isActive, data.insertBy, data.insertDate])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.addRoleDetails = function (data) {
    console.log(data);
    let roleId = data.id;
    let values = [];
    for (let i = 0; i < data.access.length; i++) {
        values.push("("+roleId+",'"+data.access[i]['module']+"','"+data.access[i]['accessType']+"')");
    }
    // let variable = "("+roleId+",'dashboard','RW'),("+roleId+",'dashboard','RW'),("+roleId+",'dashboard','RW')";
    let variable = values.join(",");
    let query = "INSERT INTO "+db.schema+".t_rm_role_details (roleid, module, accesstype) VALUES "+ variable;
    return new Promise(function(resolve, reject) {
        // 
        db.query(query)
            .then(function(results) {
                // 
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

// module.exports.updateRoleDetails = function (data) {
//     console.log(data);
//     let roleId = data.id;
//     let values = [];
//     for (let i = 0; i < data.access.length; i++) {
//         values.push("("+roleId+",'"+data.access[i]['module']+"','"+data.access[i]['accessType']+"')");
//     }
//     // let variable = "("+roleId+",'dashboard','RW'),("+roleId+",'dashboard','RW'),("+roleId+",'dashboard','RW')";
//     let variable = values.join(",");
//     let query = "update "+db.schema+".t_rm_role_details as u set" +
//         " accesstype = u2.accesstype" +
//         " from (values" +
//         " ("+variable+")" +
//         " as u2(module, accesstype)"
//         " where u2.module = u.module and u2.roleid = u.roleid;"
//     console.log(query);
//     return new Promise(function(resolve, reject) {
//         // 
//         db.query(query)
//             .then(function(results) {
//                 // 
//                 resolve(results);
//             })
//             .catch(function(err) {
//                 reject(err);
//             });
//     });
// }

module.exports.getRolesList = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT id, name, isactive FROM ${db.schema}.t_ma_user_role
        ${data.whereClause} 
             ${data.orderByClause}
             LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                let count = await self.getTotalCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getAllRolesList = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        db.query(`SELECT id, name, isactive FROM ${db.schema}.t_ma_user_role
        ${data.whereClause} ORDER BY insertdate::timestamp DESC;`,[])
            .then(async function(results) {
                let count = await self.getTotalCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getTotalCount = function (data) {
    return new Promise(function(resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_ma_user_role ${data.whereClause};`,[])
            .then(function(results) {
                console.log("count="+results[0].count);
                resolve(results[0].count);
            })
            .catch(function(err) {
                console.log("error="+err);
                reject(0);
            });
    });
}

module.exports.getModuleList = function () {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_ma_module;`,
            [])
            .then(function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getRolesDetail = function (roleId) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT r.id, r.name, r.isactive, r.insertby, r.insertdate,
                    r.modifyby, r.modifydate, d.module, d.accesstype
                    FROM ${db.schema}.t_ma_user_role r
                    INNER JOIN ${db.schema}.t_rm_role_details d
                    ON r.id = d.roleid
                    WHERE r.id = $1;`,
            [roleId])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteRole = function (roleId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_ma_user_role 
            WHERE id = $1 returning id;`,
            [roleId])
            .then(async function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.deleteRoleDetails = function (roleId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`DELETE FROM ${db.schema}.t_rm_role_details 
            WHERE roleid = $1 returning roleid;`,
            [roleId])
            .then(async function(results) {
                resolve(true);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateRole = function (data) {
    return new Promise(function(resolve, reject) {
        
        console.log(data);
        db.query(`UPDATE ${db.schema}.t_ma_user_role
                SET  name= $1, isactive= $2, modifydate=$3, modifyby=$4
                WHERE id = $5 returning id;`,
            [data.name, data.isActive, data.modifyDate, data.modifyBy, data.roleId])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateRoleDetails = function (data) {
    console.log(data);
    let roleId = data.id;
    let values = [];
    for (let i = 0; i < data.access.length; i++) {
        values.push("("+roleId+",'"+data.access[i]['module']+"','"+data.access[i]['accessType']+"')");
    }
    // let variable = "("+roleId+",'dashboard','RW'),("+roleId+",'dashboard','RW'),("+roleId+",'dashboard','RW')";
    let variable = values.join(",");
    let query = "INSERT INTO "+db.schema+".t_rm_role_details (roleid, module, accesstype) VALUES "+ variable;
    return new Promise(function(resolve, reject) {
        // 
        db.query(query)
            .then(function(results) {
                // 
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


