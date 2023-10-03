const Promise = require('promise');
const STNK = require('../models/stnkVerification');
const util = require('../controllers/util');
const ActivityLogService = require('../services/activityLogs');
const UserService = require('../services/user');
const UserModel= require('../models/user');
const StatusMaster = require('../models/statusMaster');
const logger = require('../config/logging');

module.exports = {
    createStnk: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let date = util.getTimestamp();
            let validUntil = payload.validUntil || "";
            if(validUntil.indexOf("/") > 0){
                let d = validUntil.split("/");
                if(d[0].length == 2){
                    validUntil = d[2]+"-"+d[1]+"-"+d[0];
                }
                else{
                    validUntil = d[0]+"-"+d[1]+"-"+d[2];
                }
            }
            let data = {
                reg_no : payload.regNo || "" ,
                contract_no : payload.contractNo || "" ,
                owner_name : payload.ownerName || "" ,
                brand_name : payload.brandName || "",
                type : payload.type || "",
                model : payload.model || "",
                chasis_no : payload.chasisNo || "",
                color : payload.color || "",
                machine_no : payload.machineNo || "",
                image_url : payload.imageUrl || "",
                status : payload.status || "1",
                remarks : payload.remarks || "",
                userid : payload.insertby || payload.insertBy|| null,
                valid_until : validUntil || "",
                insertdate : date,
                insertby : payload.insertby ||payload.insertBy|| null,
                lastmodifyby : payload.insertby || payload.insertBy,
                lastmodifydate : null
            };
            STNK.createStnk(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    if(err.code ='23505'){
                        err.message = "Stnk is already uploaded."
                    }
                    reject(err);
                });
        });
    },
    getSTNKStatus: async function (payload) {
        return new Promise(function(resolve, reject) {


            let data = {
                contract_no : payload.contractNo || "" ,
                loginid : payload.loginId || ""
            };
            STNK.findStnk(data)
                .then(function (result) {
                    let res = {
                        isStnkUploaded :false
                    };
                    if(result){
                        let valid_until = result.valid_until;
                        let expirydate = util.getDateDiff(valid_until);
                        let extensionReminderDays = 28;
                        if(expirydate <= extensionReminderDays){

                            res.expiryDate = valid_until;
                            res.extensionReminderDays = extensionReminderDays;
                            res.isExtensionRequired = true;
                        }else{
                            res.isExtensionRequired = false;
                        }
                        res.isStnkUploaded = true;
                    }
                    resolve(res);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }
};


