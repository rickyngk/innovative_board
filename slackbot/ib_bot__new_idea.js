var Firebase = require("firebase");
var keys = require("./keys")();
var request = require('request');
var ref = new Firebase("https://" + keys.firebase_app + ".firebaseio.com");

var create_group = function(res) {

}

var create_user_profile = function(res, uid, user_email, user_display_bame, user_avatar, slack_id) {
    ref.child("profiles").child(uid).set({
        role: "user"
    }, function(error) {
        if (error) {
            return res.status(200).json({text: "Error creating user role"});
        } else {
            ref.child("profiles_pub").child(uid).set({
                email: user_email,
                display_name: user_display_bame,
                avatar: user_avatar,
                slack_id: slack_id
            }, function(error2) {
                if (error2) {
                    return res.status(200).json({text: "Error creating user public profile"});
                } else {
                    return res.status(200).json({text: "Successfully created user account with uid:" + uid});
                }
            })
        }
    })
}

var create_user = function(res, user_email, user_display_bame, user_avatar, slack_id) {
    ref.createUser({
        email: user_email,
        password: Math.round((Math.pow(36, 16 + 1) - Math.random() * Math.pow(36, 16))).toString(36).slice(1) + ""
    }, function(error, userData) {
            if (error) {
                switch (error.code) {
                    case "EMAIL_TAKEN":
                        return res.status(200).json({text: "email taken " + JSON.stringify(error)});
                        break;
                    case "INVALID_EMAIL":
                        return res.status(200).json({text: "Can not create user count. Invalid email"});
                    default:
                        return res.status(200).json({text: "Error creating user"});
                }
            } else {
                create_user_profile(res, userData.uid, user_email, user_display_bame, user_avatar, slack_id);
            }
        }
    );
}

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


    var do_creat_

    if (user_name === 'slackbot') {
        return res.status(200).end();
    }

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
                    obj = JSON.parse(body);
                } catch (E) {
                    return res.status(200).json({text: "Invalid callback data from slack"});
                }
                if (!obj.ok || !obj.user) {
                    return res.status(200).json({text: "Slack rejected request." + body});
                }
                var user_email = obj.user.profile.email;
                var user_display_name = obj.user.name || obj.user.real_name;
                var user_avatar =   obj.user.profile.image_72
                                ||  obj.user.profile.image_48
                                ||  obj.user.profile.image_192
                                ||  obj.user.profile.image_32
                                ||  obj.user.profile.image_24

                create_user(res, user_email, user_display_name, user_avatar, user_id);
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
