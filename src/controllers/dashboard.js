var express = require('express');
var router = express.Router();
var auth=require('../config/authorization');
var request=require("request");
var util=require('./util');
const logger = require('../config/logging');

router.post('/getFlurryData', auth.isBasicAuthenticated,(req, res) => {
  let url = req.body.url;
  let body = req.body.payload;
  let headers = req.body.headers;

  console.log(url);
  console.log(body);
  console.log(headers);
    request.post({
            url: url,
            json: body,
            headers : headers
        },
        function(err, httpResponse, body) {
            //
            if (!err) {
                res.json(util.success(body))
            } else {
                res.json(util.failed(err))
            }
        });
});

module.exports = router;