var express = require('express');
var router = express.Router();
var auth=require('../config/authorization');
var util=require('./util');
const logger = require('../config/logging');
var mongoose = require('mongoose');
var path = require('path');
var multer = require('multer');
const fs = require('fs-extra');
// const ThumbnailGenerator = require('video-thumbnail-generator').default;
var FFmpeg = require('fluent-ffmpeg');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
FFmpeg.setFfmpegPath(ffmpegPath);
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
FFmpeg.setFfprobePath(ffprobePath);

/** API path that will upload the files with custom destination url*/
router.post('/multi-upload/:dirName', function(req, res) {
    uploadFile(req,res);
});

/** API path that will upload the files */
router.post('/multi-upload', function(req, res) {
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
}).fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 },{ name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 },{ name: 'image5', maxCount: 1 },{ name: 'image6', maxCount: 1 }, { name: 'image7', maxCount: 1 },{ name: 'image8', maxCount: 1 }, { name: 'image9', maxCount: 1 },{ name: 'image10', maxCount: 1 }])

 function uploadFile(req,res){
    upload(req,res,async function(err){
        
        console.log(req.files);
        if(err)
        {
            res.send(util.failed(err ,"file not found in request body"));
        }
        else{
            console.log(req.files);
            let fileArray = [];
            let tg;
            if(req.files){
                if(req.body.isVideo === "True" || req.body.isVideo === "true"){
                    getThumbnail(req,res);
                }else{
                    for(var i = 1 ; i <=10 ; i++){
                        let key = "image"+i;
                        if(req.files[key] && req.files[key][0]){

                            var path =  req.files[key][0].path;
                            path = path.replace(/\\/g, "/");
                            path = path.replace("public/","") || "";
                            fileArray.push({path : path,id : key});
                        }
                    }
                    res.send(util.success(fileArray,"file uploaded successfully"));
                }
            }else {
                res.send(util.failed(null,"file not found in request body"));
            }
        }
    });
}

function getThumbnail(req,res) {
debugger;
    var fileArray = [];
    res.filecount = Object.keys(req.files).length;
    for(var i = 1 ; i <=10 ; i++){
        let key = "image"+i;
        if(req.files[key] && req.files[key][0]){

            var path =  req.files[key][0].path;
            path = path.replace(/\\/g, "/");
            // path = path.replace("public/","") || "";
            
            new FFmpeg({ source: path })
                .on('error', function(err) {
                    updateResponse(res,fileArray);
                    logger.error('An error occurred: ' + err.message);
                })
                .on('end', function(filenames) {
                })
                .on('filenames', function(filenames) {
                    let relativeThumbPath = 'staticdata/thumbnail/'+filenames[0];
                    path = path.replace("public/","") || "";
                    fileArray.push({path : path,id : key, thumbnail : relativeThumbPath});
                    updateResponse(res , fileArray);
                })
                .screenshots({
                    timestamps: ['1%'],
                    filename: 'thumbnail-%s.png',
                    folder: 'public/staticdata/thumbnail',
                    size: '300x230'
                });

        }
    }
}

function updateResponse(res,files) {
    res.filecount--;
    if(res.filecount == 0){
        res.json(util.success(files));
    }
}
module.exports = router;
