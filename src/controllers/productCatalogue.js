var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const ProductCatalogue = require('../services/productCatalogue')
var basePath = '/productCatalogue';

router.post(basePath + '/save', auth.isAuthenticated, async (req, res) => {
    try {
        let result = await ProductCatalogue.addProduct(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post(basePath + '/update', auth.isAuthenticated, async (req, res) => {
    try {
        let result = await ProductCatalogue.editProduct(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});


router.post(basePath + '/delete', auth.isAuthenticated, async (req, res) => {
    try {
        let result = await ProductCatalogue.deleteProductById(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});


router.post(basePath + '/getAll', auth.isAuthenticated, async (req, res) => {
    try {
        let result = await ProductCatalogue.getAllProduct(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});


router.post(basePath + '/getAllApp', auth.isAuthenticated, async (req, res) => {
    try {
        let result = await ProductCatalogue.getAllProductForApp(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post(basePath + '/getByProductId', auth.isAuthenticated, async (req, res) => {
    try {
        let result = await ProductCatalogue.getProductById(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/productCatalogue/quantity', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await ProductCatalogue.getProductQunatity(req.body);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }
});
function validateRequest(payload) {
    return false;
}
module.exports = router;