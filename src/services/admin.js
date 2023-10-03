const Promise = require('promise');
const BankInfo = require('../models/bankInfo');
const util = require('../controllers/util');
const logger = require('../config/logging');

module.exports = {

    addAdmin: async function (payload) {
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

            BankInfo.addBank(data)
                .then(function (result) {
                    if(result){
                    }
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
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


            BankInfo.updateBankDetail(data)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
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
    }
};

