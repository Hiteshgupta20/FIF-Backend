const Promise = require("promise");
const ActivityService = require("./activity");
const util = require("../controllers/util");
const logger = require("../config/logging");
const crmAuth = require("./crmAuth");
const request = require("request");
const FmcBooking = require("../models/fmcBookingReservation")
const appConstants = require('../config/appConstants');
const moment = require('moment');
const NotificationService = require('./notification');
const User = require('../models/user')
const UserModel = require('../models/user');
const Util = require('../controllers/util');
const { mutateResponseToWrapBodyInAnArray } = require('../utils/commonFunctions')

module.exports.cekIssExist = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };
                let data = {};
                data.servOfficeCode = payload.servOfficeCode || null;
                let IssData = await getIssData(data, headersObj);
                resolve(IssData);
            }
        } catch (err) {
            reject(err);
        }
    });
};

module.exports.checkBPKBKontrak = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.contractNo = payload.contractNo || null;
                let BPKBKontrak = await getBPKBData(data, headersObj);
                resolve(BPKBKontrak);
            }
        } catch (err) {
            reject(err);
        }
    });
};

module.exports.dayTimeFrame = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                let date = moment();
                data.servOfficeCode = payload.servOfficeCode || null;
                data.serviceId = payload.serviceId || null;
                data.bookingDate = payload.bookingDate || moment().add(1, 'days').format("YYYY-MM-DD")
                console.log(data)
                let dayTimeFrame = await getdayTimeFrame(data, headersObj);
                resolve(dayTimeFrame);
            }

        } catch (err) {
            reject(err);
        }
    });
};

module.exports.getClockTimeFrame = async function (payload) {
    console.log(payload)
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.servOfficeCode = payload.servOfficeCode || null;
                data.serviceId = payload.serviceId || null;
                data.bookingDate = payload.bookingDate || moment().format("YYYY-MM-DD");
                console.log(data.bookingDate)
                let clockTimeFrame = await getClockTimeFrame(data, headersObj);
                resolve(clockTimeFrame);
            }

        } catch (err) {
            reject(err);
        }
    });
};

module.exports.bookingFMC = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.bookingTime = payload.bookingTime
                data.contractNo = payload.contractNo
                data.customerId = payload.customerId
                data.officeCode = payload.officeCode
                data.servOfficeCode = payload.servOfficeCode;
                data.serviceId = payload.serviceId
                data.loginId = payload.loginId
                data.brandName = payload.brandName
                let bookingFMC = await bookingFmcReservation(data, headersObj);
                let bookingReservationData = bookingFMC.data[0]

                if (Object.keys(bookingReservationData).length != 0) {
                    let bookingData = {}
                    let date = new Date();
                    bookingData.customerno = data.customerId;
                    bookingData.bookingid = bookingReservationData.id;
                    bookingData.qrcode = bookingReservationData.qrCode;
                    bookingData.contractno = bookingReservationData.contractNo;
                    bookingData.bookingcode = bookingReservationData.bookingCode;
                    bookingData.bookingdate = bookingReservationData.bookingDate;
                    bookingData.bookingstatus = bookingReservationData.bookingStatus;
                    bookingData.loginid = data.loginId;
                    bookingData.insertdate = date;
                    bookingData.serviceid = data.serviceId;
                    bookingData.brandName = data.brandName;
                    bookingData.officename = bookingReservationData.officeName
                    bookingData.servicename = bookingReservationData.serviceName
                    bookingData.servOfficeCode = bookingReservationData.servOfficeCode
                    let fmcBookingDetails = await FmcBooking.fmcBookingDetails(bookingData)
                    resolve(fmcBookingDetails);
                }
                else {
                    resolve(bookingFMC)
                }
            }
        } catch (err) {
            reject(err);
        }
    });
};

module.exports.myBooking = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.customerNo = payload.customerNo || null
                let FmcUserBookingList = await FmcBooking.bookingList(data)
                // console.log(FmcUserBookingList)

                let fmcUserBookingData = {}
                let fmcBookingData = []
                let bookingList = await getBookingList(data, headersObj);
                let bookingListData = bookingList.data
                let sortedArray = []
                sortedArray = bookingListData
                sortedArray.sort(function (a, b) {
                    if (new Date(a.bookingDate).getTime() > new Date(b.bookingDate).getTime())
                        return -1;
                    if (new Date(a.bookingDate).getTime() < new Date(b.bookingDate).getTime())
                        return 1;
                    return 0;
                });
                if (Object.keys(bookingListData).length !== 0) {
                    sortedArray.forEach(function (APIResponseData) {
                        FmcUserBookingList.forEach(function (i) {
                            if (APIResponseData.id == i.bookingid) {

                                fmcUserBookingData.id = APIResponseData.id
                                fmcUserBookingData.contractNo = APIResponseData.contractNo
                                fmcUserBookingData.qrCode = APIResponseData.qrCode
                                fmcUserBookingData.bookingCode = APIResponseData.bookingCode
                                fmcUserBookingData.bookingDate = moment(APIResponseData.bookingDate).format("DD/MM/YYYY HH:mm")
                                fmcUserBookingData.bookingStatus = APIResponseData.bookingStatus
                                fmcUserBookingData.serviceId = i.serviceid
                                fmcUserBookingData.servOfficeCode = APIResponseData.servOfficeCode
                                fmcUserBookingData.officeName = APIResponseData.officeName
                                fmcUserBookingData.serviceName = APIResponseData.serviceName
                                fmcUserBookingData.brandName = i.brandName
                                fmcBookingData.push(fmcUserBookingData)
                                fmcUserBookingData = {};
                                let fmcBookingDataArraytoObject = {
                                    data: fmcBookingData
                                }
                                resolve(fmcBookingDataArraytoObject)
                            } else {
                                return bookingList;
                            }
                        })
                        resolve(bookingList)
                    })
                } else {
                    resolve(bookingList)
                }
            }

        } catch (err) {
            reject(err);
        }
    });
};

module.exports.bookingReservationReminder = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            logger.info("------------Booking Reservation Reminder running-------------")
            let userdata = []
            let bookingReservationData = []
            bookingReservationData = await FmcBooking.bookingReservationData()
            if (bookingReservationData.length !== 0) {
                bookingReservationData.forEach(async function (bookingData) {
                    userdata = await User.getUserDetailsByCustMainNo(bookingData.customerno)
                    userdata.forEach(async function (userData) {
                        if (bookingData['bookingdate']) {
                            let bookingDate = new Date(bookingData['bookingdate'])
                            let currentDate = new Date();
                            var diff = 0;
                            diff = Math.ceil((bookingDate.getDate() - currentDate.getDate()));
                            let notificationData = {}
                            console.log("++++", diff)
                            if (bookingDate.getDate() > currentDate.getDate() && diff == 1 && bookingData.serviceid == 7) {
                                notificationData = {
                                    type: 'STNK BOOKING REMINDER D-1',
                                    bookingdate: moment(bookingDate).tz('Asia/Jakarta').format('DD-MM-YYYY'),
                                    bookingtime: moment(bookingDate).tz('Asia/Jakarta').format('HH:mm'),
                                    bookingbranch: userData.branchname,
                                    refid: new Date().getTime(),
                                }
                            } else if (currentDate.getDate() == bookingDate.getDate() && diff == 0 && bookingData.serviceid == 7) {
                                notificationData = {
                                    type: 'STNK BOOKING REMINDER D-DAY',
                                    bookingdate: moment(bookingDate).tz('Asia/Jakarta').format('DD-MM-YYYY'),
                                    bookingtime: moment(bookingDate).tz('Asia/Jakarta').format('HH:mm'),
                                    bookingbranch: userData.branchname,
                                    refid: new Date().getTime(),
                                }
                            } else if (bookingDate.getDate() > currentDate.getDate() && diff == 1 && bookingData.serviceid == 11) {
                                notificationData = {
                                    type: 'BPKB BOOKING REMINDER D-1',
                                    bookingdate: moment(bookingDate).tz('Asia/Jakarta').format('DD-MM-YYYY'),
                                    bookingtime: moment(bookingDate).tz('Asia/Jakarta').format('HH:mm'),
                                    bookingbranch: userData.branchname,
                                    refid: new Date().getTime(),
                                }
                            } else if (currentDate.getDate() == bookingDate.getDate() && diff == 0 && bookingData.serviceid == 11) {
                                notificationData = {
                                    type: 'BPKB BOOKING REMINDER D-DAY',
                                    bookingdate: moment(bookingDate).tz('Asia/Jakarta').format('DD-MM-YYYY'),
                                    bookingtime: moment(bookingDate).tz('Asia/Jakarta').format('HH:mm'),
                                    bookingbranch: userData.branchname,
                                    refid: new Date().getTime(),
                                }
                            }
                            await NotificationService.sendNotification(notificationData, userData, false, true, false)
                        }
                    })

                })
                resolve(true)

            } else {
                resolve(true)
            }
        } catch (err) {
            reject(err);
        }
    });
};

module.exports.myBookingDetail = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.customerNo = payload.customerNo || null
                data.bookingId = payload.bookingId || null

                let fmcUserBookingData = {}
                let fmcBookingData = []
                let FmcUserBookingList = await FmcBooking.bookingDetails(data)
                let bookingdetails = await getMyBookingDetails(data, headersObj);
                let bookingdetailsData = bookingdetails.data[0]

                if (Object.keys(bookingdetailsData).length !== 0) {
                    if (bookingdetailsData.id == FmcUserBookingList.bookingid) {
                        fmcUserBookingData.id = bookingdetailsData.id
                        fmcUserBookingData.contractNo = bookingdetailsData.contractNo
                        fmcUserBookingData.qrCode = bookingdetailsData.qrCode
                        fmcUserBookingData.bookingCode = bookingdetailsData.bookingCode
                        fmcUserBookingData.bookingDate = moment(bookingdetailsData.bookingDate).format("DD/MM/YYYY HH:mm")
                        fmcUserBookingData.bookingStatus = bookingdetailsData.bookingStatus
                        fmcUserBookingData.servOfficeCode = bookingdetailsData.servOfficeCode
                        fmcUserBookingData.officeName = bookingdetailsData.officeName
                        fmcUserBookingData.serviceName = bookingdetailsData.serviceName
                        fmcUserBookingData.brandName = FmcUserBookingList.brandName
                        fmcBookingData.push(fmcUserBookingData)
                        fmcUserBookingData = {};
                        let fmcBookingDataArraytoObject = {
                            data: fmcBookingData
                        }
                        resolve(fmcBookingDataArraytoObject)
                    } else {
                        return bookingdetails;
                    }

                } else {
                    resolve(bookingdetails)
                }
            }

        } catch (err) {
            reject(err);
        }
    });
};

module.exports.deleteMyBooking = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.customerNo = payload.customerNo || null
                data.bookingId = payload.bookingId || null
                let deleteBooking = await deleteBookingdetails(data, headersObj);

                resolve(deleteBooking);
            }

        } catch (err) {
            reject(err);
        }
    });
};

module.exports.sendBookingEmail = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let email = payload.email || "";
            let loginid = payload.loginId || "";

            if (email && email.length > 0) {
                let data = {}
                data.email = payload.email
                data.loginid = payload.loginId
                triggerAlert(data);

            }
            resolve(true)


        } catch (err) {
            reject(err);
        }
    });
};

module.exports.checkPaymentCycle = async function (payload) {
    return new Promise(async function (resolve, reject) {
        try {
            let loginData = await crmAuth.getIssAuthToken();
            if (loginData.accessToken) {
                let headersObj = {
                    Authorization: loginData.accessToken,
                    "Content-Type": "application/json",
                };

                let data = {};
                data.contractNo = payload.contractNo;
                data.servOfficeCode = payload.servOfficeCode;
                let BPKBPaymentCycle = await getBPKBPaymentCycleData(data, headersObj);
                resolve(BPKBPaymentCycle);
            }
        } catch (err) {
            reject(err);
        }
    });
};


function triggerAlert(details) {
    if (details.email) {
        Util.triggerBookingEmail(details);
    }
}

async function getIssData(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "cekIssExist?servOfficeCode=" +
                    reqData.servOfficeCode,
            },
                function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        reject(response)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for Iss Branch Data");
                        resolve(formedResponse)
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for Iss Branch Data", err);
            reject(err);
        }
    });
}

async function getBPKBData(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "checkBPKBKontrak?contractNo=" +
                    reqData.contractNo,
            },
                function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        let result = JSON.parse(body)
                        logger.info("API Failed for BPKB OHD Status");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body)
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API succesfull for BPKB OHD Status");
                        resolve(formedResponse)
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for BPKB OHD Status", err);
            reject(err);
        }
    });
}

async function getdayTimeFrame(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "getDayTimeFrame?servOfficeCode=" +
                    reqData.servOfficeCode +
                    "&serviceId=" +
                    reqData.serviceId +
                    "&bookingDate=" +
                    reqData.bookingDate,
            },
                function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        console.log(body)
                        let result = JSON.parse(body)
                        logger.info("API Failed for DayTimeFrame Data");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for DayTimeFrame Data");
                        resolve(formedResponse);
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for DayTimeFrame Data", err);
            reject(err);
        }
    });
}

async function getClockTimeFrame(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "getClockTimeFrame?servOfficeCode=" +
                    reqData.servOfficeCode +
                    "&serviceId=" +
                    reqData.serviceId +
                    "&bookingDate=" +
                    reqData.bookingDate,
            },
                function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        let result = JSON.parse(body)
                        logger.info("API failed for clock time  Data");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for clock time  Data");
                        resolve(formedResponse);
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for clock time Data", err);
            reject(err);
        }
    });
}


async function bookingFmcReservation(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request.post({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "bookingFMC?bookingTime=" +
                    reqData.bookingTime +
                    "&contractNo=" +
                    reqData.contractNo +
                    "&customerId=" +
                    reqData.customerId +
                    "&serviceId=" + reqData.serviceId +
                    "&servOfficeCode=" + reqData.servOfficeCode,

            },
                function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        let result = JSON.parse(body)
                        logger.info("API Failed for Booking Queue Data");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for Booking Queue Data");
                        resolve(formedResponse);
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for Booking Queue Data", err);
            reject(err);
        }
    });
}

async function getBookingList(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "myBooking/" + reqData.customerNo
            },
                function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        let result = JSON.parse(body)
                        logger.info("API Failed for Booking List Data");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for Booking List Data");
                        resolve(formedResponse);
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for Booking List Data", err);
            reject(err);
        }
    });
}

async function getMyBookingDetails(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "myBookingDetail?bookingId=" +
                    reqData.bookingId +
                    "&customerNo=" +
                    reqData.customerNo
            },
                function (err, response, body) {
                    console.log(response.statusCode)
                    if (response.statusCode !== 200) {
                        let result = JSON.parse(body)
                        logger.info("API Failed for Booking Details list");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for Booking Details list");
                        resolve(formedResponse);
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for Booking details list", err);
            reject(err);
        }
    });
}

async function deleteBookingdetails(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request.post({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "deleteMyBooking?customerNo=" +
                    reqData.customerNo +
                    "&bookingId=" +
                    reqData.bookingId
            },
                function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        let result = JSON.parse(body)
                        logger.info("API failed for delete booking");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body);
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API successful for delete booking");
                        resolve(formedResponse);
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for delete booking ", err);
            reject(err);
        }
    });
}

async function getBPKBPaymentCycleData(reqData, headersData) {
    return new Promise(function (resolve, reject) {
        try {
            request({
                headers: headersData,
                url: appConstants.issBaseUrl +
                    "checkPaymentCycle?contractNo=" +
                    reqData.contractNo +
                    "&servOfficeCode=" +
                    reqData.servOfficeCode,
            },
                function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        let result = JSON.parse(body)
                        logger.info("API failed for BPKB Payment Cycle");
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        resolve(formedResponse)
                    } else {
                        let result = JSON.parse(body)
                        const formedResponse = mutateResponseToWrapBodyInAnArray(result)
                        logger.info("API succesfull for BPKB Payment Cycle");
                        resolve(formedResponse)
                    }
                }
            );
        } catch (err) {
            logger.info("API failed for BPKB Payment Cycle", err);
            reject(err);
        }
    });
}