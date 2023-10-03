const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')

module.exports.addProduct = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`insert into ${db.schema}.t_pm_product_management(productName,points,image,startdate,enddate,
            quantity,termsAndCondition,pushNotification,insertDate,
            insertBy,status)values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *;`, [data.productname, data.points, data.image
            , data.startdate, data.enddate, data.quantity, data.termsandcondition, data.pushnotification, "now()", data.insertby, data.status])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.editProduct = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_pm_product_management set points=$1,image=$2,startdate=$3,enddate=$4,
         quantity=$5,termsAndCondition=$6,pushNotification=$7,lastModifiedDate=$8,lastModifiedBy=$9,
         status=$10,productName=$11 where productCatalogueId=$12 returning *;`, [data.points, data.image
            , data.startdate, data.enddate, data.quantity, data.termsandcondition, data.pushnotification
            , "now()", data.lastmodifiedby, data.status, data.productname, data.productcatalogueid])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.updateProductQuantityHistory = function (data, oldquantity) {
    return new Promise(function (resolve, reject) {
        db.query(`insert into ${db.schema}.t_pm_product_management_quantity_history(productcatalogueid,productName,points,image,startdate,enddate,
            quantity,termsAndCondition,pushNotification,insertDate,
            lastModifiedBy,status,lastModifiedDate,oldquantity)values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *;`, [data.productcatalogueid, data.productname, data.points, data.image
            , data.startdate, data.enddate, data.quantity, data.termsandcondition, data.pushnotification, "now()", data.insertby, data.status, "now()", oldquantity.quantity])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}


module.exports.deleteProduct = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`delete from ${db.schema}.t_pm_product_management where productCatalogueId=$1 returning productCatalogueId;`, [data.productcatalogueid])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getAllProductList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select * from ${db.schema}.t_pm_product_management
            ${data.whereClause} 
            ${data.orderByClause}
             LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
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
}

module.exports.getProductsForNotification = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select * from ${db.schema}.t_pm_product_management order by productcatalogueid DESC;`, [])
            .then(async function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getExportProductList = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select * from ${db.schema}.t_pm_product_management
            ${data.whereClause};`, [])
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
}

module.exports.getAllProductListApp = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select productcatalogueid,productname,points::text,image,status from ${db.schema}.t_pm_product_management
            where quantity>0 and status=1 and startdate <= now() and enddate >= now()
            ORDER BY insertDate::timestamp DESC LIMIT $1 OFFSET $2;`, [data.limit, data.offset])
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
}


module.exports.getParticularProduct = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select productcatalogueid,productname,points::text,image,startdate,enddate,quantity,
             termsandcondition,pushnotification,lastmodifieddate,lastmodifiedby,
             insertdate,insertby,status
            from ${db.schema}.t_pm_product_management
            where productcatalogueid=$1;`, [data.productCatalogueId])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.getProductQunatity = function (data) {
    console.log(data)
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select t1.*, (SELECT name FROM ${db.schema}.t_lm_app_login_detail as t3 WHERE t3.loginid = t1.lastmodifiedby order by t3.insertdate limit 1) as editorName
         from ${db.schema}.t_pm_product_management_quantity_history as t1
            where productcatalogueid=$1 order by lastmodifieddate desc;`, [data.productcatalogueid])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getOldQuantity = function (data) {
    console.log(data)
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(`select quantity from ${db.schema}.t_pm_product_management
            where productcatalogueid=$1 order by lastmodifieddate desc;`, [data.productcatalogueid])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getTotalCount = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT count(*) FROM ${db.schema}.t_pm_product_management ${data.whereClause};`, [])
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

module.exports.checkProductAvailability = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`select * from ${db.schema}.t_pm_product_management where productcatalogueid=$1 and status=1
            and quantity>0 and date_trunc('day',startdate) <= current_date and date_trunc('day',enddate) >= current_date;`, [data.productCatalogueId])
            .then(function (results) {
                resolve(results[0]);
            })
            .catch(function (err) {
                console.log("exception in checkProductAvailability");
                reject(0);
            });
    });
}

module.exports.manageProducts = function (data) {
    return new Promise(function (resolve, reject) {
        db.query(`update ${db.schema}.t_pm_product_management set 
            quantity=${db.schema}.t_pm_product_management.quantity+$1 where productcatalogueid=$2 returning *
            ;`, [data.productValue, data.productId])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}

module.exports.updateProductStatus = function (data) {
    return new Promise(function (resolve, reject) {
        //
        db.query(`UPDATE ${db.schema}.t_pm_product_management
                      SET  status = $1
                      WHERE productcatalogueid=$2 returning *;`,
            [data.status, data.productCatalogueId])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
