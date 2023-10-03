var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const pool = require('../config/postgreDB');
const request = require('request');
const bcrypt = require('bcrypt');
const v = require('node-input-validator');
const multiparty = require('multiparty');
const querystring = require('querystring');
const FormData = require('form-data');
const fs = require('fs-extra');
const appConstants = require('../config/appConstants');
const crmAuthService = require('../services/crmAuth');
const creditApplicationService = require('../services/creditApplication');
const documentService = require('../services/documents');
const ratingService = require('../services/viewRating');
const PointManagement = require('../services/pointManagement');
const userService = require('../services/user');
const activityLogs = require('../services/activityLogs');
const compress_images = require('compress-images');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const sizeOf = require('image-size');
// const gulp = require('gulp');
// const imagemin = require('gulp-imagemin');
// var gulp = require('gulp');
// var image = require("gulp-image");
// var imagemin = require('gulp-imagemin');
// var jpegRecompress = require("imagemin-jpeg-recompress");
// var mozjpeg = require("imagemin-mozjpeg");
// var jpegoptim = require('jpegoptim-bin');

router.post('/applyCredit', auth.isAuthenticated, (req, res) => {
    logger.info(req.body);

    let validator = new v(req.body, {
        formDetails: 'required',
        userid: 'required',
        docs: 'required'
    });

    // let validator = new v(req.body, {});

    validator.check().then(async function(matched) {
        if (!matched) {
            // res.json(util.failed({}, validator.errors));
            res.json(util.failed({}, 'Mandatory parameters are missing.'));
        }
        let creditApplicationData = req.body;
        try {
            let loginData = await crmAuthService.getCRMAuthToken();
            creditApplicationData.accessToken = loginData.accessToken;
            console.log(loginData.accessToken);

            try {
                let headersObj = {
                    "Authorization": "bearer " + creditApplicationData.accessToken,
                    "Content-Type": "application/json"
                }

                let detailsArr = [];
                let loginId = creditApplicationData.userid;
                let wishlistTypeName = creditApplicationData.wishlistType || "";
                let creditObjectName = "";



                for (let i = 0; i < creditApplicationData.formDetails.length; i++) {
                    detailsArr.push({
                        "name": creditApplicationData.formDetails[i]['apiKey'],
                        "value": creditApplicationData.formDetails[i]['value']
                    })
                    if (wishlistTypeName) {
                        wishlistTypeName = wishlistTypeName.toLowerCase();
                        if (wishlistTypeName.indexOf('electroni') !== -1) {
                            let apiKeyLowercase = creditApplicationData.formDetails[i]['apiKey'].toLowerCase();
                            if (apiKeyLowercase.indexOf('jenis electronik') != -1) {
                                creditObjectName = creditApplicationData.formDetails[i]['value']
                            }
                        }
                        else if (wishlistTypeName.indexOf('furniture') !== -1) {
                            let apiKeyLowercase = creditApplicationData.formDetails[i]['apiKey'].toLowerCase();
                            if (apiKeyLowercase.indexOf('jenis mebel') != -1 && apiKeyLowercase.indexOf('sub') == -1) {
                                creditObjectName = creditApplicationData.formDetails[i]['value']
                            }
                        }
                        else if (wishlistTypeName.indexOf('kendaraan') !== -1) {
                            let apiKeyLowercase = creditApplicationData.formDetails[i]['apiKey'].toLowerCase();
                            if (apiKeyLowercase.indexOf('tipe motor') != -1) {
                                creditObjectName = creditApplicationData.formDetails[i]['value']
                            }
                        }
                        else if (wishlistTypeName.indexOf('dana') !== -1) {
                            let apiKeyLowercase = creditApplicationData.formDetails[i]['apiKey'].toLowerCase();
                            if (apiKeyLowercase.indexOf('dana') != -1) {
                                creditObjectName = creditApplicationData.formDetails[i]['value']
                            }
                        }
                    }
                }

                let getCustomerInfoData = {
                    loginId: creditApplicationData.userid,
                    docCode: '001'
                }

                let customerDocInfoArr = await documentService.getCustomerDocInfo(getCustomerInfoData);
                let customerDocInfo = customerDocInfoArr[0];

                let customerProfileInfo = await userService.getUserDetails(creditApplicationData.userid);

                let userGender = '';
                if (customerProfileInfo.gender == 'male' || customerProfileInfo.gender == 'Male' || customerProfileInfo.gender == 'Laki laki') {
                    userGender = 'm'
                }
                else if (customerProfileInfo.gender == 'female' || customerProfileInfo.gender == 'Female' || customerProfileInfo.gender == "Perempuan") {
                    userGender = 'f'
                }
                let formReqData = {
                    "address": customerDocInfo.ktpaddress || "",
                    "birth_date": customerDocInfo.birthdate || "",
                    "birth_place": customerDocInfo.birthplace || "",
                    "collec_address": customerDocInfo.billingaddress || "",
                    "collec_kecamatan": customerDocInfo.billingsubdistrict || "",
                    "collec_kelurahan": customerDocInfo.billingvillage || "",
                    "collec_kota": customerDocInfo.billingcity || "",
                    "collec_provinsi": customerDocInfo.billingprovince || "",
                    "collec_rt": customerDocInfo.billingneighbourhood || "",
                    "collec_rw": customerDocInfo.billinghamlet || "",
                    "collec_zipcode": customerDocInfo.billingzipcode || "",
                    "dependents": creditApplicationData.dependents || "",
                    "additional_columns": detailsArr,
                    "dom_address": customerDocInfo.stayaddress || "",
                    "dom_kecamatan": customerDocInfo.staysubdistrict || "",
                    "dom_kelurahan": customerDocInfo.stayvillage || "",
                    "dom_kota": customerDocInfo.staycity || "",
                    "dom_provinsi": customerDocInfo.stayprovince || "",
                    "dom_rt": customerDocInfo.stayneighbourhood || "",
                    "dom_rw": customerDocInfo.stayhamlet || "",
                    "dom_zipcode": customerDocInfo.stayzipcode || "",
                    "education": creditApplicationData.education || "",
                    "email": customerProfileInfo.email || "",
                    "full_name": customerDocInfo.idname || "",
                    "home_phone_no": creditApplicationData.homePhoneNo || customerProfileInfo.homephone || "",
                    "house_stat": creditApplicationData.houseStat || "",
                    "kecamatan": customerDocInfo.ktpsubdistrict || "",
                    "kelurahan": customerDocInfo.ktpvillage || "",
                    "kota": customerDocInfo.ktpcity || "",
                    "ktp_no": customerDocInfo.idno || "",
                    "mobile_phone_no": customerProfileInfo.msisdn || "",
                    "occupation": creditApplicationData.occupation || "",
                    "office_phone_no": creditApplicationData.officePhoneNo || "",
                    "provinsi": customerDocInfo.ktpprovince || "",
                    "rt": customerDocInfo.ktpneighbourhood || "",
                    "rw": customerDocInfo.ktphamlet || "",
                    "sex": userGender || "",
                    "user_fmc_id": creditApplicationData.userid,
                    "wishlist_type": creditApplicationData.wishlistType || "",
                    "zipcode": customerDocInfo.ktpzipcode || ""
                }

                let refNoRes = await creditApplicationService.applyCredit(formReqData, headersObj);
                let refNo = "";
                if (refNoRes.message) {
                    refNo = refNoRes.message;
                }

                let uploadFileData = {
                    data: [],
                    files: []
                }
                let d = new Date();
                let createdYear = d.getFullYear();
                createdYear = createdYear.toString();
                let createdMonth = d.getMonth() + 1;
                createdMonth = createdMonth.toString();
                let createdMonthFormatted = createdMonth.length < 2 ? '0' + createdMonth : createdMonth;
                let createdDate = d.getDate();
                createdDate = createdDate.toString();
                let createdDateFormatted = createdDate.length < 2 ? '0' + createdDate : createdDate;
                let createdHours = d.getHours();
                createdHours = createdHours.toString();
                let createdHoursFormatted = createdHours.length < 2 ? '0' + createdHours : createdHours;
                let createdMinutes = d.getMinutes();
                createdMinutes = createdMinutes.toString();
                let createdMinutesFormatted = createdMinutes.length < 2 ? '0' + createdMinutes : createdMinutes;
                let createdSeconds = d.getSeconds();
                createdSeconds = createdSeconds.toString();
                let createdSecondsFormatted = createdSeconds.length < 2 ? '0' + createdSeconds : createdSeconds;
                let createdDateString = createdYear + createdMonthFormatted + createdDateFormatted + createdHoursFormatted + createdMinutesFormatted + createdSecondsFormatted;
                let formFiles = creditApplicationData.docs;

                for (let i = 0; i < formFiles.length; i++) {
                    let filePath = formFiles[i]['path'];
                    let fileName = formFiles[i]['path'].replace("public/staticdata/docs/" + creditApplicationData.userid + "/", "");
                    uploadFileData.files.push(filePath);
                    uploadFileData.data.push({
                        "refNo": refNo,
                        "docCode": formFiles[i]['code'],
                        "fileName": fileName,
                        "docYear": new Date().getFullYear(),
                        "docFolder": appConstants.creditApplicationConstants.docFolder,
                        "createdBy": appConstants.creditApplicationConstants.createdBy,
                        "createdDate": createdDateString,
                        "lat": 0,
                        "lon": 0,
                        "officeCode": appConstants.creditApplicationConstants.officeCode,
                        "flagApplication": appConstants.creditApplicationConstants.flagApplication
                    });
                }
                let uploadHeadersObj = {
                    "Authorization": "bearer " + creditApplicationData.accessToken,
                    "content-type": "multipart/form-data"
                }

                let attachments = [];

                for (let i = 0; i < uploadFileData.files.length; i++) {
                    attachments.push(fs.createReadStream(uploadFileData.files[i]));
                }
               
                const insertReqData = {
                    refNo: refNo,
                    loginId: creditApplicationData.userid,
                    userId: creditApplicationData.userid,
                    itemType: creditObjectName,
                    category: wishlistTypeName
                }
                const formData = {
                    data: JSON.stringify(uploadFileData.data),
                    files: attachments
                };
                logger.info(formData);
                try {
                    let uploadResult = await creditApplicationService.uploadCreditApplicationDocuments(formData, insertReqData, uploadHeadersObj);
                    let ratePayload = {
                        'activityappid': 'APPLY CREDIT'
                    }
                    let ratingData = await ratingService.getRatingData(ratePayload);
                    let requestFromPromotion = creditApplicationData.fromPromotions || false;
                    let actvityAppId = "";
                    let actDescription = "";
                    if (requestFromPromotion) {
                        actvityAppId = "CREDIT APP PROMO";
                        actDescription = "Credit Application Submitted from Promotions";
                    }
                    else {
                        actvityAppId = "CREDIT APP SUB";
                        actDescription = "Credit Application Submitted";
                    }
                    let pointsData = {
                        loginid: creditApplicationData.userid,
                        activityappid: actvityAppId,
                        description: actDescription
                    }
                    let pointsRes = await PointManagement.addPointsForActivity(pointsData);
                    let points = 0;
                    let pointsDescription = "";
                    if (pointsRes.currentPoints) {
                        points = pointsRes.currentPoints;
                        pointsDescription = util.getPointDescriptionContent(pointsRes.currentPoints);
                    }
                    let ratingDesc = "";
                    if (ratingData && ratingData.title) {
                        ratingDesc = ratingData.title;
                    }
                    res.json(util.success(uploadResult, '', ratingDesc, points, pointsDescription));
                }
                catch (err) {
                    logger.error(err);
                    res.json(util.failed(err));
                }
                // let fileSizeLarger = false;
                // for (let i = 0; i < formFiles.length; i++) {
                //     let stats = fs.statSync(formFiles[i]['path']);
                //     let fileSizeInMB = stats["size"] || 0;
                //     let fileSize = parseFloat(formatBytes(fileSizeInMB));
                //     fileSize = fileSize.toFixed(2);
                //     logger.info('--------file size--------'+ fileSize);
                //     if (fileSize > 1) {
                //         fileSizeLarger = true;
                //         break;
                //     }
                // }
                // totalFileSize = totalFileSize.toFixed(2);
                // if (fileSizeLarger){
                //     try {
                //         let errCount = 0;
                //         let imgCount = 0;
                //         compress_images("public/staticdata/docs/"+creditApplicationData.userid+"/*.{jpg,JPG,jpeg,JPEG,png,PNG,svg,gif}", 
                //         "public/staticdata/docs/"+creditApplicationData.userid+"/compressed/", 
                //         {compress_force: false, statistic: true, autoupdate: true}, false,
                //         {jpg: {engine: 'mozjpeg', command: ['-quality', '50']}},
                //         {png: {engine: 'pngquant', command: ['--quality=1-2']}},
                //         {svg: {engine: 'svgo', command: '--multipass'}},
                //         {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, 
                //         async function(err, completed, statistic){
                //             if (err){
                //                 logger.error('compress alog failed');
                //                 logger.error(err);
                //                 uploadFileData.data = [];
                //                 uploadFileData.files = [];
                //                 for (let i = 0; i < formFiles.length; i++) {
                //                     let filePath = formFiles[i]['path'];
                //                     let fileName = formFiles[i]['path'].replace("public/staticdata/docs/"+creditApplicationData.userid+"/","");
                //                     uploadFileData.files.push(filePath);
                //                     uploadFileData.data.push({
                //                         "refNo": refNo,
                //                         "docCode": formFiles[i]['code'],
                //                         "fileName": fileName,
                //                         "docYear": new Date().getFullYear(),
                //                         "docFolder": appConstants.creditApplicationConstants.docFolder,
                //                         "createdBy": appConstants.creditApplicationConstants.createdBy,
                //                         "createdDate": createdDateString,
                //                         "lat": 0,
                //                         "lon": 0,
                //                         "officeCode": appConstants.creditApplicationConstants.officeCode,
                //                         "flagApplication": appConstants.creditApplicationConstants.flagApplication
                //                         });
                //                     }
                //                     let uploadHeadersObj = {
                //                         "Authorization": "bearer " + creditApplicationData.accessToken,
                //                         "content-type": "multipart/form-data"
                //                     }

                //                     let attachments = [];
                //                     for (let i = 0; i < uploadFileData.files.length; i++) {
                //                         attachments.push(fs.createReadStream(uploadFileData.files[i]));
                //                     }

                //                     const insertReqData = {
                //                         refNo: refNo,
                //                         loginId: creditApplicationData.userid,
                //                         userId: creditApplicationData.userid,
                //                         itemType: creditObjectName,
                //                         category: wishlistTypeName
                //                     }

                //                     const formData = {
                //                         data: JSON.stringify(uploadFileData.data),
                //                         files: attachments
                //                     };

                //                     logger.info(formData);
                //                     try {
                //                         let uploadResult = await creditApplicationService.uploadCreditApplicationDocuments(formData, insertReqData, uploadHeadersObj);
                //                         let ratePayload = {
                //                             'activityappid': 'APPLY CREDIT'
                //                         }
                //                         let ratingData = await ratingService.getRatingData(ratePayload);
                //                         let requestFromPromotion = creditApplicationData.fromPromotions || false;
                //                         let actvityAppId = "";
                //                         let actDescription = "";
                //                         if (requestFromPromotion) {
                //                             actvityAppId = "CREDIT APP PROMO";
                //                             actDescription = "Credit Application Submitted from Promotions";
                //                         }
                //                         else {
                //                             actvityAppId = "CREDIT APP SUB";
                //                             actDescription = "Credit Application Submitted";
                //                         }
                //                         let pointsData = {
                //                             loginid: creditApplicationData.userid,
                //                             activityappid: actvityAppId,
                //                             description: actDescription
                //                         }
                //                         let pointsRes = await PointManagement.addPointsForActivity(pointsData);
                //                         let points = 0;
                //                         let pointsDescription = "";
                //                         if (pointsRes.currentPoints){
                //                             points = pointsRes.currentPoints;
                //                             pointsDescription = util.getPointDescriptionContent(pointsRes.currentPoints);
                //                         }
                //                         let ratingDesc = "";
                //                         if (ratingData && ratingData.title) {
                //                             ratingDesc = ratingData.title;
                //                         }
                //                         res.json(util.success(uploadResult,'',ratingDesc, points, pointsDescription));
                //                     }
                //                     catch(err) {
                //                         logger.error(err);
                //                         res.json(util.failed(err));
                //                     }

                //             } 
                //             else if (completed === true) {
                //               for (let i = 0; i < formFiles.length; i++) {
                //                 let newFilePath = formFiles[i]['path'].replace("public/staticdata/docs/"+creditApplicationData.userid+"/","public/staticdata/docs/"+creditApplicationData.userid+"/compressed/");
                //                 let fileName = formFiles[i]['path'].replace("public/staticdata/docs/"+creditApplicationData.userid+"/","");
                //                 uploadFileData.files.push(newFilePath);
                //                 uploadFileData.data.push({
                //                     "refNo": refNo,
                //                     "docCode": formFiles[i]['code'],
                //                     "fileName": fileName,
                //                     "docYear": new Date().getFullYear(),
                //                     "docFolder": appConstants.creditApplicationConstants.docFolder,
                //                     "createdBy": appConstants.creditApplicationConstants.createdBy,
                //                     "createdDate": createdDateString,
                //                     "lat": 0,
                //                     "lon": 0,
                //                     "officeCode": appConstants.creditApplicationConstants.officeCode,
                //                     "flagApplication": appConstants.creditApplicationConstants.flagApplication
                //                     });
                //                 }
                //                 let uploadHeadersObj = {
                //                     "Authorization": "bearer " + creditApplicationData.accessToken,
                //                     "content-type": "multipart/form-data"
                //                 }

                //                 let attachments = [];
                //                 for (let i = 0; i < uploadFileData.files.length; i++) {
                //                     attachments.push(fs.createReadStream(uploadFileData.files[i]));
                //                 }

                //                 const insertReqData = {
                //                     refNo: refNo,
                //                     loginId: creditApplicationData.userid,
                //                     userId: creditApplicationData.userid,
                //                     itemType: creditObjectName,
                //                     category: wishlistTypeName
                //                 }

                //                 const formData = {
                //                     data: JSON.stringify(uploadFileData.data),
                //                     files: attachments
                //                 };

                //                 logger.info(formData);
                //                 try {
                //                     let uploadResult = await creditApplicationService.uploadCreditApplicationDocuments(formData, insertReqData, uploadHeadersObj);
                //                     let ratePayload = {
                //                         'activityappid': 'APPLY CREDIT'
                //                     }
                //                     let ratingData = await ratingService.getRatingData(ratePayload);
                //                     let requestFromPromotion = creditApplicationData.fromPromotions || false;
                //                     let actvityAppId = "";
                //                     let actDescription = "";
                //                     if (requestFromPromotion) {
                //                         actvityAppId = "CREDIT APP PROMO";
                //                         actDescription = "Credit Application Submitted from Promotions";
                //                     }
                //                     else {
                //                         actvityAppId = "CREDIT APP SUB";
                //                         actDescription = "Credit Application Submitted";
                //                     }
                //                     let pointsData = {
                //                         loginid: creditApplicationData.userid,
                //                         activityappid: actvityAppId,
                //                         description: actDescription
                //                     }
                //                     let pointsRes = await PointManagement.addPointsForActivity(pointsData);
                //                     let points = 0;
                //                     let pointsDescription = "";
                //                     if (pointsRes.currentPoints){
                //                         points = pointsRes.currentPoints;
                //                         pointsDescription = util.getPointDescriptionContent(pointsRes.currentPoints);
                //                     }
                //                     let ratingDesc = "";
                //                     if (ratingData && ratingData.title) {
                //                         ratingDesc = ratingData.title;
                //                     }
                //                     res.json(util.success(uploadResult,'',ratingDesc, points, pointsDescription));
                //                 }
                //                 catch(err) {
                //                     logger.error(err);
                //                     res.json(util.failed(err));
                //                 }
                //             }                 
                //         });
                //     }
                //     catch(err){
                //         res.json(util.failed(err));
                //     }
                // }
                // else {

                // }

            } catch (err) {
                res.json(util.failed(err));
            }
        } catch (err) {
            res.json(util.failed(err));
        }
    });
});


router.post('/uploadDoc', auth.isAuthenticated, (req, res) => {

    var form = new multiparty.Form();

    form.parse(req, function (err, fields, files) {
        let refNo = fields['refNo'][0];
        let dataArr = [];
        let fileArr = [];
        let d = new Date();
        let createdMonth = d.getMonth() + 1;
        let createdDate = d.getFullYear() + '' + createdMonth + '' + d.getDate() + '' + d.getHours() + '' + d.getMinutes() + '' + d.getSeconds();

        let formFiles = files['files'];

        for (let i = 0; i < formFiles.length; i++) {
            dataArr.push({
                "refNo": refNo,
                "docCode": "001",
                "fileName": formFiles[i]['originalFilename'],
                "docYear": new Date().getFullYear(),
                "docFolder": appConstants.creditApplicationConstants.docFolder,
                "createdBy": appConstants.creditApplicationConstants.createdBy,
                "createdDate": "20181204150000",
                "lat": 0,
                "lon": 0,
                "officeCode": appConstants.creditApplicationConstants.officeCode,
                "flagApplication": appConstants.creditApplicationConstants.flagApplication
            })
            let oldpath = formFiles[i].path;
            let dir = './public/staticdata/docs/';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            let newpath = dir + formFiles[i].originalFilename;
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                fileArr.push(formFiles[i].originalFilename);
            });
        }

        let uploadFileData = {
            data: dataArr,
            files: fileArr
        }

        let cmsLoginObj = {
            username: appConstants.crmAuthCredentials.authUsername,
            password: appConstants.crmAuthCredentials.authPassword,
            clientId: appConstants.crmAuthCredentials.authClientId,
            clientSecret: appConstants.crmAuthCredentials.authClientSecret,
            grantType: appConstants.crmAuthCredentials.authGrantType
        }


        getCMSUserAccessToken(cmsLoginObj, req, res, function (err, loginData) {
            if (err) {
                console.log(err);
                res.json(util.failed({}, 'API failed'));

            }
            uploadFileData.accessToken = loginData.accessToken;

            callCRMUploadFileApi(uploadFileData, req, res, function (err, uploadDocResponse) {

                if (err) {
                    console.log(err);
                    res.json(util.failed({}, 'API failed'));
                }
                let resObj = {}
                res.json(util.success(resObj));

            });

        });

    });

});

function getCMSUserAccessToken(loginCredentials, req, res, cb) {
    let formReqData = {
        username: loginCredentials.username,
        password: loginCredentials.password,
        client_id: loginCredentials.clientId,
        client_secret: loginCredentials.clientSecret,
        grant_type: loginCredentials.grantType
    }
    request.post({
        url: appConstants.fifCreditAuthUrl,
        form: formReqData
    },
        function (err, httpResponse, body) {
            // 
            if (!err) {
                body = JSON.parse(body);
                // console.log(body);

                if (body.access_token) {
                    let obj = {
                        accessToken: body.access_token
                    }
                    cb(null, obj);
                } else {
                    let errObj = {
                        'error': 'Invalid User Credentials'
                    }
                    cb(errObj);
                }
            } else {
                let errObj = {
                    'error': 'Invalid User Credentials'
                }
                cb(errObj);
            }
        });

}

function callCRMUploadFileApi(fileUploadData, req, res, cb) {
    let headersObj = {
        "Authorization": "bearer " + fileUploadData.accessToken,
        "content-type": "multipart/form-data"
    }

    let attachments = [];
    for (let i = 0; i < fileUploadData.files.length; i++) {
        var path = './public/staticdata/docs/';
        attachments.push(fs.createReadStream(path + fileUploadData.files[i]));
    }


    const formData = {
        data: JSON.stringify(fileUploadData.data),
        files: attachments
    };


    request.post({
        headers: {
            "Authorization": "bearer " + fileUploadData.accessToken
        },
        url: appConstants.fifCRMBaseUrl + 'crm/v1/wishlist/upload/files',
        formData: formData
    }, function optionalCallback(err, httpResponse, body) {

        if (err) {
            console.error('upload failed:', err);
            cb(err);
        }
        console.log('Upload successful!  Server responded with:', body);
        for (let i = 0; i < fileUploadData.files.length; i++) {
            var path = './public/staticdata/docs/';
            let filePath = path + fileUploadData.files[i];

            fs.unlinkSync(filePath);
        }

        cb(null, body);
    });
}

function formatBytes(sizeInBytes) {
    let sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return sizeInMB;
};

function callCRMCreditApplicationAPI(creditAppData, req, res, cb) {
    let detailsArr = [];

    for (let i = 0; i < creditAppData.formDetails.length; i++) {
        detailsArr.push({
            "name": creditAppData.formDetails[i]['apiKey'],
            "value": creditAppData.formDetails[i]['value']
        })
    }

    let formReqData = {
        "address": creditAppData.address,
        "birth_date": creditAppData.birthDate,
        "birth_place": creditAppData.birthPlace,
        "collec_address": creditAppData.collecAddress,
        "collec_kecamatan": creditAppData.collecSubDistrict,
        "collec_kelurahan": creditAppData.collecVillage,
        "collec_kota": creditAppData.collecCity,
        "collec_provinsi": creditAppData.collecProvince,
        "collec_rt": creditAppData.collecNeighbourhood,
        "collec_rw": creditAppData.collecHamlet,
        "collec_zipcode": creditAppData.collecZipCode,
        "dependents": creditAppData.dependents,
        "details": detailsArr,
        "dom_address": creditAppData.domAddress,
        "dom_kecamatan": creditAppData.domSubDistrict,
        "dom_kelurahan": creditAppData.domVillage,
        "dom_kota": creditAppData.domCity,
        "dom_provinsi": creditAppData.domProvince,
        "dom_rt": creditAppData.domNeighbourhood,
        "dom_rw": creditAppData.domHamlet,
        "dom_zipcode": creditAppData.domZipcode,
        "education": creditAppData.education,
        "email": creditAppData.email,
        "full_name": creditAppData.fullName,
        "home_phone_no": creditAppData.homePhoneNo,
        "house_stat": creditAppData.houseStat,
        "kecamatan": creditAppData.subDistrict,
        "kelurahan": creditAppData.village,
        "kota": creditAppData.city,
        "ktp_no": creditAppData.ktpNo,
        "mobile_phone_no": creditAppData.mobilePhoneNo,
        "occupation": creditAppData.occupation,
        "office_phone_no": creditAppData.officePhoneNo,
        "provinsi": creditAppData.province,
        "rt": creditAppData.neighbourhood,
        "rw": creditAppData.hamlet,
        "sex": creditAppData.sex,
        "user_fmc_id": creditAppData.userId,
        "wishlist_type": "string",
        "zipcode": creditAppData.zipCode
    }

}

module.exports = router;
