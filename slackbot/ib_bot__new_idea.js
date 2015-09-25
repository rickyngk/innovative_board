var Firebase = require("firebase");
var keys = require("./keys")();
var request = require('request');

module.exports = function (req, res, next) {
    /*
    token=5PPpA4hTr28sXblgZFNJ03Xp
    team_id=T0001
    team_domain=example
    channel_id=C2147483705
    channel_name=test
    timestamp=1355517523.000005
    user_id=U2147483697
    user_name=Steve
    text=googlebot: What is the air-speed velocity of an unladen swallow?
    trigger_word=googlebot:
    */

    var channel_id          = req.body.channel_id;
    var channel_name        = req.body.channel_name;
    var user_name           = req.body.user_name;
    var user_id             = req.body.user_id;
    var text                = req.body.text;
    var trigger_text        = req.body.trigger_word;
    var message             = text.replace(trigger_text, "").trim();

    console.log("Request received:", JSON.stringify(req.body));

    if (user_name === 'slackbot') {
        return res.status(200).end();
    }

    var ref = new Firebase("https://" + keys.firebase_app + ".firebaseio.com");
    ref.authWithCustomToken(keys.firebase_key, function(error, authData) {
        if (error) {
            return res.status(200).json({text: "Authentication error"});
        } else {
            //check if user existed
            request({
                uri: "https://slack.com/api/users.info?token=" + keys.slack + "&user=" + user_id,
                method: 'GET',
            }, function (error, response, body) {
                if (error) {
                    return res.status(200).json({text: "Fail to get user data from slack"});
                }
                var obj = null;
                try {
                    obj = JSON.stringify(body)
                } catch (E) {
                    return res.status(200).json({text: "Invalid callback data from slack"});
                }
                if (!obj.ok || !obj.user) {
                    return res.status(200).json({text: "Slack rejected request"});
                }
                var user_email = obj.user.profile.email;
                var user_display_bame = obj.user.name || obj.user.real_name;
                return res.status(200).json({text: "Slack rejected request"});
            });


            // ref.child("groups").child("slack_" + channel_id).transaction(function(currentData){
            //     if (currentData === null) {
            //         return {
            //             createdDate: Date.now(),
            //             type: "slack",
            //             name: channel_name
            //         }
            //     }
            // })
        }
    });
}
