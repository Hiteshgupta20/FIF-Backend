const Promise = require('promise');
const ProductCatalogue = require('../models/productCatalogue');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const notification = require('../services/notification');
const logger = require('../config/logging');

module.exports = {

    getAllProduct: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            let isExport = payload.isExport || 0;


            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = [];
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.productName) {
                    whereClause.push(`productname ilike '%${searchParams.productName}%'`)
                }
                if (searchParams.startDate) {
                    if (searchParams.startDate.from && searchParams.startDate.to) {
                        whereClause.push(`date_trunc('day',startDate) between
                         to_date('${searchParams.startDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.startDate.to}','DD-MM-YYYY')`)
                    }
                }
                if (searchParams.endDate) {
                    if (searchParams.endDate.from && searchParams.endDate.to) {
                        whereClause.push(`date_trunc('day',endDate) between
                         to_date('${searchParams.endDate.from}','DD-MM-YYYY') 
                         and to_date('${searchParams.endDate.to}','DD-MM-YYYY')`)
                    }
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            if (isExport == 0) {
                ProductCatalogue.getAllProductList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                ProductCatalogue.getExportProductList(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

        });
    },


    addProduct: async function (data) {
        return new Promise(function (resolve, reject) {
            ProductCatalogue.addProduct(data)
                .then(function (result) {
                    // sendProductUploadNotification(result[0]);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    editProduct: async function (data) {
        return new Promise(async function (resolve, reject) {
            var oldquantity = await ProductCatalogue.getOldQuantity(data)
            ProductCatalogue.editProduct(data)
                .then(function (result) {
                    ProductCatalogue.updateProductQuantityHistory(data, oldquantity)
                    sendProductUpdateNotification(result[0]);
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    deleteProductById: async function (data) {
        return new Promise(function (resolve, reject) {
            ProductCatalogue.deleteProduct(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getAllProductForApp: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.whereClause = 'where quantity>0 and status=1 and startdate <= now() and enddate >= now()';

            ProductCatalogue.getAllProductListApp(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    getProductById: async function (data) {
        return new Promise(function (resolve, reject) {
            ProductCatalogue.getParticularProduct(data)
                .then(function (result) {
                    for (let i = 0; i < result.length; i++) {
                        result[i]['startdate'] = util.formatTimeStamp(result[i]['startdate']);
                        result[i]['enddate'] = util.formatTimeStamp(result[i]['enddate']);
                    }
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    checkProductAvailability: async function (data) {
        return new Promise(function (resolve, reject) {
            ProductCatalogue.checkProductAvailability(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },

    manageProducts: async function (data) {
        return new Promise(function (resolve, reject) {
            ProductCatalogue.manageProducts(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getProductQunatity: async function (payload) {
        return new Promise(function (resolve, reject) {
            let data = {
                productcatalogueid: payload.productcatalogueid
            };

            ProductCatalogue.getProductQunatity(data)
                .then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });
        });
    },
    productCatalogueScheduler: async function () {
        return new Promise(async function (resolve, reject) {


            //
            try {
                //get all products
                logger.info(".....................product scheduler executing...........")
                let products = await ProductCatalogue.getProductsForNotification();

                products.forEach(async function (product) {
                    let status = 0;
                    let currentDate = new Date(util.getTimestamp()).getTime();
                    if (product.startdate) {
                        let startDate = new Date(util.getTimestamp(product.startdate)).getTime();
                        if (startDate <= currentDate) {
                            status = 1;
                        }
                    }
                    if (product.enddate) {
                        let endDate = new Date(util.getTimestamp(product.enddate)).getTime();
                        if (endDate < currentDate) {
                            status = 0;
                        }
                    }
                    let data = {
                        status: status,
                        productCatalogueId: product.productcatalogueid
                    }
                    if (status != product.status) {
                        let productList = await ProductCatalogue.updateProductStatus(data);
                        if (productList.status == 1) {
                            logger.info("\n activating product.................... \n");
                            sendProductUploadNotification(productList);
                        }
                    }
                });
                //iterate through each and perform action for publish and expire date
                resolve(true);
            } catch (err) {
                reject(false);
            }
        });
    }
};


function sendProductUploadNotification(data) {
    data = data || {};
    data.type = "PRODUCT_UPLOAD";
    data.id = data.productcatalogueid;
    data.sendnotification = data.pushnotification;
    notification.sendNotification(data, data.pushnotification, false, true, true, true);
}
function sendProductUpdateNotification(data) {
    data = data || {};
    data.type = "PRODUCT_UPDATE";
    data.id = data.productcatalogueid;
    data.sendnotification = data.pushnotification;
    notification.sendNotification(data, data.pushnotification, false, true, true, true);
}