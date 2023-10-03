const Promise = require('promise');
const BankInfo = require('../models/bankInfo');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports = {

    addBank: async function (payload) {
        return new Promise(function(resolve, reject) {
            
            let data = {};
            let date = util.getTimestamp();
            data.bankname = payload.bankname;
            data.bankdesc = payload.bankdesc;
            data.accountno = payload.accountno;
            data.accountname = payload.accountname;
            data.accounttype  = payload.accounttype;
            data.banklogo = payload.banklogo;
            data.instruction = JSON.stringify(payload.instruction);
            data.insertdate = date;
            data.insertby = payload.insertby;
            data.lastmodifydate = null;
            data.lastmodifyby = null;

            let tempData = {"bankname":payload.bankname};
            BankInfo.checkBankNameUnique(tempData)
              .then(function(resultCount){
                logger.debug(resultCount);
                if(resultCount > 0){
                  reject({"message":"Bank Name already exists."})
                }else{
                  BankInfo.addBank(data)
                    .then(function (result) {
                        resolve(result);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
                }
            }).catch(function (err){
              reject(error);
            });
        });
    },
    updateBank: async function (payload) {
        return new Promise(function(resolve, reject) {
            

            let data = {};
            let date = util.getTimestamp();
            data.bankname = payload.bankname;
            data.bankdesc = payload.bankdesc;
            data.accountno = payload.accountno;
            data.accountname = payload.accountname;
            data.accounttype  = payload.accounttype;
            data.banklogo = payload.banklogo;
            data.instruction = JSON.stringify(payload.instruction);
            data.lastmodifydate = date;
            data.lastmodifyby = payload.modifyby;
            data.bankid = payload.bankid;

            let tempData = {"bankname":payload.bankname,"bankid":payload.bankid};
            BankInfo.checkBankNameUnique(tempData)
              .then(function(resultCount){
                logger.debug(resultCount);
                if(resultCount > 0){
                  reject({"message":"Bank Name already exists."})
                }else{
                  BankInfo.updateBankDetail(data)
                      .then(function (result) {
                          resolve(result);
                      })
                      .catch(function (err) {
                          reject(err);
                      });
                }
            });
        });
    },
    getBankList: async function () {
        return new Promise(function(resolve, reject) {
            
            BankInfo.getBankList()
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    getBankDetail: async function (bankId) {
        return new Promise(function(resolve, reject) {
            
            BankInfo.getBankDetail(bankId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    deleteBank: async function (bankId) {
        return new Promise(function(resolve, reject) {
            
            BankInfo.deleteBank(bankId)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },listBanks: async function(payload){
        return new Promise(function(resolve,reject){
            
            let data = {};
            data.limit = payload.limit || 10;
            data.offset = (payload.page - 1)* payload.limit || 0 ;
            data.isExport = payload.isExport || 0;

            if( data.offset < 0 )
                data.offset = 0;

            data.orderByClause = util.formatOrderByClause(payload);
            data.searchParams = payload.searchParams;

            if (data.isExport == 0) {
                BankInfo.bankDetailsList(data)
                    .then(function(result){
                        resolve(result);
                    }).catch(function(err){
                    reject(err);
                });
            }
            else {
                BankInfo.allBankDetailsList(data)
                    .then(function(result){
                        resolve(result);
                    }).catch(function(err){
                    reject(err);
                });
            }
        });
    }
};
