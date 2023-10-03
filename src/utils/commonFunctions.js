
var util = require('../controllers/util');
const logger = require('../config/logging');

exports.getCRMAccessToken = function () {
    // scheduleNewsOrPromoJob('0 0 0 * * *', util.changeStatusOfExpiredNewsAndPromo())

    //runs after every 10 mins.
    scheduleNewsOrPromoJob('0 */10 * * * *', util.changeStatusOfExpiredNewsAndPromo);
}

exports.getPointDescriptionContent = function (points) {
    return "Yay! " + points + " poin untuk anda";
}

exports.mutateResponseToWrapBodyInAnArray = (response) => {
    if (Array.isArray(response.data)) {
        return response
    } else {
        response.data = [response.data]
        return response
    }
}


