var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const ComplaintService = require('../services/complaint');
const ratingService = require('../services/viewRating');

//complaint methods
router.get('/complaint/categories', auth.isAuthenticated, (req, res) => {
    let categories = ["General", "FIFGroup Card(FGC)", "Service"];
    res.json(util.success(categories));
});
router.post('/complaint', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let complaint = await ComplaintService.createComplaint(req.body);
        let ratePayload = {
            'activityappid': 'COMPLAINT'
        }
        let ratingData = await ratingService.getRatingData(ratePayload);
        let ratingDesc = "";
        if (ratingData && ratingData.title) {
            ratingDesc = ratingData.title;
        }
        let pointsAdded = 0;
        let pointDescription = "";
        if (complaint && complaint.pointsAdded) {
            pointsAdded = complaint.pointsAdded;
            pointDescription = util.getPointDescriptionContent(pointsAdded);
        }
        res.json(util.success(complaint, 'Complaint has been registered successfully', ratingDesc, pointsAdded, pointDescription));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/complaint/update', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await ComplaintService.updateComplaint(req.body)
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/complaint/updateStatus', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await ComplaintService.updateComplaintStatus(req.body)
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/complaint/delete', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await ComplaintService.deleteComplaint(req.body.complaintId);
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/getComplaint', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await ComplaintService.findComplaint(req.body)
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.post('/getComplaintCount', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validateRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let auction = await ComplaintService.findComplaintCount(req.body)
        res.json(util.success(auction));
    } catch (err) {
        res.json(util.failed(err));
    }

});

router.get('/complaint/getStatusList', auth.isAuthenticated, async (req, res) => {
    try {
        let statusList = await ComplaintService.getStatusList();
        res.json(util.success(statusList));
    } catch (err) {
        res.json(util.failed(err));
    }
});
router.post('/complaint/updateStatus', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validatePaymentRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let payment = await ComplaintService.updateComplaintStatus(req.body);
        res.json(util.success(payment));
    } catch (err) {
        res.json(util.failed(err));
    }

});
router.post('/complaint/statusHistory', auth.isAuthenticated, async (req, res) => {
    try {
        let error = validatePaymentRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let payment = await ComplaintService.statusHistory(req.body);
        res.json(util.success(payment));
    } catch (err) {
        res.json(util.failed(err));
    }

});
// router.post('/complaint/history', auth.isAuthenticated, async (req, res) => {
//     try {
//         let error = validateRequest(req.body);
//         if (error) {
//             return res.json(util.failed(error));
//         }
//         let result = await ComplaintService.getComplaintHistory(req.body);
//         res.json(util.success(result));
//     } catch (err) {
//         res.json(util.failed(err));
//     }
// });

function validatePaymentRequest(payload) {
    return false;
}

function validateRequest(payload) {
    return false;
}

module.exports = router;