var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const notificationService = require('../services/notification');
const fcmNotificationService = require('../services/fcmPushNotification');
const basePath = '/notification';
const User = require('../models/user');
const Notification = require('../models/notification')
const activityLogs = require('../services/activityLogs');
const XLSX = require('xlsx')
const excel = require('exceljs')
const multer = require('multer');
const moment = require('moment')


//auction setup
router.post(basePath + '/create', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await notificationService.createNotification(req.body)
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }
});
router.post(basePath + '/update', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await notificationService.updateNotification(req.body);
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post(basePath + '/delete', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await notificationService.deleteNotification(req.body);
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post(basePath + '/inbox', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let notifications = await notificationService.getNotificationByUserId(req.body)
        res.json(util.success(notifications));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post(basePath + '/push', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let notifications = await fcmNotificationService.pushFCMNotification();
        res.json(util.success(notifications));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post(basePath + '/detail', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let notifications = await notificationService.notificationDetail(req.body);

        let loginId = req.body.userid || 0;

        let activityData = util.prepareActivityLogsData(loginId, 'Viewed Notification Detail', 'Viewed Notification Detail');
        await activityLogs.createActivityLog(activityData);

        res.json(util.success(notifications));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post(basePath + '/getNotificationFrequencyDetail', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let data = {
            activityAppId: req.body.activityAppId || ""
        }
        let frequencyData = await notificationService.getNotificationFrequency(data);

        res.json(util.success(frequencyData));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post(basePath + '/setNotificationFrequency', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let data = {};
        let payload = req.body;
        data.loginId = payload.loginId || 0;
        data.activityAppId = payload.activityAppId;
        data.frequencyType = payload.frequencyType;
        data.frequency = payload.frequency;
        data.days = payload.days || [];
        data.dates = payload.dates || [];
        data.times = payload.times || [];

        let getData = {
            activityAppId: req.body.activityAppId || ""
        }
        let frequencyData = await notificationService.getNotificationFrequency(getData);
        let frequencyRes = {};
        if (frequencyData && frequencyData.id) {
            frequencyRes = await notificationService.updateNotificationFrequency(data);
        } else {
            frequencyRes = await notificationService.createNotificationFrequency(data);
        }
        res.json(util.success(frequencyRes));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post(basePath + '/updateNotificationFrequency', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let data = {};
        let payload = req.body;
        data.loginId = payload.loginId || 0;
        data.activityAppId = payload.activityAppId;
        data.frequencyType = payload.frequencyType;
        data.frequency = payload.frequency;
        data.days = payload.days || [];
        data.dates = payload.dates || [];
        data.times = payload.times || [];

        let frequencyRes = await notificationService.updateNotificationFrequency(data);

        res.json(util.success(frequencyRes));
    } catch (err) {
        res.json(util.failed(err));
    }

});
/* -----------File Upload ----------------*/
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/staticdata/excelFile')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({ storage })

router.post('/uploadFile', upload.single('filesource'), async function (req, res, next) {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let fileData = {
            file: req.file,
            filepath: req.file.path,
            loginid: req.body.loginid,
            type: req.body.type,
            scheduledate: req.body.scheduledate,
            status: req.body.status,
            title: req.body.title,
            message: req.body.message,
        }
        let fileInfo = await notificationService.uploadFile(fileData)
        res.json(util.success(fileInfo));
    } catch (err) {
        res.json(util.failed(err));
    }

})
router.post('/getUploadedData', auth.isAuthenticated, async (req, res) => {
    try {
        let uploadedData = await notificationService.getUploadedData(req.body);
        res.json(util.success(uploadedData));
    } catch (err) {
        res.json(util.failed(err));
    }
});
router.get('/edit', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        const id = parseInt(req.body.id)
        console.log(id)
        uploadedData = await Notification.getExcelDataById(id);
        res.json(util.success(uploadedData));

    } catch (err) {
        res.json(util.failed(err));
    }

})
router.put('/update', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        const id = parseInt(req.body.id)
        let filedata = {
            title: req.body.title,
            message: req.body.message,
            scheduledate: req.body.scheduledate,
        }
        updatedData = await Notification.updateExcelDataById(id, filedata);
        // console.log(updatedData)
        res.json(util.success(updatedData));

    } catch (err) {
        res.json(util.failed(err));
    }

})
router.post('/delete', async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        const id = parseInt(req.body.id)
        console.log(id)
        deletedData = await Notification.deleteUserById(id);
        res.json(util.success(deletedData));

    } catch (err) {
        res.json(util.failed(err));
    }

})
router.get("/downloadExcel", async (req, res) => {
    const fileid = parseInt(req.query.fileid)
    await Notification.downloadExcel(fileid).then((result) => {
        let downloads = [];
        result.forEach((data) => {
            let insertDate = moment(data.insertdate).tz('Asia/Jakarta').format('MMMM Do YYYY, H:mm:ss')
            let scheduleDate = moment(data.scheduledate).tz('Asia/Jakarta').format('MMMM Do YYYY, H:mm:ss')
            downloads.push({
                fileid: data.fileid,
                type: data.type,
                number: data.number,
                title: data.title,
                message: data.message,
                description: data.description,
                insertdate: insertDate,
                scheduledate: scheduleDate,
                status: data.status,
            });
        })
        console.log(downloads)
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("Download");
        worksheet.columns = [
            { header: "Type", key: "type", width: 17 },
            { header: "Value", key: "number", width: 15 },
            { header: "Title", key: "title", width: 20 },
            { header: "Create Date", key: "insertdate", width: 15, },
            { header: "Send Date", key: "scheduledate", width: 15, },
            { header: "Remarks / Notification Description", key: "message", width: 20 },
            { header: "Validation Status", key: "status", width: 10 },
            { header: "Description", key: "description", width: 20 },
        ];
        worksheet.addRows(downloads);
        // console.log(worksheet)
        let rowIndex = 1;
        for (rowIndex; rowIndex <= worksheet.rowCount; rowIndex++) {
            worksheet.getRow(rowIndex).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
        var filepath = './public/staticdata/downloads'
        res.setHeader(
            "Access-Control-Expose-Headers", "Content-Disposition"
        )
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "Notification.xlsx"
        );

        return workbook.xlsx.write(res).then(function () {
            res.download(filepath)
        });
    })
})


function validateRequest(payload) {
    return false;
}

module.exports = router;
