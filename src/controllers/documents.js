var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const fs = require('fs-extra');
const DocumentsService = require('../services/documents');
const User = require('../models/user');
var path = require('path');
var multer = require('multer');
const v = require('node-input-validator');
const activityLogs = require('../services/activityLogs');
const Documents = require('../models/documents');

router.get('/documents/getList', auth.isAuthenticated, async (req, res) => {
    try {
        let documentList = await DocumentsService.getDocumentList();
        res.json(util.success(documentList));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.get('/documents/getSourceList', auth.isAuthenticated, async (req, res) => {
    try {
        let sourceList = await DocumentsService.getSourceList();
        res.json(util.success(sourceList));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/documents/getAllCustomerDocuments', auth.isAuthenticated, async (req, res) => {
    try {
        let customerDocumentsListData = await DocumentsService.getAllCustomerDocuments(req.body);
        let customerDocumentsList = [];
        if (customerDocumentsListData.data) {
            customerDocumentsList = customerDocumentsListData.data
        }
        let customerDocData = [];


        for (let i = 0; i < customerDocumentsList.length; i++) {
            let docsData = [];
            for (var j = 0; j < customerDocumentsList[i]['codes'].length; j++) {
                docsData.push({
                    'code': customerDocumentsList[i]['codes'][j],
                    'title': customerDocumentsList[i]['titles'][j]
                })
            }

            customerDocData.push({
                'userId': customerDocumentsList[i]['custid'],
                'userName': customerDocumentsList[i]['name'],
                'docs': docsData
            })
        }

        let resObj = {
            data: customerDocData,
            totalRecords: customerDocumentsListData.totalRecords
        }
        res.json(util.success(resObj));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/documents/getAllCustomerDocumentsCount', auth.isAuthenticated, async (req, res) => {
    try {
        let customerDocumentsListDataCount = await DocumentsService.getAllCustomerDocumentsCount(req.body);
        res.json(util.success(customerDocumentsListDataCount));
    } catch (err) {
        res.json(util.failed(err));
    }
});

router.post('/documents/getAppDocuments', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        try {
            let allDocumentsList = await DocumentsService.getDocumentList();
            try {
                let customerDocumentsList = await DocumentsService.getCustomerDocuments(req.body);
                let reqSrc = "";
                if (req.body.src) {
                    reqSrc = req.body.src;
                }
                console.log(allDocumentsList);
                console.log(customerDocumentsList);
                for (let i = 0; i < allDocumentsList.length; i++) {
                    allDocumentsList[i].isMandatory = false;
                    if (allDocumentsList[i]['mandatoryfor']) {
                        if (allDocumentsList[i]['mandatoryfor'].indexOf(reqSrc) != -1) {
                            allDocumentsList[i].isMandatory = true;
                            allDocumentsList[i].title = allDocumentsList[i].title + ' (Wajib)';
                        }
                    }

                    allDocumentsList[i].toDisplay = false;
                    if (allDocumentsList[i]['modules']) {
                        if (allDocumentsList[i]['modules'].indexOf(reqSrc) != -1) {
                            allDocumentsList[i].toDisplay = true;
                        }
                    }

                    allDocumentsList[i].isuploaded = false;
                    allDocumentsList[i].path = [];
                    allDocumentsList[i].subCodes = [];

                    allDocumentsList[i].idno = "";
                    allDocumentsList[i].gender = "";
                    allDocumentsList[i].birthplace = "";
                    allDocumentsList[i].birthdate = "";

                    allDocumentsList[i].ktpAddress = "";
                    allDocumentsList[i].ktpSubDistrict = "";
                    allDocumentsList[i].ktpVillage = "";
                    allDocumentsList[i].ktpCity = "";
                    allDocumentsList[i].ktpProvince = "";
                    allDocumentsList[i].ktpNeighbourhood = "";
                    allDocumentsList[i].ktpHamlet = "";
                    allDocumentsList[i].ktpZipCode = "";

                    allDocumentsList[i].stayAddress = "";
                    allDocumentsList[i].staySubDistrict = "";
                    allDocumentsList[i].stayVillage = "";
                    allDocumentsList[i].stayCity = "";
                    allDocumentsList[i].stayProvince = "";
                    allDocumentsList[i].stayNeighbourhood = "";
                    allDocumentsList[i].stayHamlet = "";
                    allDocumentsList[i].stayZipCode = "";

                    allDocumentsList[i].billingAddress = "";
                    allDocumentsList[i].billingSubDistrict = "";
                    allDocumentsList[i].billingVillage = "";
                    allDocumentsList[i].billingCity = "";
                    allDocumentsList[i].billingProvince = "";
                    allDocumentsList[i].billingNeighbourhood = "";
                    allDocumentsList[i].billingHamlet = "";
                    allDocumentsList[i].billingZipCode = "";


                    allDocumentsList[i].isuploaded = false;
                }
                for (let i = 0; i < allDocumentsList.length; i++) {
                    let ssCount = 0;
                    for (let j = 0; j < customerDocumentsList.length; j++) {
                        if (allDocumentsList[i].code == customerDocumentsList[j].code) {
                            if (allDocumentsList[i].code != '004') {
                                allDocumentsList[i].isuploaded = true;
                                allDocumentsList[i].path.push(customerDocumentsList[j].idpath);
                            }
                            else if (allDocumentsList[i].code == '004') {
                                allDocumentsList[i].isuploaded = true;
                                allDocumentsList[i].path.push(customerDocumentsList[j].idpath);
                                if (customerDocumentsList[j].idsubcode) {
                                    allDocumentsList[i].subCodes.push(customerDocumentsList[j].idsubcode);
                                }
                                // ssCount++;
                                // if (ssCount == 3) {
                                //
                                // }
                            }

                            allDocumentsList[i].idno = customerDocumentsList[j].idno;
                            allDocumentsList[i].gender = customerDocumentsList[j].gender;
                            allDocumentsList[i].birthplace = customerDocumentsList[j].birthplace;
                            allDocumentsList[i].birthdate = customerDocumentsList[j].birthdate;

                            allDocumentsList[i].ktpAddress = customerDocumentsList[j].ktpaddress;
                            allDocumentsList[i].ktpSubDistrict = customerDocumentsList[j].ktpsubdistrict;
                            allDocumentsList[i].ktpVillage = customerDocumentsList[j].ktpvillage;
                            allDocumentsList[i].ktpCity = customerDocumentsList[j].ktpcity;
                            allDocumentsList[i].ktpProvince = customerDocumentsList[j].ktpprovince;
                            allDocumentsList[i].ktpNeighbourhood = customerDocumentsList[j].ktpneighbourhood;
                            allDocumentsList[i].ktpHamlet = customerDocumentsList[j].ktphamlet;
                            allDocumentsList[i].ktpZipCode = customerDocumentsList[j].ktpzipcode;

                            allDocumentsList[i].stayAddress = customerDocumentsList[j].stayaddress;
                            allDocumentsList[i].staySubDistrict = customerDocumentsList[j].staysubdistrict;
                            allDocumentsList[i].stayVillage = customerDocumentsList[j].stayvillage;
                            allDocumentsList[i].stayCity = customerDocumentsList[j].staycity;
                            allDocumentsList[i].stayProvince = customerDocumentsList[j].stayprovince;
                            allDocumentsList[i].stayNeighbourhood = customerDocumentsList[j].stayneighbourhood;
                            allDocumentsList[i].stayHamlet = customerDocumentsList[j].stayhamlet;
                            allDocumentsList[i].stayZipCode = customerDocumentsList[j].stayzipcode;

                            allDocumentsList[i].billingAddress = customerDocumentsList[j].billingaddress;
                            allDocumentsList[i].billingSubDistrict = customerDocumentsList[j].billingsubdistrict;
                            allDocumentsList[i].billingVillage = customerDocumentsList[j].billingvillage;
                            allDocumentsList[i].billingCity = customerDocumentsList[j].billingcity;
                            allDocumentsList[i].billingProvince = customerDocumentsList[j].billingprovince;
                            allDocumentsList[i].billingNeighbourhood = customerDocumentsList[j].billingneighbourhood;
                            allDocumentsList[i].billingHamlet = customerDocumentsList[j].billinghamlet;
                            allDocumentsList[i].billingZipCode = customerDocumentsList[j].billingzipcode;


                        }
                    }
                }

                let finalDocs = [];

                for (let j = 0; j < allDocumentsList.length; j++) {
                    if (allDocumentsList[j]['toDisplay'] == true) {
                        finalDocs.push(allDocumentsList[j]);
                    }
                }

                res.json(util.success(finalDocs));

            } catch (err) {
                res.json(util.failed(err));
            }
        } catch (err) {
            res.json(util.failed(err));
        }
    } catch (err) {
        res.json(util.failed(err));
    }
});


router.post('/documents/add', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await DocumentsService.addDocument(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/documents/update', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await DocumentsService.updateDocument(req.body)
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/documents/delete', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let result = await DocumentsService.deleteDocument(req.body.code);
        res.json(util.success(result));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/documents/upload/:loginId', auth.isAuthenticated, async (req, res) => {
    uploadDocument(req, res);
});


router.post('/documents/uploadSalarySlip', auth.isAuthenticated, async (req, res) => {
    await uploadSalaryDocuments(req, res);
});

/** Serving from the same express Server
 No cors required */

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        var loginId = req.params.loginId ? "/" + req.params.loginId : "";
        var path = './public/staticdata/docs' + loginId;
        fs.mkdirsSync(path);
        cb(null, path);
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();

        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('image');

function uploadDocument(req, res) {
    upload(req, res, async function (err) {

        console.log(req.file);
        if (err) {
            logger.error(err);
            res.send(util.failed(err, "file not found in request body"));
        }
        else {
            if (req.file) {
                if (req.body.docCode) {
                    console.log(req.body);
                    var path = req.file.path || "";
                    path = path.replace(/\\/g, "/") || "";
                    let object = {
                        filePath: path
                    }
                    try {
                        let documentData = {
                            loginId: req.params.loginId || "",
                            docCode: req.body.docCode || "",
                            docSubCode: req.body.docSubCode || "0"
                        }

                        if ((documentData.docCode == "004" && (documentData.docSubCode == "1" || documentData.docSubCode == "2" || documentData.docSubCode == "3") || (documentData.docCode != "004" && documentData.docSubCode == "0"))) {

                            if (documentData.docCode != "004") {
                                let customerDoc = await DocumentsService.getCustomerDocument(documentData);
                                let payload = req.body;
                                payload.path = path;
                                payload.loginId = req.params.loginId;
                                if (customerDoc.length > 0) {
                                    try {
                                        await DocumentsService.updateCustomerDocumentDetails(payload);
                                        let loginId = req.params.loginId;
                                        let activityData = util.prepareActivityLogsData(loginId, 'Document uploaded', 'Document uploaded');
                                        await activityLogs.createActivityLog(activityData);
                                        res.send(util.success(object, "File uploaded successfully"));
                                    }
                                    catch (err) {
                                        res.json(util.failed(err));
                                    }
                                }
                                else {
                                    try {
                                        let docRes = await DocumentsService.addCustomerDocumentDetails(payload);
                                        let pointsAdded = 0;
                                        let pointDescription = "";
                                        if (docRes && docRes.pointsAdded) {
                                            pointsAdded = docRes.pointsAdded;
                                            pointDescription = util.getPointDescriptionContent(pointsAdded);
                                        }
                                        let loginId = req.params.loginId;
                                        let activityData = util.prepareActivityLogsData(loginId, 'Document uploaded', 'Document uploaded');
                                        await activityLogs.createActivityLog(activityData);
                                        let user = {
                                            loginId: loginId
                                        }
                                        let allDocumentsUploaded = await checkIfAllDocumentsUploaded(user);



                                        console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&');
                                        console.log(allDocumentsUploaded);
                                        if (allDocumentsUploaded) {
                                            logger.info("\n\n updating complete document identifier .. \n\n");
                                            user.isdocumentuploaded = 1;
                                            let isDocumentComplete = await User.updateUserCompleteDocumentsStatus(user);
                                        }
                                        res.send(util.success(object, "File uploaded successfully", '', pointsAdded,pointDescription));
                                    }
                                    catch (err) {
                                        res.json(util.failed(err));
                                    }
                                }
                            }
                            else {
                                let loginId = req.params.loginId;
                                let activityData = util.prepareActivityLogsData(loginId, 'Document uploaded', 'Document uploaded');
                                await activityLogs.createActivityLog(activityData);
                                res.send(util.success(object, "File uploaded successfully", '', 0));
                            }
                        }
                        else {
                            return res.json(util.failed("Please check your input."));
                        }


                    } catch (err) {
                        return res.json(util.failed(err));
                    }
                }
                else {
                    return res.json(util.failed("Doc code not found"));
                }
            } else {
                return res.json(util.failed("File not found"));
            }
        }
    });
}

async function uploadSalaryDocuments(req, res) {

    let validator = new v(req.body, {
        loginId: 'required',
        docs: 'required'
    });

    // let validator = new v(req.body, {});

    validator.check().then(async function(matched) {
        if (!matched) {
            // res.json(util.failed({}, validator.errors));
            res.json(util.failed({},'Mandatory parameters are missing.'));
        }
        try{
            let docs = req.body.docs;
            if (docs.length == 3) {
                let docUploaded = 0;
                let docRes;
                for (let i =0; i < docs.length; i++) {
                    let documentData = {
                        loginId: req.body.loginId || "",
                        docCode: docs[i].docCode || "",
                        docSubCode: docs[i].docSubCode || "0",
                        path: docs[i].path
                    }

                    console.log(documentData);

                    if ((documentData.docCode == "004" && (documentData.docSubCode == "1" || documentData.docSubCode == "2" || documentData.docSubCode == "3") || (documentData.docCode != "004" && documentData.docSubCode == "0"))) {

                        let customerDoc = await DocumentsService.getCustomerDocument(documentData);
                        if (customerDoc.length > 0) {
                            try {
                                await DocumentsService.updateCustomerDocumentDetails(documentData);
                                docUploaded++;
                                // res.send(util.success({}, "File uploaded successfully"));
                            }
                            catch (err) {
                                res.json(util.failed(err));
                            }
                        }
                        else {
                            try {
                                docRes = await DocumentsService.addCustomerDocumentDetails(documentData);

                                docUploaded++;
                                // res.send(util.success({}, "File uploaded successfully", '', pointsAdded));
                            }
                            catch (err) {
                                res.json(util.failed(err));
                            }
                        }
                    }
                    else {
                        return res.json(util.failed("Please check your input."));
                    }
                }
                if (docUploaded == 3) {
                    let pointsAdded = 0;
                    let pointDescription = "";
                    if (docRes && docRes.pointsAdded) {
                        pointsAdded = docRes.pointsAdded;
                        pointDescription = util.getPointDescriptionContent(pointsAdded);
                    }
                    res.send(util.success({}, "File uploaded successfully", '', pointsAdded,pointDescription));
                }
            }
            else {
                return res.json(util.failed("Please upload all the salary slips."));
            }

        } catch(err) {
            res.json(util.failed(err));
        }
    });
}

async function checkIfAllDocumentsUploaded(data){
    let allUploaded = true;
    let allDocumentsList = await Documents.getDocumentList();
    let customerDocumentsList = await Documents.getCustomerDocuments(data);
    for (let i = 0; i < allDocumentsList.length; i++) {
        allDocumentsList[i].isuploaded = false;
    }
    for (let i = 0; i < allDocumentsList.length; i++) {
        let ssCount = 0;
        for (let j = 0; j < customerDocumentsList.length; j++) {
            if (allDocumentsList[i].code == customerDocumentsList[j].code) {
                if (allDocumentsList[i].code != '004') {
                    allDocumentsList[i].isuploaded = true;
                }
                else if (allDocumentsList[i].code == '004') {
                    ssCount++;
                    if (ssCount == 3) {
                        allDocumentsList[i].isuploaded = true;
                    }
                }
            }
        }
    }

    allDocumentsList.forEach(function(record){
        if (!record.isuploaded){
            allUploaded = false;
        }
    })
    return(allUploaded);
}


function validateRequest(payload) {
    return false;
}

module.exports = router;
