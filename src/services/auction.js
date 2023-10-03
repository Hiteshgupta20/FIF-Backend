const Promise = require('promise');
const Auction = require('../models/auction');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const UserModel = require('../models/user');
const NotificationService = require('../services/notification');
const ActivityService = require('../services/activity');
const NotificationSetting = require('../services/appNotificationSettings');
const FCMNotificationService = require('../services/fcmPushNotification');
const NotificationModel = require('../models/notification');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');
const CustomerGroupModel = require('../models/customerGroup');
const PointManagement = require('../services/pointManagement');

module.exports = {

    //auction set up
    createAuction: async function(payload) {
        return new Promise(function(resolve, reject) {
            let imageUrl = payload.imageurl.length == 0 ? ["https://fmcdev001.southeastasia.cloudapp.azure.com/fifqa/staticdata/images/static1.squarespace.jpg"] : payload.imageurl;
            let data = {};
            let date = util.getTimestamp();
            data.title = payload.title || '';
            data.type = payload.type || '';
            data.shortdesc = payload.shortdesc || '';
            data.longdesc = payload.longdesc || '';
            data.imageurl = imageUrl;
            data.status = payload.status || 0;
            data.publishdate = payload.publishdate || date;
            data.expirydate = payload.expirydate || date;
            data.sendnotification = payload.sendnotification || '';
            data.registrationfee = payload.registrationfee || 0;
            data.baseprice = payload.baseprice || 0;
            data.currentbidprice = payload.currentbidprice || data.baseprice;
            data.yearmade = payload.yearmade || 0;
            data.model = payload.model || '';
            data.condition = payload.condition || '';
            data.insertdate = payload.insertdate || date;
            data.insertby = payload.insertby || 153;
            data.lastmodifydate = data.insertdate;
            data.lastmodifyby = data.insertby;

            let currentdate = new Date(date).getTime();
            let publishdate = new Date(util.getTimestamp(data.publishdate)).getTime();
            if (currentdate >= publishdate) {
                data.status = 1;
            } else {
                data.status = 0;
            }

            Auction.createAuction(data)
                .then(function(result) {
                    if (result) {
                        result.type = "AUCTION_SETUP";
                        if (result.status == 1) {
                            sendNotification(result, null, false, true,false,true);
                        }
                    }
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },
    updateAuctionStatus: async function(payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.status = payload.status;
            data.auctionid = payload.auctionid;


            Auction.updateAuctionStatus(data)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },
    auctionJobScheduler: async function() {
        return new Promise(async function(resolve, reject) {
            // 
            try {
                //get all auctions
                logger.info(".....................auction job scheduler executing...........")
                let auctions = await Auction.getAllAuctions();

                auctions.forEach(async function(auction,index,obj) {
                    let status = 0;
                    let currentDate = new Date(util.getTimestamp()).getTime();
                    if (auction.publishdate) {
                        let publishDate = new Date(util.getTimestamp(auction.publishdate)).getTime();
                        if (publishDate <= currentDate) {
                            status = 1;
                        }
                    }
                    if (auction.expirydate) {
                        let expiryDate = new Date(util.getTimestamp(auction.expirydate)).getTime();
                        if (expiryDate < currentDate) {
                            status = 0;
                        }
                    }
                    let data = {

                        status: status,
                        auctionid: auction.auctionid
                    }
                    if (status != auction.status && !auction.winbidprice) {
                        let auction = await Auction.updateAuctionStatus(data);
                        if (auction.status == 1) {
                            logger.info("\n activating auction.................... \n" ,auction.title);
                            auction.type = "AUCTION_SETUP";
                            
                            sendNotification(auction, null, false, true,false,true);
                        }
                    }
                    if(index == obj.length-1){
                        resolve(true);
                    }
                });
                //iterate through each and perform action for publish and expire date

            } catch (err) {
                reject(false);
            }
        });
    },
    auctionRegisterationReminder: async function () {
        return new Promise(async function(resolve, reject) {
           // 
            try{
                let auctions = await Auction.getAllAuctions();
                
                auctions.forEach(async function (auction,index,obj) {

                    let currentDate = new Date(util.getTimestamp());

                    if(auction.expirydate && auction.status == 1){
                        let expiryDate = new Date(util.getTimestamp(auction.expirydate)).getDate();
                        let difference = expiryDate - currentDate.getDate();
                        if(difference < 3 && difference >= 0 ){
                            logger.info("\n\n sending auction registration reminder .. \n\n")
                            auction.type = "AUCTION_REG_REMINDER";
                            auction.expirydate = util.getTimestamp(currentDate.setDate(currentDate.getDate()+1));

                            //get users that has not participated in the auction yet.
                            let users = await Auction.getUserAlreadyRegistered(auction.auctionid);
                            if(users){
                                sendNotification(auction,users,false,true,true);
                            }
                        }
                    }
                    if(index == obj.length-1){
                        resolve(true);
                    }

                });
                //iterate through each and perform action for publish and expire date
            }
            catch(err){
                logger.error(err);
                reject(false);
            }
        });
    },
    auctionWinnerPaymentReminder: async function () {
        return new Promise(async function(resolve, reject) {
            //
            try{
                //get auction for which winner is declared from bidding table and no entry
                // for that auction in payment details where paymentType == Auction Payment
                let pendingPayments = await Auction.findAuctionWinnerWithPendingPayments();
                pendingPayments.forEach((auction,index,obj)=>{
                    auction.type = "AUCTION_WINNER_PAYMENT_REMINDER";
                    sendNotification(auction,{loginid : auction.userid},false,true,false,false);
                    if(index == obj.length-1){
                        resolve(true);
                    }
                });
            }
            catch(err){
                logger.error(err);
                reject(false);
            }
        });
    },

    updateAuction: async function (payload) {
        return new Promise(function(resolve, reject) {
            let imageUrl = payload.imageurl.length == 0 ? ["https://fmcdev001.southeastasia.cloudapp.azure.com/fifqa/staticdata/images/static1.squarespace.jpg"] : payload.imageurl;
            let data = {};
            let date = util.getTimestamp();
            data.title = payload.title || '';
            data.type = payload.type || '';
            data.shortdesc = payload.shortdesc || '';
            data.longdesc = payload.longdesc || '';
            data.imageurl = imageUrl;
            data.status = payload.status || '0';
            data.publishdate = payload.publishdate || date;
            data.expirydate = payload.expirydate || date;
            data.sendnotification = payload.sendnotification || '';
            data.registrationfee = payload.registrationfee || 0;
            data.baseprice = payload.baseprice || 0;
            data.currentbidprice = payload.currentbidprice || 0;
            data.yearmade = payload.yearmade || 0;
            data.model = payload.model || '';
            data.condition = payload.condition || '';
            data.insertdate = payload.insertdate || date;
            data.insertby = payload.modifyby || 153;
            data.lastmodifydate = data.insertdate;
            data.lastmodifyby = data.insertby;
            data.auctionid = payload.auctionid;

            let currentdate = new Date(date).getTime();
            let publishdate = new Date(util.getTimestamp(data.publishdate)).getTime();
            if (currentdate >= publishdate) {
                data.status = 1;
            } else {
                data.status = 0;
            }

            Auction.updateAuction(data)
                .then(function(result) {
                    result.type = "AUCTION_SETUP";
                    if (result.status == 1) {
                        sendNotification(result, null, true, true,false,true);
                    }
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },
    findAuction: async function(payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload);
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.title) {
                    console.log(searchParams.title);
                    whereClause.push(`title ILIKE '%${searchParams.title}%'`)
                }
                if (searchParams.type) {
                    console.log(searchParams.type);
                    whereClause.push(`type ILIKE '%${searchParams.type}%'`)
                }
                if (searchParams.publishdate && searchParams.publishdate.from && searchParams.publishdate.to) {
                    console.log(searchParams.publishDate);
                    whereClause.push(`date_trunc('day',publishdate) between to_date('${searchParams.publishdate.from}','DD-MM-YYYY') and to_date('${searchParams.publishdate.to}','DD-MM-YYYY')`)
                }
                if (searchParams.expirydate && searchParams.expirydate.from && searchParams.expirydate.to) {
                    console.log(searchParams.expirydate);
                    whereClause.push(`date_trunc('day',expirydate) between to_date('${searchParams.expirydate.from}','DD-MM-YYYY') and to_date('${searchParams.expirydate.to}','DD-MM-YYYY')`)
                }
                if (searchParams.insertdate && searchParams.insertdate.from && searchParams.insertdate.to) {
                    console.log(searchParams.insertdate);
                    whereClause.push(`date_trunc('day',insertdate) between to_date('${searchParams.insertdate.from}','DD-MM-YYYY') and to_date('${searchParams.insertdate.to}','DD-MM-YYYY')`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            var isExport = payload.isExport || 0;
            if(isExport == 1){
                data.whereClause ="";
                Auction.findAllAuctions(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
            else{
                Auction.findAuction(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }

        });
    },
    findAuctionById: async function(auctionId) {
        return new Promise(function(resolve, reject) {
            
            Auction.findAuctionById(auctionId)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },

    //auction payment verification methods
    createPayment: async function(payload) {
        return new Promise(async function(resolve, reject) {
            
            try {
                let data = {};
                let date = util.getTimestamp();
                data.auctionid = payload.auctionid || 112;
                data.userid = payload.userid || 153;
                data.username = payload.username || payload.userName || '';
                data.userphoneno = payload.userphoneno || '';
                data.useremailid = payload.useremailid || '';
                data.amount = payload.amount || 0;
                data.paymetslipurl = payload.paymetslipurl || '';
                data.payment_type = payload.paymentType || 'REGISTER';
                data.status = 1;
                data.insertdate = payload.insertdate || date;
                data.authorizeby = payload.authorizeby || 153;
                data.authorizationnote = '';
                data.authorizationdate = payload.authorizationdate || date;

                let payments = await Auction.findPaymentByUserIdAndAuctionId(data);
                if (payments.length == 0) {
                    Auction.createPayment(data)
                        .then(async function(result) {
                            if (data.payment_type == 'REGISTER') {
                                let userPoints = await addActivityPoints(payload);
                                if (userPoints) {
                                    result.pointsAdded = userPoints;
                                }
                            }
                            if (payload.paymentType == "REGISTER") {
                                result.activitytype = "Auction Registration";
                            }
                            else {
                                result.activitytype = "Auction Payment";
                            }
                            createActivityLog(result);
                            let notificationData = {
                                type: "PAYMENT_DONE",
                                loginid: payload.userid,
                                refid: payload.auctionid,
                                oldtype: "AUCTION_SETUP"
                            }



                            let auction = await Auction.findAuctionById({ refid: payload.auctionid });


                            result.shortdesc = "";
                            auction.type = "PAYMENT_CONFIRMATION";
                            if(data.payment_type == "REGISTER"){
                                auction.type = "PAYMENT_CONFIRMATION";
                                await NotificationService.updateNotificationType(notificationData);
                            }
                            if(data.payment_type == "AUCTION_PAYMENT"){
                                auction.type = "PAYMENT_SUBMITTED";
                                notificationData.oldtype = "AUCTION_WINNER";
                                notificationData.type = "AUCTION_PAYMENT_DONE";
                                await NotificationService.updateNotificationType(notificationData);
                            }
                            result.imageurl = auction.imageurl;
                            sendNotification(auction, { loginid: payload.userid }, false, false);

                            resolve(result);

                        })
                        .catch(function(err) {
                            reject(err);
                        });
                } else {
                    reject(new Error("Payment is already submitted for this auction."));
                }
            } catch (err) {

            }
        });
    },
    updatePaymentStatus: async function(payload) {
        var self = this;
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp(new Date());
            let data = {
                status: payload.status,
                authorizeby: payload.authorizeby || 153,
                authorizationnote: payload.authorizationnote || '',
                authorizationdate: date,
                paymentid: payload.paymentid
            };

            Auction.updatePaymentStatus(data)
                .then(async function(result) {
                    
                    let loginId = result.userid;
                    result.userid = result.authorizeby;
                    result.activitytype = "Auction payment status updated";
                    createActivityLog(result);
                    


                    let auction = await Auction.findAuctionById({ refid: result.auctionid });
                    auction.oldtype = "PAYMENT_DONE";
                    auction.type = "AUCTION_REG_VERIFICATION";
                    //make entry in bidding table with amount 0 when payment is approved for registered user for that auction
                    if(result.status == 2 && result.payment_type == 'REGISTER'){
                        let data ={
                            auctionid : auction.auctionid,
                            userid : loginId ,
                            username : result.username,
                            userphoneno : result.userphoneno ,
                            useremailid : result.useremailid,
                            biddingamount :  0,
                            status :  0
                        }
                        await self.createBidding(data).catch((err)=>{logger.error(err)});
                    }

                    if (result.status == 3) {
                        auction.type = "AUCTION_REG_CANCELLED";
                    }
                    sendNotification(auction, { loginid: loginId }, false, true);
                    resolve(result.paymentid);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },
    findPayment: async function(payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;
            let paymentType = payload.paymentType || 'REGISTER';
            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload, 't1.');
            let whereClause = []
            let searchParams = payload.searchParams;
            whereClause.push(`t2.module = 'APV'`);
            whereClause.push(`t1.payment_type = '${paymentType}'`);
            if (searchParams) {
                if (searchParams.customerName) {
                    console.log(searchParams.customerName);
                    whereClause.push(`t1.username ILIKE '%${searchParams.customerName}%'`)
                }
                if (searchParams.status) {
                    console.log(searchParams.status);
                    whereClause.push(`t1.status = '${searchParams.status}'`)
                }
                if (searchParams.title) {
                    console.log(searchParams.title);
                    whereClause.push(`t3.title ILIKE '%${searchParams.title}%'`)
                }
                if (searchParams.msisdn) {
                    console.log(searchParams.msisdn);
                    whereClause.push(`t1.userphoneno = '${searchParams.msisdn}'`)
                }
                if (searchParams.date && searchParams.date.from && searchParams.date.to) {
                    console.log(searchParams.date);
                    whereClause.push(`date_trunc('day',t1.insertdate) between to_date('${searchParams.date.from}','DD-MM-YYYY') and to_date('${searchParams.date.to}','DD-MM-YYYY')`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;
            var isExport = payload.isExport || 0;
            if(isExport == 1){
                // data.whereClause =`where t2.module = 'APV' AND t1.payment_type = '${paymentType}'`;
                Auction.findAllPayments(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
            else{
                Auction.findPayment(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
        });
    },
    getStatusList: async function() {
        return new Promise(function(resolve, reject) {
            Auction.getStatusList()
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },
    statusHistory: async function(payload) {
        return new Promise(function(resolve, reject) {
            let data = {
                activitymodule: payload.paymentid,
                activitytype: "payment_status"
            }
            ActivityLogService.findActivityLogs(data)
                .then(function(result) {
                    resolve(result);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },

    //auction bidding transaction
    createBidding: async function(payload) {
        return new Promise(async function(resolve, reject) {
            

            try {
                let status = payload.status;
                status = status == 0 ? 0 : 1;
                let data = {};
                let date = util.getTimestamp();
                data.auctionid = payload.auctionid || 0;
                data.userid = payload.userid || 0;
                data.username = payload.username || payload.userName || '';
                data.userphoneno = payload.userphoneno || '';
                data.useremailid = payload.useremailid || '';
                data.biddingamount = payload.biddingamount || 0;
                data.status = status;
                data.insertdate = date;
                data.authorizeby = payload.authorizeby || null;
                data.authorizationnote = payload.authorizationnote || '';
                data.authorizationdate = payload.authorizationdate || date;
                let auction = await Auction.findAuctionById({ refid: data.auctionid });
                if(auction.status == 0){
                    // return reject(new Error("Auction has expired."));
                    return reject(new Error("Lelang sudah berakhir"));
                }
                if (auction && parseInt(auction.currentbidprice) >= parseInt(data.biddingamount) && (auction.bidcount != 0) && status) {
                    // return reject(util.apiError("Auction", 300, "Sorry, the price you entered is lower than the last auction price."))
                    return reject(util.apiError("Auction", 300, "Maaf, harga yang Anda masukkan lebih rendah dari harga lelang terakhir"))
                } else if (!auction) {
                    // return reject(new Error("Auction does not exist"));
                    return reject(new Error("Lelang tidak tersedia"));
                }

                let bids = await Auction.findBiddingByUserIdAndAuctionId(data);


                if (bids.length == 0) {
                        Auction.createBidding(data)
                            .then(async function(result) {
                                resolve(result);
                            })
                            .catch(function(err) {
                                reject(err);
                            });
                }
                else if(bids.length == 1 && bids[0].status == 0){
                    data.biddingid = bids[0].biddingid;
                    Auction.updateBidding(data)
                        .then(async function(result) {
                            let result2 = await Auction.updateAuctionCurrentPrice(result);

                            if(result.status){
                                let notification = {
                                    loginid: result.userid,
                                    title: result2.title,
                                    desc: result2.shortdesc,
                                    type: "BIDDING_COMPLETE",
                                    oldtype: "AUCTION_REG_VERIFICATION",
                                    imageurl: result2.imageurl[0],
                                    refid: result2.auctionid,
                                    icon: result2.icon || "",
                                    biddingamount: result.biddingamount,
                                    expirydate: result2.expirydate,
                                    id: ""
                                };
                                let user = await UserModel.findUserByLoginId(result.userid);
                                sendNotification(notification, user, true, true);
                            }
                            resolve(result);
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                }
                else {
                    reject(new Error("User has already bid for this auction."));
                }


            } catch (err) {
                reject(err);
            }

        });
    },
    findBidding: async function(payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1) * payload.limit || 0;

            if (data.offset < 0) {
                data.offset = 0;
            }
            data.orderByClause = util.formatOrderByClause(payload, 't1.');
            let whereClause = []
            let searchParams = payload.searchParams;
            if (searchParams) {
                if (searchParams.title) {
                    console.log(searchParams.title);
                    whereClause.push(`t2.title ILIKE '%${searchParams.title}%'`)
                }
                if (searchParams.name) {
                    console.log(searchParams.name);
                    whereClause.push(`t1.username ILIKE '%${searchParams.name}%'`)
                }
                if (searchParams.msisdn) {
                    console.log(searchParams.msisdn);
                    whereClause.push(`t1.userphoneno ILIKE '%${searchParams.msisdn}%'`)
                }
                if (searchParams.status) {
                    console.log(searchParams.status);
                    whereClause.push(`t1.status = '${searchParams.status}'`)
                }
                if (searchParams.date && searchParams.date.from && searchParams.date.to) {
                    console.log(searchParams.date);
                    whereClause.push(`date_trunc('day',t1.insertdate) between to_date('${searchParams.date.from}','DD-MM-YYYY') and to_date('${searchParams.date.to}','DD-MM-YYYY')`)
                }
            }
            whereClause = whereClause.join(" and ");
            if (whereClause.length > 0) {
                whereClause = "where " + whereClause;
            }
            data.whereClause = whereClause;

            var isExport = payload.isExport || 0;
            if(isExport == 1){
                // data.whereClause ="";
                Auction.findAllBids(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
            else{
                Auction.findBidding(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }

        });
    },
    updateBiddingStatus: async function(payload) {
        return new Promise(async function(resolve, reject) {
            
            let date = util.getTimestamp();
            let data = {
                status: payload.status,
                authorizeby: payload.authorizeby,
                authorizationnote: payload.authorizationnote || '',
                authorizationdate: date,
                biddingid: payload.biddingid
            };
            
            //find auction id using bidding id
            let bid = await Auction.findBidById(payload.biddingid);
            //
            if (bid) {
                let isWinnerDeclared = await Auction.findWinner({ auctionid: bid.auctionid, status: 2 });

                if (isWinnerDeclared.length == 0) {
                    Auction.updateBiddingStatus(data)
                        .then(async function(result) {
                            
                            let loginId = result.userid;
                            result.userid = result.authorizeby;
                            // createActivityLog(result);
                            Auction.updateWinnerFlag(result.auctionid);
                            let currDate = new Date();
                            let pastDate = new Date(currDate.setSeconds(currDate.getSeconds() - 1));


                            let auction = await Auction.findAuctionById({ refid: result.auctionid });
                            let winnerData = {
                                status: 0,
                                expiryDate: util.getTimestamp(auction.expirydate),
                                auctionId: result.auctionid,
                                biddingamount : result.biddingamount
                            }


                            await NotificationModel.updateNotificationExpiryDate(result.auctionid);

                            auction.biddingamount = result.biddingamount;
                            let winnerAuction = Object.assign({},auction);
                            winnerAuction.type = "AUCTION_WINNER";
                            winnerAuction.oldtype = "BIDDING_COMPLETE";
                            sendNotification(winnerAuction, { loginid: loginId }, false, true);
                            let auctionUpdate = await Auction.updateActionForWinner(winnerData);
                            let auctionLoser = await Auction.findAuctionLoser(result.auctionid);
                            
                            auction.type = "AUCTION_LOSER";
                            sendNotification(auction,auctionLoser,false,true,true,false,true);
                            resolve(result.biddingid);
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                } else {
                    return reject(new Error("Winner is already declared for this auction."))
                }
            } else {
                return reject(new Error("Bidding details not found."))
            }
        });
    }
};

async function addActivityPoints(data) {

    let pointsData = {
        loginid: data.userid || null,
        activityappid: 'AUCTION REGISTRATION',
        description: 'Auction Registration'

    }
    try{
        await PointManagement.addPointsForActivity(pointsData);
    }catch (err){
        logger.error(err);
    }
}

async function createActivityLog(record) {
    let data = {};
    let status = record.status;
    try {
        status = await getStatusName({ statusid: status, module: 'APV' });
        data.loginid = record.userid;
        data.activitydesc = status;
        data.activitytype = record.activitytype;
        data.activitymodule = record.paymentid;
        data.remarks = record.authorizationnote || '';
        ActivityLogService.createActivityLog(data);
    } catch (err) {
        logger.error(err);
    }
}

async function sendNotification(auction,user,update,notify,isUserList,isUserGroup,isLoserUsers){

    //Todo - iterate through userGroups array
    //Todo - find users associated with user Group selected while auction setup
    //Todo - create notifications iterating through user list added in user Group
    //Todo - trigger push notification
    try {
        
        //check if notitfication flag is active for this activity
        let activity = await ActivityService.getActivityByName("Auction");
        if(activity && activity.notification_flag !== false){
            if(user && !isUserList && !isUserGroup){
                
                let appNotificationSetting = await NotificationSetting.getModules(user.loginid);
                if(appNotificationSetting && appNotificationSetting.modules && (appNotificationSetting.modules.auction != false)){
                    user = await UserModel.findUserByLoginId(user.loginid);
                    let userArr = [];
                    userArr.push(user);
                    let data = getNotificationDetail(user, auction);
                    if (notify) {
                        FCMNotificationService.pushFCMNotification(data, userArr);
                    }
                    update ? NotificationService.updateNotification(data,userArr,false):
                        NotificationService.createNotification(data,userArr,false);
                }
            }
            else {
                let users  = [];
                if(isUserGroup && auction.sendnotification.length >0){
                    let groups = auction.sendnotification;
                    
                    let customerList = await CustomerGroupModel.getCustomerGroupInfoByGroupId(groups.join(','));

                    customerList.forEach(function(record){
                        Array.prototype.push.apply(users, record.customer_list);
                    })
                }
                else if(isUserList){

                    let registeredUsers = user;
                    if(isLoserUsers){
                        users = await UserService.getFMCRegisteredUsers();
                        users = users.filter((user)=>{
                            return registeredUsers.some((rgUser)=>{
                                return rgUser.loginid == user.loginid;
                            })
                        })
                        registeredUsers = [];
                    }else if(auction.sendnotification.length >0){
                        let groups = auction.sendnotification;

                        let customerList = await CustomerGroupModel.getCustomerGroupInfoByGroupId(groups.join(','));

                        customerList.forEach(function(record){
                            Array.prototype.push.apply(users, record.customer_list);
                        })
                    }
                    else{
                        users = await UserService.getFMCRegisteredUsers();
                    }
                    if(registeredUsers.length > 0){
                        users = users.filter((user)=>{
                            return registeredUsers.some((rgUser)=>{
                                return rgUser.userid != user.loginid;
                            })
                        })
                    }

                }
                else{
                    users = await UserService.getFMCRegisteredUsers();
                }
                let data = {};

                for (let index = 0 ; index < users.length ; index++){
                    let loginId = users[index].loginid || "";
                    let appNotificationSetting = await NotificationSetting.getModules(loginId.toString());
                    if(appNotificationSetting && appNotificationSetting.modules && (appNotificationSetting.modules.auction != false)) {
                        data = getNotificationDetail(users[index], auction);
                        update ? NotificationService.updateNotification(data, users[index], false) :
                            NotificationService.createNotification(data, users[index], false);
                    }else{
                        users.splice(index--, 1);
                    }
                }
                if (notify) {
                    FCMNotificationService.pushFCMNotification(data, users);
                }
            }
        }

    } catch (err) {
        logger.error(err);
    }

}

function getNotificationDetail(user, auction) {
    let data = {};
    auction = getNotificationContent(auction);
    let expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate()+10);
    let imageUrl = auction.imageurl? auction.imageurl[0]:"";
    let date = util.getTimestamp();
    data.loginid = user.loginid;
    data.title = auction.title || "";
    data.desc = auction.shortdesc || auction.desc || "";
    data.type = auction.type || "";
    data.oldtype = auction.oldtype || "";
    data.imageurl = imageUrl || "https://fmcdev001.southeastasia.cloudapp.azure.com/fifqa/staticdata/images/static1.squarespace.jpg";
    data.refid = auction.auctionid || auction.refid || null;
    data.insertDate = date;
    data.expirydate = auction.expirydate || util.getTimestamp(expiryDate);
    data.icon = auction.icon || "";
    logger.info("Notifcation data : ", data);
    return data;
}

function getStatusName(payload) {
    return new Promise(function(resolve, reject) {
        
        let data = {};
        let whereClause = []
        let searchParams = payload;
        if (searchParams) {
            if (searchParams.statusid) {
                console.log(searchParams.statusid);
                whereClause.push(`status_id = '${searchParams.statusid}'`)
            }
            if (searchParams.module) {
                console.log(searchParams.module);
                whereClause.push(`module = '${searchParams.module}'`)
            }
        }
        whereClause = whereClause.join(" and ");
        if (whereClause.length > 0) {
            whereClause = "where " + whereClause;
        }
        data.whereClause = whereClause;
        StatusMaster.getStatusName(data)
            .then(function(result) {
                resolve(result);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

function getNotificationContent(auction1) {

    let auction = Object.assign({}, auction1);
    switch (auction.type) {
        case "AUCTION_SETUP":
            auction.title = "Dapatkan ( " + auction.title + " ) pada lelang FMC. Dapatkan barang yang sedang dilelang dengan harga yang jauh lebih rendah dari pasaran.";
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "PAYMENT_CONFIRMATION":
            auction.title = "Mohon tunggu, system kami sedang melakukan verifikasi atas pembayaran registrasi proses lelang ( " + auction.title + " ) anda.";
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "PAYMENT_SUBMITTED":
            auction.title = "Terima kasih pembayaran atas lelang ( " + auction.title + " ) telah kami terima. Pihak kami akan segera menghubungi anda untuk proses selanjutnya.";
            auction.desc = auction.shortdesc || auction.desc || "" ;
            break;
        case "PAYMENT_DONE":
            auction.title = auction.title || "";
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "AUCTION_REG_VERIFICATION":
            auction.title = "Terima kasih, proses registrasi lelang anda telah berhasil. Selamat mengikuti proses lelang .( " + auction.title + " )";
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "AUCTION_REG_CANCELLED":
            auction.title = "Cancelled: Pembayaran registrasi lelang [ " + auction.title + " ] telah dicancel. Untuk keterangan lebih lanjut silahkan menghubungi Hallo FIF (1-500-343)";
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "BIDDING_COMPLETE":
            auction.title = "Terima kasih untuk partisipasi anda dalam proses lelang ( " + auction.title + " ), nilai bidding anda adalah sebesar Rp " + auction.biddingamount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "AUCTION_WINNER":
            auction.title = "Selamat!!!! Anda telah memenangkan lelang ( " + auction.title + " ) dengan nilai Rp " + auction.biddingamount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            auction.desc = auction.shortdesc || auction.desc || "";
            break;
        case "AUCTION_LOSER":
            auction.title = "Mohon maaf, anda belum berkesempatan memenangkan lelang ( "+auction.title+" ) Raih kesempatan berikutnya di lelang-lelang kami selanjutnya ya.";
            auction.desc = auction.shortdesc || auction.desc || "" ;
            break;
        case "AUCTION_REG_REMINDER":
            auction.title = "Yuks, jangan lewatkan lelang FMC ( "+auction.title+" ). Segera lakukan registrasi dan kami tunggu partisipasi anda.";
            auction.desc = auction.shortdesc || auction.desc || "" ;
            break;
        case "AUCTION_WINNER_PAYMENT_REMINDER":
            auction.title = "Pengingat: Anda memenangkan lelang dari (" + auction.title + "), silahkan lakukan pembayaran sejumlah (Rp " + auction.biddingamount.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ").");
            // auction.title = `Pengingat : You won an auction of ${auction.title} and  your payment of RP. ${auction.biddingamount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} is due.`;
            auction.desc = "";
            break;
        default:
    }
    return auction;
}
