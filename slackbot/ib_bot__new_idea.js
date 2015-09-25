var Firebase = require("firebase");
var keys = require("./keys")();
var request = require('request');
var ref = new Firebase("https://" + keys.firebase_app + ".firebaseio.com");

var create_group = function(share) {
    var res = share.res;
    return res.status(200).json({text: "Begin create group" + JSON.stringify(share)});
}

var get_user_profile_by_email = function(share) {
    var res = share.res;
    ref.child("profiles_pub").orderByChild("email").startAt(user_email).endAt(user_email).once('value', function(snap) {
        share.uid = snap.key();
        create_group(share);
    }, function() {
        return res.status(200).json({text: "Error getting user public profile"});
    })
}

var create_user_profile = function(share) {
    var res = share.res;
    ref.child("profiles").child(share.uid).set({
        role: "user"
    }, function(error) {
        if (error) {
            return res.status(200).json({text: "Error creating user role"});
        } else {
            ref.child("profiles_pub").child(share.uid).set({
                email: share.user_email,
                display_name: share.user_display_bame,
                avatar: share.user_avatar,
                slack_id: share.slack_id
            }, function(error2) {
                if (error2) {
                    return res.status(200).json({text: "Error creating user public profile"});
                } else {
                    create_group(share);
                }
            })
        }
    })
}

var create_user = function(share) {
    var res = share.res;
    ref.createUser({
        email: share.user_email,
        password: Math.round((Math.pow(36, 16 + 1) - Math.random() * Math.pow(36, 16))).toString(36).slice(1) + ""
    }, function(error, userData) {
            if (error) {
                switch (error.code) {
                    case "EMAIL_TAKEN":
                        get_user_profile_by_email(share);
                        break;
                    case "INVALID_EMAIL":
                        return res.status(200).json({text: "Can not create user count. Invalid email"});
                    default:
                        return res.status(200).json({text: "Error creating user"});
                }
            } else {
                share.uid = userData.uid
                create_user_profile(share);
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
    var share = {
        channel_id: req.body.channel_id,
        channel_name: req.body.channel_name,
        user_name: req.body.user_name,
        slack_id: req.body.user_id,
        text: req.body.text,
        trigger_word: req.body.trigger_word,
        res: res
    }

    console.log("Request received:", JSON.stringify(req.body));

    if (share.user_name === 'slackbot') {
        return res.status(200).end();
    }

    ref.authWithCustomToken(keys.firebase_key, function(error, authData) {
        if (error) {
            return res.status(200).json({text: "Authentication error"});
        } else {
            //check if user existed
            request({
                uri: "https://slack.com/api/users.info?token=" + keys.slack + "&user=" + share.slack_id,
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
                share.user_email = obj.user.profile.email;
                share.user_display_name = obj.user.name || obj.user.real_name;
                share.user_avatar =   obj.user.profile.image_72
                                ||  obj.user.profile.image_48
                                ||  obj.user.profile.image_192
                                ||  obj.user.profile.image_32
                                ||  obj.user.profile.image_24

                create_user(share);
            });
        }
    });
}
