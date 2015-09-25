var request = require('request');
module.exports = function (req, res, next) {
    var payload = {
        text: "hello",
        username: 'ib'
        // channel: req.body.channel_id
    }

    send(payload, function (error, status, body) {
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

function send(payload, callback) {
    var uri = "https://hooks.slack.com/services/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";
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
