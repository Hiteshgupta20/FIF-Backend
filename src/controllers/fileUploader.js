var express = require('express');
var router = express.Router();
var auth=require('../config/authorization');
var util=require('./util');
const logger = require('../config/logging');
var mongoose = require('mongoose');
var path = require('path');
var multer = require('multer');
const fs = require('fs-extra');
const readXlsxFile = require('read-excel-file/node');

/** API path that will upload the files with custom destination url*/
router.post('/upload/:dirName', function(req, res) {
    uploadFile(req,res);
});

/** API path that will upload the files with custom destination url*/
router.post('/uploadExcel/:dirName', function(req, res) {
    uploadExcelFile(req,res);
});

/** API path that will upload the files */
router.post('/upload', function(req, res) {
    uploadFile(req,res);
});


/** Serving from the same express Server
 No cors required */

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        var dirName = req.params.dirName?"/"+req.params.dirName: "";
        var path = './public/staticdata'+dirName;
        fs.mkdirsSync(path);
        cb(null, path);
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        if(!req.params.dirName){
            
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
        }else{
            
            // let filename = file.originalname.replace(/ /g,'');
            let filename = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_');

            cb(null, filename);
        }

    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('image');

function uploadFile(req,res){
    upload(req,res,function(err){
        
        console.log(req.file);
        if(err)
        {
            logger.error(err);
            res.send(util.failed(err ,"file not found in request body"));
        }
        else{
            console.log(req.file);
            if(req.file){
                var path =  req.file.path || "";
                path = path.replace(/\\/g, "/") || "";
                path = path.replace("public/","") || "";
                let object={
                    path : path
                }
                res.send(util.success(object,"file uploaded successfuly"));
            }else {
                res.send(util.failed(null,"file not found in request body"));
            }
        }
    });
}

function uploadExcelFile(req,res){
    upload(req,res,function(err){
        console.log(req.file);
        if(err)
        {
            logger.error(err);
            res.send(util.failed(err ,"file not found in request body"));
        }
        else{
            console.log(req.file);
            if(req.file){

                var path =  req.file.path || "";
                path = path.replace(/\\/g, "/") || "";
                readXlsxFile(path).then((rows) => {
                    // `rows` is an array of rows
                    // each row being an array of cells.

                })
                res.send(util.success(null,"file uploaded successfuly"));
            }else {
                res.send(util.failed(null,"file not found in request body"));
            }
        }
    });
}
module.exports = router;
