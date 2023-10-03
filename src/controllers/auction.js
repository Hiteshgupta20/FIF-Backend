var express = require('express');
var router = express.Router();
var auth = require('../config/authorization');
var util = require('./util');
const logger = require('../config/logging');
const auctionService = require('../services/auction');
const ratingService = require('../services/viewRating');
const activityLogs = require('../services/activityLogs');

//auction setup
router.get('/auction/categories',auth.isAuthenticated, (req, res) => {
    let categories = ["Vehicle","Electronic","Furniture"];
    res.json(util.success(categories));
});
router.post('/auction',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let auction = await auctionService.createAuction(req.body)
        res.json(util.success(auction));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/auction/update',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let auction = await auctionService.updateAuction(req.body)
        res.json(util.success(auction));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/getAuction',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let auction = await auctionService.findAuction(req.body)
        res.json(util.success(auction));
    }catch(err){
        res.json(util.failed(err));
    }

});

//auction payment verification
router.get('/auction/getStatusList',auth.isAuthenticated,async (req, res) => {
    try{
        let statusList = await auctionService.getStatusList()
        res.json(util.success(statusList));
    }catch(err){
        res.json(util.failed(err));
    }
});
router.post('/auction/getPayments',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validatePaymentRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await auctionService.findPayment(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/auction/payment',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validatePaymentRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await auctionService.createPayment(req.body);

        let ratePayload = {
            'activityappid': 'AUCTION REGISTRATION'
        }

        let paymentType = req.body.paymentType || 'REGISTER';
        let ratingDesc = "";
        if (paymentType == 'REGISTER') {
            let ratingData = await ratingService.getRatingData(ratePayload);
            if (ratingData && ratingData.title) {
                ratingDesc = ratingData.title;
            }
        }
        let pointsAdded = 0;
        let pointsDescription = "";
        if (payment && payment.pointsAdded){
            pointsAdded = payment.pointsAdded;
            pointsDescription = util.getPointDescriptionContent(pointsAdded);
        }
        res.json(util.success(payment,'', ratingDesc,pointsAdded,pointsDescription));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/auction/updatePaymentStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validatePaymentRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await auctionService.updatePaymentStatus(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});
router.post('/auction/payment/StatusHistory',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validatePaymentRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let payment = await auctionService.statusHistory(req.body);
        res.json(util.success(payment));
    }catch(err){
        res.json(util.failed(err));
    }

});

//auction bidding transsactions
router.post('/auction/bidding',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let auction = await auctionService.createBidding(req.body);

        let loginId = req.body.userid;
        let activityData = util.prepareActivityLogsData(loginId, 'Bid for auction', 'Bid for auction');
        await activityLogs.createActivityLog(activityData);

        res.json(util.success(auction));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/auction/updateBiddingStatus',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validatePaymentRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let bidding = await auctionService.updateBiddingStatus(req.body);
        res.json(util.success(bidding));
    }catch(err){
        res.json(util.failed(err));
    }

});

router.post('/auction/getBidding',auth.isAuthenticated,async (req, res) => {
    try{
        let error = validateRequest(req.body);
        if(error){
            return res.json(util.failed(error));
        }
        let auction = await auctionService.findBidding(req.body)
        res.json(util.success(auction));
    }catch(err){
        res.json(util.failed(err));
    }

});




function validatePaymentRequest(payload) {
    return false;
}

function validateRequest (payload) {
    return false;
}

module.exports = router;
