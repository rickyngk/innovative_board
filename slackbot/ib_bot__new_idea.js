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

var Firebase = require("firebase");
var keys = require("./keys")();
var request = require('request');
var ref = new Firebase("https://" + keys.firebase_app + ".firebaseio.com");
var crypto = require('crypto');

var process_message = function(share) {
    console.log("process_message");
    var res = share.res;

    var text = share.text;
    var i = 0;
    for (i = 0; i < text.length; i++) {
        if ( (text[i] >= "a" && text[i] <= "z") || (text[i] >= "A" && text[i] <= "Z")) {
            break;
        }
    }
    share.text = text.substring(i, text.length);
    return res.status(200).json({text: share.text});
}

var create_group = function(share) {
    console.log("create_group");

    var res = share.res;
    share.group_id = "slack_" + share.channel_id;
    ref.child("groups").child(share.group_id).transaction(function(currentData) {
        if (currentData === null) {
            return {
                name: "slack::" + share.channel_name,
                createdDate: Date.now()
            };
        } else {
            return; // Abort the transaction.
        }
    }, function(error, committed, snapshot) {
        if (error) {
            return res.status(200).json({text: "Group transaction failed abnormally!"});
        } else {
            create_user(share);
        }
    });
}

var get_user_profile_by_email = function(share) {
    console.log("get_user_profile_by_email");

    var res = share.res;

    var md5sum = crypto.createHash('md5');
    md5sum.update(share.user_email);
    var d = md5sum.digest('hex');

    ref.child("email_mapping").child(d).once('value', function(snap) {
        share.uid = snap.val();
        console.log("get_user_profile_by_email", "uid", share.uid);
        if (!share.uid) {
            return res.status(200).json({text: "Error getting user public profile"});
        }
        create_user_profile(share);
    }, function() {
        return res.status(200).json({text: "Error getting user public profile"});
    })
}

var create_user_profile = function(share) {
    console.log("create_user_profile");

    var res = share.res;
    ref.child("profiles").child(share.uid).transaction(function(currentData) {
        if (currentData === null) {
            return {
                role: "user"
            };
        } else {
            return; // Abort the transaction.
        }
    }, function(error, committed, snapshot) {
        if (error) {
            return res.status(200).json({text: "Create profile transaction failed abnormally!"});
        } else {
            create_user_email_mapping(share);
        }
    });
}

var create_user_email_mapping = function(share) {
    console.log("create_user_email_mapping");

    var res = share.res;

    var md5sum = crypto.createHash('md5');
    md5sum.update(share.user_email);
    var d = md5sum.digest('hex');

    ref.child("email_mapping").child(d).transaction(function(currentData) {
        return share.uid
    }, function(error, committed, snapshot) {
        if (error) {
            return res.status(200).json({text: "Create profile transaction failed abnormally!"});
        } else {
            create_user_public_profile(share);
        }
    });
}

var add_group_to_user = function() {
    var obj = {}
    obj[share.group_id] = true;
    ref.child("user_group").child(share.uid).push().set(obj, function() {
        process_message(share);
    }, function() {
        return res.status(200).json({text: "Add user group failed abnormally!"});
    })
}

var create_user_public_profile = function(share) {
    console.log("create_user_public_profile");

    var res = share.res;
    ref.child("profiles_pub").child(share.uid).transaction(function(currentData) {
        if (currentData === null) {
            return {
                email: share.user_email,
                display_name: share.user_display_name,
                avatar: share.user_avatar,
                slack_id: share.slack_id,
                createdDate: Date.now()
            };
        } else {
            return {
                email: share.user_email,
                display_name: share.user_display_name,
                avatar: share.user_avatar,
                slack_id: share.slack_id,
                createdDate: currentData.createdDate
            }
        }
    }, function(error, committed, snapshot) {
        if (error) {
            return res.status(200).json({text: "Create public profile transaction failed abnormally!"});
        } else {
            add_group_to_user(share);
        }
    });
}

var create_user = function(share) {
    console.log("create_user");

    var res = share.res;
    ref.createUser({
        email: share.user_email,
        password: Math.round((Math.pow(36, 16 + 1) - Math.random() * Math.pow(36, 16))).toString(36).slice(1) + ""
    }, function(error, userData) {
            if (error) {
                switch (error.code) {
                    case "EMAIL_TAKEN":
                        console.log("user existed");
                        get_user_profile_by_email(share);
                        break;
                    case "INVALID_EMAIL":
                        return res.status(200).json({text: "Can not create user count. Invalid email"});
                    default:
                        return res.status(200).json({text: "Error creating user"});
                }
            } else {
                share.uid = userData.uid
                console.log("create user successful", userData.uid);
                create_user_profile(share);
            }
        }
    );
}

module.exports = function (req, res, next) {
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

                create_group(share);
            });
        }
    });
}
