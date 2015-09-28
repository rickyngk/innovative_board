var request = require('request');
module.exports = function (req, res, next) {
    var payload = {
        text: req.body.message || '',
        username: 'Innovative Accounting Bot'
    }

    send(req.body.webhook || '', payload, function (error, status, body) {
        if (error) {
            return next(error);

        } else if (status !== 200) {
            // inform user that our Incoming WebHook failed
            return next(new Error('Incoming WebHook: ' + status + ' ' + body));

        } else {
            return res.status(200).end();
        }
     });
}

function send(uri, payload, callback) {
    request({
        uri: uri,
        method: 'POST',
        body: JSON.stringify(payload)
    }, function (error, response, body) {
        if (error) {
            return callback(error);
        }
        callback(null, response.statusCode, body);
    });
}
