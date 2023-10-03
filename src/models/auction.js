const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util')


// methods for auction detail table
module.exports.createAuction = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_am_auction_details
                    (title, type, shortdesc, longdesc, imageurl, status, publishdate, expirydate, sendnotification, 
                     registrationfee,baseprice, currentbidprice, yearmade, model, condition, insertdate,
                      insertby, lastmodifydate, lastmodifyby)
                      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) returning *;`,
            [data.title, data.type, data.shortdesc, data.longdesc, data.imageurl ,data.status, data.publishdate, data.expirydate,
                data.sendnotification, data.registrationfee, data.baseprice, data.currentbidprice, data.yearmade,
                data.model, data.condition, data.insertdate, data.insertby, data.lastmodifydate, data.lastmodifyby])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findAuction = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT auctionid, title, "type", shortdesc, longdesc, imageurl, status, publishdate,
         expirydate, sendnotification,
                    registrationfee, baseprice, currentbidprice, yearmade, model, "condition", insertdate, insertby, lastmodifydate, lastmodifyby
                    FROM ${db.schema}.t_am_auction_details ${data.whereClause}${data.orderByClause} LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getAuctionCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findAllAuctions = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT auctionid, title, "type", shortdesc, longdesc, imageurl, status, publishdate,
         expirydate, sendnotification,
                    registrationfee, baseprice, currentbidprice, yearmade, model, "condition", insertdate, insertby, lastmodifydate, lastmodifyby
                    FROM ${db.schema}.t_am_auction_details ${data.whereClause};`,[])
            .then(async function(results) {
                
                let response = {
                    "data" : results,
                    totalRecords : results.length
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.updateActionForWinner = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_am_auction_details
SET status = $1, expirydate=$2,currentbidprice = $4,winbidprice=$4
WHERE auctionid=$3 returning *;`,
            [data.status, data.expiryDate, data.auctionId,data.biddingamount])
            .then(async function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.findAuctionById = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT auctionid, title, "type", shortdesc, longdesc, imageurl, status, publishdate,
         expirydate, sendnotification,
                    registrationfee, baseprice, currentbidprice, yearmade, model, "condition", insertdate,
                     insertby, lastmodifydate, lastmodifyby,
                    (SELECT count(*)  FROM   ${db.schema}.t_am_auction_bidding_details t2   WHERE t1.auctionid = t2.auctionid and t2.status > 0 ) AS bidcount                    
                    FROM ${db.schema}.t_am_auction_details t1 where auctionid = $1;`,[data.refid])
            .then(async function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getAllAuctions = function () {
    var self = this;
    return new Promise(function(resolve, reject) {
        //
        db.query(`SELECT auctionid, title, "type", shortdesc, longdesc, imageurl, status, publishdate ,
         expirydate, sendnotification,
                    registrationfee, baseprice, currentbidprice, yearmade, model, "condition", insertdate, insertby, lastmodifydate, lastmodifyby,winbidprice
                    FROM ${db.schema}.t_am_auction_details ;`,[])
            .then(async function(results) {
               // 
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getUserAlreadyRegistered = function (auctionId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        //
        db.query(`SELECT * FROM  ${db.schema}.t_am_auction_payment_details
                    WHERE auctionid = $1;`,[auctionId])
            .then(async function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getAuctionCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_am_auction_details ${data.whereClause} ;`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}
module.exports.updateAuction = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_am_auction_details
SET title= $1, "type"= $2, shortdesc= $3, longdesc= $4, imageurl= $5, status = $6, publishdate=$7, expirydate=$8, sendnotification=$9, registrationfee=$10, baseprice=$11, currentbidprice=$12, yearmade=$13, model=$14, "condition"=$15, insertdate=$16, insertby=$17, lastmodifydate=$18, lastmodifyby=$19
WHERE auctionid=$20 returning *;`,
            [data.title, data.type, data.shortdesc, data.longdesc, data.imageurl ,data.status, data.publishdate, data.expirydate,
                data.sendnotification, data.registrationfee, data.baseprice, data.currentbidprice, data.yearmade,
                data.model, data.condition, data.insertdate, data.insertby, data.lastmodifydate, data.lastmodifyby,data.auctionid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateAuctionStatus = function (data) {
    return new Promise(function(resolve, reject) {
        //
        db.query(`UPDATE ${db.schema}.t_am_auction_details
                  SET  status = $1
                  WHERE auctionid=$2 returning *;`,
            [data.status,data.auctionid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateAuctionCurrentPrice = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_am_auction_details
            SET  currentbidprice=$1
            WHERE auctionid=$2 returning *;`,
            [ data.biddingamount,data.auctionid])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


//methods for auction bidding table
module.exports.createBidding = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`INSERT INTO ${db.schema}.t_am_auction_bidding_details
    (auctionid, userid, username, userphoneno, useremailid, biddingamount, status, insertdate, authorizeby, authorizationnote, authorizationdate)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *;`,
            [data.auctionid, data.userid, data.username, data.userphoneno, data.useremailid ,data.biddingamount, data.status, data.insertdate,
                data.authorizeby, data.authorizationnote, data.authorizationdate])
            .then(function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateBidding = function (data) {
    return new Promise(function(resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_am_auction_bidding_details
SET auctionid=$1, userid=$2, username=$3, userphoneno=$4, useremailid=$5, biddingamount=$6, status=$7, authorizeby=$8, authorizationnote=$9, authorizationdate=$10
WHERE biddingid= $11 returning *;`,
            [data.auctionid, data.userid, data.username, data.userphoneno, data.useremailid ,data.biddingamount, data.status,
                data.authorizeby, data.authorizationnote, data.authorizationdate,data. biddingid])
            .then(function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findBidding = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT t1.biddingid, t1.auctionid, t2.title,t1.userid, t1.username, t1.userphoneno, t1.useremailid, t1.biddingamount, t1.status, t1.insertdate, t1.authorizeby, t1.authorizationnote, t1.authorizationdate,t1.winnerdeclared
FROM ${db.schema}.t_am_auction_bidding_details t1 INNER JOIN ${db.schema}.t_am_auction_details t2 on t1.auctionid = t2.auctionid ${data.whereClause} ${data.orderByClause} LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getBiddingCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findAllBids = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT t1.biddingid, t1.auctionid, t2.title,t1.userid, t1.username, t1.userphoneno, t1.useremailid, t1.biddingamount, t1.status, t1.insertdate, t1.authorizeby, t1.authorizationnote, t1.authorizationdate ,t1.winnerdeclared
FROM ${db.schema}.t_am_auction_bidding_details t1 INNER JOIN ${db.schema}.t_am_auction_details t2 on t1.auctionid = t2.auctionid ${data.whereClause};`,[])
            .then(async function(results) {
                
                let response = {
                    "data" : results,
                    totalRecords : results.length
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.getBiddingCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_am_auction_bidding_details t1 INNER JOIN ${db.schema}.t_am_auction_details t2 on t1.auctionid = t2.auctionid ${data.whereClause};`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}
module.exports.findBidById = function (biddingId) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_am_auction_bidding_details WHERE biddingid = $1;`,[biddingId])
            .then(function(results) {
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findWinner = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_am_auction_bidding_details WHERE auctionid = $1 AND status = $2;`,[data.auctionid,data.status])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateBiddingStatus = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_am_auction_bidding_details
        SET  status = $1, authorizeby = $2, authorizationnote = $3, authorizationdate = $4
        WHERE biddingid = $5 returning *;`,
            [data.status, data.authorizeby, data.authorizationnote, data.authorizationdate, data.biddingid])
            .then(function(results) {
                console.log(results);
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updateWinnerFlag = function (auctionId) {
    return new Promise(function(resolve, reject) {
        
        db.query(`UPDATE ${db.schema}.t_am_auction_bidding_details
        SET  winnerdeclared = true
        WHERE auctionid = $1 returning *;`,
            [auctionId])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findAuctionLoser = function (auctionId) {
    return new Promise(function(resolve, reject) {
        
        db.query(`Select * from ${db.schema}.t_am_auction_bidding_details t1
        LEFT JOIN ${db.schema}.t_lm_app_login_detail t2 ON t1.userid = t2.loginid
        WHERE t1.auctionid = $1 and t1.status <= 1;`,
            [auctionId])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findAuctionWinnerWithPendingPayments = function () {
    return new Promise(function(resolve, reject) {

        db.query(`select b.userid ,b.username, b.auctionid, b.biddingamount, a.title, a.shortdesc, a.imageurl, l.fcm_token from ${db.schema}.t_am_auction_bidding_details b
                    left join ${db.schema}.t_am_auction_payment_details p
                    on b.userid = p.userid and b.auctionid = p.auctionid
                    left join ${db.schema}.t_lm_app_login_detail l
                    on b.userid = l.loginid
                    left join ${db.schema}.t_am_auction_details a
                    on b.auctionid = a.auctionid
                    where b.status = 2 and p.payment_type != 'AUCTION_PAYMENT';`,
            [])
            .then(function(results) {
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


//methods for auction payment table
module.exports.createPayment = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(` INSERT INTO ${db.schema}.t_am_auction_payment_details
    (auctionid, userid, username, userphoneno, useremailid, amount,payment_type, paymetslipurl, status, insertdate, authorizeby, authorizationnote, authorizationdate)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning *;`,
            [data.auctionid, data.userid, data.username, data.userphoneno, data.useremailid ,data.amount,data.payment_type, data.paymetslipurl, data.status,
                data.insertdate, data.authorizeby, data.authorizationnote, data.authorizationdate])
            .then(function(results) {
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.updatePaymentStatus = function (data) {
    return new Promise(function(resolve, reject) {
        

        // db.query(`UPDATE ${db.schema}.t_am_auction_payment_details
        // SET  status = $1, authorizeby = $2, authorizationnote = $3, authorizationdate = $4
        // FROM ${db.schema}.t_am_auction_payment_details t1
        // INNER JOIN ${db.schema}.t_am_auction_details t2 ON t1.auctionid = t2.auctionid
        // WHERE t1.paymentid = $5 returning t1.userid,t2.title,t2.shortdesc,t2.auctionid,t2.imageurl,t1.authorizeby,t1.paymentid`,
        //     [data.status, data.authorizeby, data.authorizationnote, data.authorizationdate, data.paymentid])
        //     .then(function(results) {
        //         console.log(results);
        //         
        //         resolve(results[0]);
        //     })
        //     .catch(function(err) {
        //         reject(err);
        //     });

        db.query(`UPDATE ${db.schema}.t_am_auction_payment_details
        SET  status = $1, authorizeby = $2, authorizationnote = $3, authorizationdate = $4
        WHERE paymentid = $5 returning *;`,
            [data.status, data.authorizeby, data.authorizationnote, data.authorizationdate, data.paymentid])
            .then(function(results) {
                console.log(results);
                
                resolve(results[0]);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.statusHistory = function () {

}
module.exports.getStatusList = function () {
    return new Promise(function(resolve, reject) {
        let statusList =[{
            id : 1,
            name : "New"
        },{
            id : 2,
            name : "Verified"
        },{
            id : 3,
            name : "Cancelled"
        }
        ]
        resolve(statusList);
    });
}
module.exports.findPayment = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT t1.paymentid, t1.auctionid, t1.userid, t1.username, t1.userphoneno, t1.useremailid, t1.amount, t1.paymetslipurl, 
                    t1.status as statusid, t1.insertdate, t1.authorizeby, t1.authorizationnote, t1.authorizationdate,
                    t2.status_desc as status,t3.title,t3.winbidprice as bidamount                    
                    FROM ${db.schema}.t_am_auction_payment_details t1 
                    INNER JOIN ${db.schema}.t_ma_status_master t2 ON t1.status = t2.status_id
                    INNER JOIN ${db.schema}.t_am_auction_details t3 ON t1.auctionid = t3.auctionid 
                    ${data.whereClause} 
                    ${data.orderByClause}
                    LIMIT $1 OFFSET $2;`,[data.limit,data.offset])
            .then(async function(results) {
                

                let count = await self.getPaymentCount(data);
                let response = {
                    "data" : results,
                    totalRecords : count
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findAllPayments = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT t1.paymentid, t1.auctionid, t1.userid, t1.username, t1.userphoneno, t1.useremailid, t1.amount, t1.paymetslipurl, 
                    t1.status as statusid, t1.insertdate, t1.authorizeby, t1.authorizationnote, t1.authorizationdate,
                    t2.status_desc as status,t3.title ,t3.winbidprice as bidamount                   
                    FROM ${db.schema}.t_am_auction_payment_details t1 
                    INNER JOIN ${db.schema}.t_ma_status_master t2 ON t1.status = t2.status_id
                    INNER JOIN ${db.schema}.t_am_auction_details t3 ON t1.auctionid = t3.auctionid 
                    ${data.whereClause};`,[])
            .then(async function(results) {
                
                let response = {
                    "data" : results,
                    totalRecords : results.length
                }
                resolve(response);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}
module.exports.findPaymentByUserIdAndAuctionId = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT t1.paymentid, t1.auctionid, t1.userid, t1.username, t1.userphoneno, t1.useremailid, t1.amount, t1.paymetslipurl, 
                    t1.status as statusid, t1.insertdate, t1.authorizeby, t1.authorizationnote, t1.authorizationdate
                    FROM ${db.schema}.t_am_auction_payment_details t1 
                    WHERE t1.auctionid = $1 AND t1.userid =$2 and t1.payment_type = $3;`,[data.auctionid,data.userid,data.payment_type])
            .then(async function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

module.exports.getPaymentCount = function (data) {
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT count(*) FROM ${db.schema}.t_am_auction_payment_details t1
         INNER JOIN ${db.schema}.t_ma_status_master t2 ON t1.status = t2.status_id
         INNER JOIN ${db.schema}.t_am_auction_details t3 ON t1.auctionid = t3.auctionid 
        ${data.whereClause};`,[])
            .then(function(results) {
                resolve(results[0].count);
            })
            .catch(function(err) {
                reject(0);
            });
    });
}

module.exports.findBiddingByUserIdAndAuctionId = function (data) {
    var self = this;
    return new Promise(function(resolve, reject) {
        
        db.query(`SELECT * FROM ${db.schema}.t_am_auction_bidding_details 
                    WHERE auctionid = $1 AND userid =$2;`,[data.auctionid,data.userid])
            .then(async function(results) {
                
                resolve(results);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}