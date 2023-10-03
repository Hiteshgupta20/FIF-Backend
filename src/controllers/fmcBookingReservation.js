var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const FmcBookingService = require('../services/fmcBookingReservation');
const v = require('node-input-validator');

router.post('/cekIssExist', async (req, res) => {
    let validator = new v(req.body, {
        servOfficeCode: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter servOfficeCode is missing'));
        }
        let checkIss = await FmcBookingService.cekIssExist(req.body)
        res.json(util.success(checkIss));
    })
})

router.post('/checkBPKBKontrak', async (req, res) => {

    let validator = new v(req.body, {
        contractNo: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter contractNo is missing'));
        }
        let checkBPKB = await FmcBookingService.checkBPKBKontrak(req.body)
        if (checkBPKB.reason !== null) {
            res.json(util.ISSAPIFailed(checkBPKB))
        } else {
            res.json(util.success(checkBPKB));
        }

    })
})

router.post('/getDayTimeFrame', async (req, res) => {
    let validator = new v(req.body, {
        servOfficeCode: 'required',
        serviceId: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }
        let dayTimeFrame = await FmcBookingService.dayTimeFrame(req.body)
        if (dayTimeFrame.reason !== null) {
            res.json(util.ISSAPIFailed(dayTimeFrame))
        } else {
            res.json(util.success(dayTimeFrame));
        }

    })
})

router.post('/getClockTimeFrame', async (req, res) => {
    let validator = new v(req.body, {
        servOfficeCode: 'required',
        serviceId: 'required',
        bookingDate: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }
        let clockTimeFrame = await FmcBookingService.getClockTimeFrame(req.body)
        if (clockTimeFrame.reason !== null) {
            res.json(util.ISSAPIFailed(clockTimeFrame))
        } else {
            res.json(util.success(clockTimeFrame));
        }

    })
})


router.post('/bookingFMC', async (req, res) => {
    let validator = new v(req.body, {
        bookingTime: 'required',
        contractNo: 'required',
        customerId: 'required',
        serviceId: 'required',
        servOfficeCode: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }
        let bookingFmc = await FmcBookingService.bookingFMC(req.body)
        if (bookingFmc.reason) {
            res.json(util.ISSAPIFailed(bookingFmc))
        } else {
            res.json(util.success(bookingFmc));
        }


    })
})

router.post('/myBooking', async (req, res) => {
    let validator = new v(req.body, {
        customerNo: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }
        let bookinglist = await FmcBookingService.myBooking(req.body)
        if (Object.keys(bookinglist.data).length !== 0) {
            res.json(util.success(bookinglist));
        } else {
            res.json(util.ISSAPIFailed(bookinglist))
        }
    })
})

router.post('/myBookingDetail', async (req, res) => {
    let validator = new v(req.body, {
        customerNo: 'required',
        bookingId: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }
        let myBookingDetails = await FmcBookingService.myBookingDetail(req.body)
        if (myBookingDetails.reason) {
            res.json(util.ISSAPIFailed(myBookingDetails))
        } else {
            res.json(util.success(myBookingDetails));
        }
    })
})

router.post('/deleteMyBooking', async (req, res) => {
    let validator = new v(req.body, {
        customerNo: 'required',
        bookingId: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }

        let deleteBooking = await FmcBookingService.deleteMyBooking(req.body)
        if (deleteBooking.reason) {
            res.json(util.ISSAPIFailed(deleteBooking))
        } else {
            res.json(util.success(deleteBooking));
        }
    })
})
router.post('/sendBookingEmail', auth.isAuthenticated, async (req, res) => {
    try {
        req.body = verifyEmailRequest(req.body);
        let error = validateGetEmailRequest(req.body);
        if (error) {
            return res.json(util.failed(error));
        }
        let email = await FmcBookingService.sendBookingEmail(req.body)
        res.json(util.success(email));

    } catch (err) {
        console.log(err)
        res.json(util.failed(err));
    }
})

router.post('/checkPaymentCycle', async (req, res) => {
    let validator = new v(req.body, {
        contractNo: 'required',
        servOfficeCode: 'required',
    });
    validator.check().then(async function (matched) {
        if (!matched) {
            res.json(util.failed({}, 'Required Parameter is missing'));
        }

        let checkPaymentCycle = await FmcBookingService.checkPaymentCycle(req.body)
        if (checkPaymentCycle.reason) {
            res.json(util.ISSAPIFailed(checkPaymentCycle))
        } else {
            res.json(util.success(checkPaymentCycle));
        }
    })
})


function verifyEmailRequest(payload) {
    if (payload.email === "null" || payload.email === "") {
        payload.email = null;
    } else if (payload.email) {
        payload.email = payload.email.toLowerCase();
    }
    return payload;
}

function validateGetEmailRequest(payload) {

    if (payload.email === null) {
        return new Error("Please enter valid email.");
    }
    return false;
}


function validateRequest(payload) {
    return false;
}

module.exports = router;