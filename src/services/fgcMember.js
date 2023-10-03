const Promise = require('promise');
const FGC = require('../models/fgcMemeber');
const UserDocumentModel = require('../models/documents');
const util = require('../controllers/util');
const logger = require('../config/logging');
const ActivityLogService = require('../services/activityLogs');
const StatusMaster = require('../models/statusMaster');
const UserModel = require('../models/user');
const ContractsService = require('../services/contracts');
const crmAuthService = require('../services/crmAuth');
const notification = require('../services/notification');
const otpService = require('../services/otp');
const fs = require('fs-extra');
const request = require('request');
const appConstants = require('../config/appConstants');
const path = require('path');
const PointManagement = require('../services/pointManagement');
const QRCode = require('qrcode');
const env = require('../config/env/environment');


module.exports = {

    memberRequest: async function (payload) {
        return new Promise(async function(resolve, reject) {

            try{
                //get auth token for crm API's
                let loginData = await crmAuthService.getCRMAuthToken();

                payload.accessToken = loginData.accessToken;

                //get custNo and idNo from main no.
                let headersObj = {
                    "Authorization": "bearer " + payload.accessToken,
                    "Content-Type": "application/json"
                }

                let customerContractData = await ContractsService.getContracts(payload, headersObj);



                //customerContractData = JSON.parse(customerContractData);
                logger.info(" \n\n\ncustomerContractData  : ", customerContractData);
                if(customerContractData.length > 0 ){
                    payload.custNo = customerContractData[0].cust_no;
                    payload.idNo = customerContractData[0].identity_no;

                    //get FGC api auth token
                    let FGCTokenData = await getFGCAuth();

                    payload.accessToken = FGCTokenData.accessToken;

                    //hit crm uvp memmber request api with params : custNo,idNo,file i.e payload.files[0]
                    let res = await upvMemberRequest(payload);
                    if (res) {
                        let pointsData = {
                            loginId: payload.loginId,
                            activityappid: 'BE A MEMBER',
                            description: 'Membership Request Sent'
                        }
                        sendMemberNotification(payload.loginId);
                        let userPoints = await addActivityPoints(pointsData);
                        if (userPoints){
                            res.pointsAdded = userPoints;
                        }
                    }
                    resolve(res);
                }else {
                    reject(new Error("Anda belum memiliki kontrak di FIF"));
                }
            }
            catch (err){
                reject(err);
            }

        });
    },

    checkPlafond: async function (payload) {
        return new Promise(async function(resolve, reject) {

            try{
                payload.type = "CheckPlafond";
                let otp = await otpService.validateOtp(payload);
                if(payload.loginId && (otp.userid == payload.loginId)){
                    let member = await FGC.getMemberInfo(payload.loginId);
                    let res = {
                        availableBalance : 0,
                        status : 'Inactive'
                    }
                    let loginData = await crmAuthService.getCRMAuthToken();
                    let data = {};
                    data.accessToken = loginData.accessToken;
                    data.custNo = member['member_info']['custNo'];

                    member['member_info'] = await  getUpdatedMemberInfo(data);

                    if( member['member_info']){
                        res.availableBalance = member['member_info']['availableBalance'] || 0;
                        res.status = member['member_info']['status'] ;
                    }
                    resolve(res);
                }else{
                    reject(null);
                }
            }
            catch (err){
                reject(err);
            }

        });
    },

    getCustomerFGCInfo: async function (payload) {
        console.log('in info');
        return new Promise(async function(resolve, reject) {
            try{
                console.log(payload);
                if(payload.custMainNo){
                    let loginData = await crmAuthService.getCRMAuthToken();
                    console.log('-------------------------');
                    console.log(loginData);
                    let data = {};
                    data.accessToken = loginData.accessToken;
                    data.custMainNo = payload.custMainNo;

                    let memberInfo = await getLatestMemberInfo(data);
                    console.log('in member info respomse');
                    resolve(memberInfo);
                }else{
                    reject(null);
                }
            }
            catch (err){
                reject(err);
            }

        });
    },

    upgradeMemberRequest: function (payload) {
        return new Promise(async function(resolve, reject) {
            try{
                let date = util.getTimestamp();

                data = {
                    member_no : payload.memberNo,
                    ktp_id : payload.ktpNo,
                    billing_address : payload.billingAddress,
                    province : payload.province,
                    city : payload.district,
                    sub_district : payload.subDistrict || payload.sub_district,
                    village : payload.village,
                    post_code : payload.postalCode,
                    job : payload.job,
                    income : payload.income,
                    status : payload.status || 1,
                    remarks : payload.remarks || "",
                    insertdate :date,
                    insertby : payload.insertBy,
                    lastmodifydate :date,
                    lastmodifyby :payload.insertBy,
                    home_status : payload.homeStatus,
                    userid : payload.insertBy,
                    doc_path : payload.docPath,
                    rt : payload.rt,
                    rw : payload.rw,

                    name : '',
                    phone_no : '',
                    email : '',
                    dob : null,
                    address : ""
                }
                let user = await UserModel.findUserByLoginId(payload.insertBy) || {};
                logger.info("User  data : ", user);
                let userKtpDocument = await UserDocumentModel.getCustomerDocInfo({loginId : payload.insertBy , docCode : "001"});
                if(userKtpDocument && userKtpDocument.length > 0){

                    let dob = userKtpDocument[0].birthdate ||"";
                    data.dob = dob || null;
                }

                data.name = user.name || "";
                data.phone_no = user.msisdn || "";
                data.email = user.email || "";
                data.address = user.address || "";

                FGC.upgradeMember(data)
                    .then(async function (result) {
                        let pointsData = {
                            loginId: payload.insertBy,
                            activityappid: 'UPGRADE MEMBER',
                            description: 'Membership Upgraded'
                        }
                        let userPoints = await addActivityPoints(pointsData);
                        if (userPoints){
                            result.pointsAdded = userPoints;
                        }
                        createActivityLog(result);
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            catch(err){
                reject(err)
            }

        });
    },

    updateMemberStatus: async function(payload) {
        return new Promise(async function(resolve, reject) {

            let date = util.getTimestamp(new Date());
            let memberData = {
                status : 1,
                insertdate : util.getTimestamp(),
                insertby : data.loginId,
                member_info : {},
                userid : data.loginId,
                custNo : data.custNo,
                idNo : data.idNo
            }
            await FGC.addMember(memberData);

            FGC.updateStatus(data)
                .then(async function(result) {
                    sendUpgradeNotification(result);
                    createActivityLog(result);

                    resolve(result.id);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },

    updateUserFGCDetails: async function(payload) {
        return new Promise(async function(resolve, reject) {

            let date = util.getTimestamp(new Date());
            let memberData = {
                status : 2,
                insertdate : util.getTimestamp(),
                insertby : payload.loginId,
                member_info : payload.memberInfo,
                userid : payload.loginId,
                custNo : payload.custNo,
                idNo : payload.idNo
            }
            await FGC.addMember(memberData);
            resolve(memberData);
            // FGC.updateStatus(data)
            //     .then(async function(result) {
            //         sendUpgradeNotification(result);
            //         createActivityLog(result);

            //         resolve(result.id);
            //     })
            //     .catch(function(err) {
            //         reject(err);
            //     });
        });
    },

    updateStatus: async function(payload) {
        return new Promise(function(resolve, reject) {

            let date = util.getTimestamp(new Date());
            let data = {
                status: payload.status,
                modifyBy: payload.modifyBy || null,
                notes: payload.notes || '',
                modifyDate: date,
                id: payload.id
            };

            FGC.updateStatus(data)
                .then(async function(result) {
                    sendUpgradeNotification(result);
                    createActivityLog(result);

                    resolve(result.id);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    },

    bulkUpdate: async function(payload) {
        return new Promise(function(resolve, reject) {
            try{
                let date = util.getTimestamp(new Date());

                let data = payload.data;
                if(data){
                    let memberNotUpdated = []
                    data.forEach(async (user ,index,obj)=>{
                        user.status = user.status || ""
                        user.status = user.status.toLowerCase();
                        if(user.status == "approved" || user.status == "rejected"){
                            if(user.status == "approved"){
                                status= 2;
                            }
                            if(user.status == "rejected"){
                                status= 3;
                            }

                            let userData = {
                                status: status,
                                modifyBy: payload.modifyBy || null,
                                notes: payload.notes || 'Member status updated using bulk upload feature',
                                modifyDate: date,
                                member_no: user.membercardnumber
                            };

                            let updatedUser = await FGC.updateStatusByMemberNo(userData)
                                .catch(function(err) {
                                    logger.error(err);
                                });
                            if(updatedUser){
                                sendUpgradeNotification(updatedUser);
                                updatedUser.userid = updatedUser.lastmodifyby;
                                createActivityLog(updatedUser);
                            }else{
                                 memberNotUpdated.push(user);
                            }
                        }
                        else{
                            memberNotUpdated.push(user);
                        }
                        if(index == obj.length-1){

                            if(memberNotUpdated.length > 0){
                                reject({membersNotUpdated : memberNotUpdated});
                            }
                            resolve({membersNotUpdated : []})
                        }
                    });

                }
                else{
                    reject(new Error("Invalid format"));
                }
            }
            catch(err){
                reject(err);
            }
        });
    },

    statusHistory: async function(payload) {
        return new Promise(function(resolve, reject) {
            let data = {
                activitymodule: payload.id,
                activitytype: "upgrade_member"
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

    memberInfoScheduler: async function (payload) {
        return new Promise(async function(resolve, reject) {

            try{
                // get data filtered by status = 1 (requested);
                logger.info("FGC member info scheduler running ...");
                let memberRequests = await FGC.getMemberRequests();

                // Iterate through record and call member info crm api
                let FGCTokenData = await getFGCAuth();
                let accessToken = FGCTokenData.accessToken;
                logger.info("Member request in pending status : ",memberRequests);
                memberRequests.forEach(function (record) {
                    let memberData = {
                        custNo: record.cust_no,
                        accessToken: accessToken,
                        userid : record.userid
                    }
                    logger.info("member request for customer : custNo --",memberData.custNo);
                    getMemberInfo(memberData);
                });
                resolve(true);
                //on success update status to approved/rejected
            }
            catch(err){
                reject(false);
            }
        });
    },

    findMember: async function(payload) {
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
                if (searchParams.name) {
                    whereClause.push(`name ILIKE '%${searchParams.name}%'`)
                }
                if (searchParams.msisdn) {
                    whereClause.push(`phone_no ILIKE '%${searchParams.msisdn}%'`)
                }
                if (searchParams.email) {
                    whereClause.push(`email ILIKE '%${searchParams.email}%'`)
                }
                if (searchParams.address) {
                    whereClause.push(`address ILIKE '%${searchParams.address}%'`)
                }
                if (searchParams.billingAddress) {
                    whereClause.push(`billing_address ILIKE '%${searchParams.billingAddress}%'`)
                }
                if (searchParams.job) {
                    whereClause.push(`job ILIKE '%${searchParams.job}%'`)
                }
                if (searchParams.salary) {
                    whereClause.push(`income ILIKE '%${searchParams.salary}%'`)
                }
                if (searchParams.status) {
                    whereClause.push(`status ILIKE '%${searchParams.status}%'`)
                }
                if (searchParams.homeStatus) {
                    whereClause.push(`home_status ILIKE '%${searchParams.homeStatus}%'`)
                }
                if (searchParams.memberCardNo) {
                    whereClause.push(`member_no ILIKE '%${searchParams.memberCardNo}%'`)
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
                FGC.findAllMembers(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
            else{
                FGC.findMember(data)
                    .then(function(result) {
                        resolve(result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }

        });
    },

    generateQRcode: async function(payload) {
        return new Promise(function(resolve, reject) {
            try{
                fs.mkdirsSync(`./public/staticdata/qrcode`);
                let data = payload["data"][0] || {};

                data = `${data.custNo}+${data.cardNo}+${data.validUntilString}`;

                QRCode.toFile(`./public/staticdata/qrcode/${payload.loginId}_QRcode.png`, data, {},
                    function (err) {
                    if (err) {
                        logger.error(err)
                        reject(err);
                    }
                    else{
                        logger.info('QR code generated for user : ',payload.loginId);
                        let qrcodePath = env.cms.baseUrl+`staticdata/qrcode/${payload.loginId}_QRcode.png`;
                        FGC.updateMemberQRCode({qrcode : qrcodePath ,userid : payload.loginId});
                        resolve({path : qrcodePath });
                    }
                })
            }
            catch( err ){
                logger.error(err)
                resolve( null );
            }
        });
    }

};

function upvMemberRequest(data) {
    return new Promise(async function(resolve, reject) {
        try{
            let headersObj = {
                "Authorization": "bearer " + data.accessToken,
                "content-type": "multipart/form-data"
            }
            let dir = './public/staticdata/docs/';
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            let attachments = [];
            for (let i = 0; i < data.files.length; i++) {
                let path1 = "./"
                attachments.push(fs.createReadStream("./"+data.files[i]));
            }

            const formData = {
                file: attachments[0]
            };
            request.post({
                headers: {
                    "Authorization": "bearer " + data.accessToken
                },
                url: appConstants.fgcBaseUrl+`fifmembers/memberRequest?custNo=${data.custNo}&idNo=${data.idNo}`,
                formData: formData
            }, async function optionalCallback(err, httpResponse, body) {

                try{
                    if (err) {
                        logger.error('upload failed:', err);
                        reject(err);
                    }
                    //console.log('Upload successful!  Server responded with:', body);
                    for (let i = 0; i < data.files.length; i++) {
                        // fs.unlinkSync('image.png');
                    }

                    try {
                        let res = JSON.parse(body);
                        if(res.success == true){
                            let memberData = {
                                status : 1,
                                insertdate : util.getTimestamp(),
                                insertby : data.loginId,
                                member_info : {},
                                userid : data.loginId,
                                custNo : data.custNo,
                                idNo : data.idNo
                            }
                            await FGC.addMember(memberData);
                            resolve(res);
                        }
                        // else if(res.message == "Anda sudah terdaftar sebagai member Kartu Belanja dari FIFGROUP."){
                        //     //hit member Info for that custNo and save member info
                        //     // let memberInfo = await getMemberInfo(data);
                        //     let memberData = {
                        //         status : 2,
                        //         insertdate : util.getTimestamp(),
                        //         insertby : data.loginId,
                        //         member_info : memberInfo,
                        //         userid : data.loginId,
                        //         custNo : data.custNo,
                        //         idNo : data.idNo
                        //     }
                        //
                        //     await FGC.addMember(memberData);
                        //     resolve(res);
                        // }
                        else if(res.message == "Pengajuan member Anda sedang diproses."){

                            let memberData = {
                                status : 1,
                                insertdate : util.getTimestamp(),
                                insertby : data.loginId,
                                member_info : {},
                                userid : data.loginId,
                                custNo : data.custNo,
                                idNo : data.idNo
                            }

                            await FGC.addMember(memberData);
                            resolve(res);
                        }
                        else{
                            resolve(res);
                        }
                    }
                    catch(err){
                        reject(new Error("Saat ini sedang terjadi gangguan teknis di FIFGROUP, Mohon coba kembali dalam beberapa saat lagi"));
                    }

                }
                catch(err){
                    reject(err);
                }
            });
        }
        catch (err){
            reject(err);
        }
    });
}

function getFGCAuth(){
    return new Promise(function(resolve,reject){

        let formReqData = {
            username: appConstants.fgcAuthCredentials.authUsername,
            password: appConstants.fgcAuthCredentials.authPassword,
            client_id: appConstants.fgcAuthCredentials.authClientId,
            client_secret: appConstants.fgcAuthCredentials.authClientSecret,
            grant_type: appConstants.fgcAuthCredentials.authGrantType,
        }
        request.post({
                url: appConstants.fifFGCAuthUrl,
                form: formReqData
            },
            function(err, httpResponse, body) {
                if (!err) {
                    try {
                        body = JSON.parse(body);
                        if (body.access_token) {
                            let obj = {
                                accessToken: body.access_token
                            }
                            resolve(obj);
                        } else {
                            let errObj = {
                                'error': 'Invalid User Credentials'
                            }
                            reject(errObj);
                        }
                    }
                    catch(error) {
                        let errObj = {
                            'error': 'Invalid User Credentials'
                        }
                        reject(errObj);
                    }
                    
                } else {
                    let errObj = {
                        'error': 'Invalid User Credentials'
                    }
                    reject(errObj);
                }
            });
    });
}

function getMemberInfo(data) {
    return new Promise(async function(resolve, reject) {
        try{
            request.get({
                headers: {
                    "Authorization": "bearer " + data.accessToken
                },
                url: appConstants.fgcBaseUrl+`fifmembers/info?custNo=${data.custNo}`
            }, async function optionalCallback(err, httpResponse, body) {

                try{
                    if (err) {
                        logger.error('member info failed:', err);
                        reject(err);
                    }
                    let res = JSON.parse(body);
                    logger.info("member info response for custNo -- "+data.custNo,res);
                    if(res.success == true){

                        if(res.status == 'rejected'){
                            let userId = data.loginId || data.userid;
                            FGC.deleteMember(userId);
                            sendMemberRejectionNotification(userId);
                        }
                        //E card request for getting number
                        else if(res.cardNo == null && !(res.cardStatus == 'customer' || res.cardStatus == 'digital')){
                            cardRequest(data);
                        }
                        else{
                            let memberData = {
                                status : 2,
                                member_info : res,
                                userid:data.loginId || data.userid
                            }
                            //update member request status and member info
                            let update = await FGC.updateMemberDetails(memberData);
                            if(!update){
                                sendMemberApprovedNotification(memberData.userid);
                            }


                        }
                        resolve(res);
                    }
                    else{
                        reject(new Error(res.message));
                    }
                }
                catch(err){
                    reject(err);
                }
            });
        }
        catch (err){
            reject(err);
        }
    });
}
function getUpdatedMemberInfo(data) {
    return new Promise(async function(resolve, reject) {
        try{
            request.get({
                headers: {
                    "Authorization": "bearer " + data.accessToken
                },
                url: appConstants.fgcBaseUrl+`fifmembers/info?custNo=${data.custNo}`
            }, async function optionalCallback(err, httpResponse, body) {

                try{
                    if (err) {
                        logger.error('member info failed:', err);
                        reject(err);
                    }
                    let res = JSON.parse(body);
                    logger.info("member info response for custNo -- "+data.custNo,res);
                    if(res.success == true){
                        resolve(res);
                    }
                    else{
                        reject(new Error(res.message));
                    }
                }
                catch(err){
                    reject(err);
                }
            });
        }
        catch (err){
            reject(err);
        }
    });
}

function getLatestMemberInfo(data) {
    return new Promise(async function(resolve, reject) {
        try{
            request.get({
                headers: {
                    "Authorization": "bearer " + data.accessToken
                },
                url: appConstants.fgcBaseUrl+`fifmembers/info/main?custMainNo=${data.custMainNo}`
            }, async function optionalCallback(err, httpResponse, body) {

                try{
                    if (err) {
                        logger.error('member info failed:', err);
                        reject(err);
                    }
                    let res = JSON.parse(body);
                    logger.info("member info response for custNo -- "+data.custMainNo,res);
                    if(res.success == true){
                        resolve(res);
                    }
                    else{
                        // reject(new Error(res.message));
                        resolve(true);
                    }
                }
                catch(err){
                    reject(err);
                }
            });
        }
        catch (err){
            reject(err);
        }
    });
}

function cardRequest(data) {
    return new Promise(async function(resolve, reject) {
        try{
            request.post({
                headers: {
                    "Authorization": "bearer " + data.accessToken
                },
                url: appConstants.fgcBaseUrl+`fifmembers/cardRequest?custNo=${data.custNo}&covLetDelivery=email&cardType=a`
            }, async function optionalCallback(err, httpResponse, body) {

                try{
                    if (err) {
                        logger.error('E card request api failed:', err);
                        reject(err);
                    }
                    let res = JSON.parse(body);
                    logger.info("E card request api response for custNo -- "+data.custNo,res);
                    resolve(res);
                }
                catch(err){
                    reject(err);
                }
            });
        }
        catch (err){
            reject(err);
        }
    });
}

async function addActivityPoints(data) {
    return new Promise(async function (resolve,reject) {
        let pointsData = {
            loginid: data.loginId || null,
            activityappid: data.activityappid,
            description: data.description
        }
        try{
            let toAddPoints = await PointManagement.addPointsForActivity(pointsData);
            let pointsAdded = 0;
            if (toAddPoints.currentPoints){
                pointsAdded = toAddPoints.currentPoints;
            }
            resolve(pointsAdded);
        }catch (err){
            logger.error(err);
        }
    });
}

async function createActivityLog(record) {
    let data = {};
    let status = record.status;
    try {
        status = await getStatusName({ statusid: status, module: 'FGC' });
        data.loginid = record.lastmodifyby;
        data.activitydesc = status;
        data.activitytype = 'upgrade_member';
        data.activitymodule = record.id;
        data.remarks = record.remarks || '';
        ActivityLogService.createActivityLog(data);
    } catch (err) {
        logger.error(err);
    }
}

function getStatusName(payload) {
    return new Promise(function(resolve, reject) {

        let data = {};
        let whereClause = []
        let searchParams = payload;
        if (searchParams) {
            if (searchParams.statusid) {
                whereClause.push(`status_id = '${searchParams.statusid}'`)
            }
            if (searchParams.module) {
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

function sendMemberNotification(userId) {

    let data= {
        type: "FGC_MEMBER_SUBMIITED",
        refid: new Date().getTime()
    }
    notification.sendNotification(data,{loginid : userId},false,true,false);
}
function sendMemberApprovedNotification(userId) {

    let data= {
        type: "FGC_MEMBER",
        refid: new Date().getTime()
    }
    notification.sendNotification(data,{loginid : userId},false,true,false);
}
function sendMemberRejectionNotification(userId) {

    let data= {
        type: "FGC_MEMBER_REJECTED",
        refid: new Date().getTime()
    }
    notification.sendNotification(data,{loginid : userId},false,true,false);
}

async function sendUpgradeNotification(data) {

    if(data.status == 1){
        // Submitted
        data.type = "FGC_UPGRADE_SUBMITTED";
        data.refid = new Date().getTime();
    }if(data.status == 2){
        // Approved
        data.type = "FGC_UPGRADE_APPROVED";
        data.refid = new Date().getTime();
    }
    if(data.status == 3){
        // Rejected
        data.type = "FGC_UPGRADE_REJECTED";
        data.refid = new Date().getTime();
    }
    let memberInfo = await FGC.getMemberInfo(data.userid);

    if(memberInfo && memberInfo.member_info && memberInfo.member_info.availableBalance){
        let loginData = await crmAuthService.getCRMAuthToken();
        //let data = {};
        data.accessToken = loginData.accessToken;
        data.custNo = memberInfo['member_info']['custNo'];
        memberInfo['member_info'] = await getUpdatedMemberInfo(data);
        data.availableBalance = memberInfo.member_info.availableBalance;
    }
    notification.sendNotification(data,{loginid : data.userid},false,true,false);
}
