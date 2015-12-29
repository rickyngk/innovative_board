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
var common_reply = require("./ib_bot__common_reply")();

function normallizeText(s) {
    s = s.replace(/(^\s*)|(\s*$)/gi,"");
    s = s.replace(/[ ]{2,}/gi," ");
    s = s.replace(/\n /,"\n");
    return s;
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function getRandomReplyMessage(share, s) {
    var str ="";
    var list = common_reply.response[s];
    if (list && list.length > 0) {
        var r = Math.floor(Math.random() * (list.length));
        str = common_reply.response[s][r] || "";
    }
    return replaceAll(str, "{{user}}", "@" + share.user_name)
}

var process_message = function(share) {
    console.log("process_message");
    var res = share.res;

    var text = share.text.replace(share.trigger_word, "");
    var i = 0;
    for (i = 0; i < text.length; i++) {
        if ( (text[i] >= "a" && text[i] <= "z") || (text[i] >= "A" && text[i] <= "Z")) {
            break;
        }
    }
    share.text = normallizeText(text.substring(i, text.length));
    if (share.text.length > 1) {
        share.text = share.text.charAt(0).toUpperCase() + share.text.slice(1);
    }
    var text_partials = share.text.split(' ');

    //count number of words
    var number_of_words = text_partials.length;

    //tooo short, should not be an idea
    if (number_of_words < 7) {
        //manage some actions here
        var cmd = text_partials[0].toLowerCase().trim();
        if (cmd == "report") {
            var cmd_2 = (text_partials[1] || "").toLowerCase().trim();

            if (!cmd_2) { //general report
                var build_report = function(key, stat) {
                    var total_finished = Math.max(stat.done_ideas + stat.fail_ideas, 1);
                    var done_percent = Math.floor(stat.done_ideas*1000/total_finished)/10;
                    var fail_percent = Math.floor(stat.fail_ideas*1000/total_finished)/10;

                    return res.status(200).json({text: 
                        ">>>*Report " + key + "*" +
                        "\nOpen: " + stat.new_ideas + 
                        "\nProcessing: " + stat.processing_ideas + 
                        "\nDone: " + stat.done_ideas + " (" + done_percent + "%)" + 
                        "\nFail: " + stat.fail_ideas + " (" + fail_percent + "%)" + 
                        "\n---------\nTotal: " + stat.total});
                }
                var now = new Date();
                var date = now.getDate();
                var month = now.getMonth();
                var key = now.getFullYear() + "-" + (month < 10?("0" + month):month) + "-" +  (date < 10?("0" + date):date);
                ref.child("ideas_stat").child(share.group_id).child(key).once("value", function(snapshot) {
                    if (snapshot && snapshot.val()) {
                        build_report(key, snapshot.val());
                    } else {
                        var group_ideas = ref.child("ideas").child(share.group_id);
                        var stat = {
                            timestamp: (new Date()).getTime()
                        }
                        group_ideas.orderByChild("status").equalTo(0).once("value", function(new_ideas) {
                            stat.new_ideas = new_ideas.numChildren();
                            group_ideas.orderByChild("status").equalTo(1).once("value", function(processing_ideas) {
                                stat.processing_ideas = processing_ideas.numChildren();
                                group_ideas.orderByChild("status").equalTo(2).once("value", function(done_ideas) {
                                    stat.done_ideas = done_ideas.numChildren();
                                    group_ideas.orderByChild("status").equalTo(3).once("value", function(fail_ideas) {
                                        stat.fail_ideas = fail_ideas.numChildren();
                                        stat.total = stat.new_ideas + stat.processing_ideas + stat.done_ideas + stat.fail_ideas
                                        ref.child("ideas_stat").child(share.group_id).child(key).set(stat);
                                        build_report(key, stat);
                                    });
                                });
                            });
                        });
                    }
                });      
            } else if (cmd_2.indexOf("win") == 0) {
                var group_ideas = ref.child("ideas").child(share.group_id);
                var dones = {};
                var most_done = "-0";
                var max_done = 0;
                var failes = {};
                var most_fail = "-0";
                var max_fail = 0;

                group_ideas.orderByChild("status").equalTo(2).once("value", function(done_ideas) {
                    done_ideas.forEach(function(childSnapshot) {
                        var childData = childSnapshot.val();
                        dones[childData.createdBy] = (dones[childData.createdBy] || 0) + 1;
                        if (dones[childData.createdBy] > max_done) {
                            max_done = dones[childData.createdBy];
                            most_done = childData.createdBy;
                        }
                    });
                    group_ideas.orderByChild("status").equalTo(3).once("value", function(fail_ideas) {
                        fail_ideas.forEach(function(childSnapshot) {
                            var childData = childSnapshot.val();
                            failes[childData.createdBy] = (failes[childData.createdBy] || 0) + 1;
                            if (failes[childData.createdBy] > max_fail) {
                                max_fail = failes[childData.createdBy];
                                most_fail = childData.createdBy;
                            }
                        });
                        ref.child("profiles_pub").child(most_done).child("display_name").once("value", function(data) {
                            most_done = data.val();
                            most_done = most_done?"@" + most_done:"none";
                            ref.child("profiles_pub").child(most_fail).child("display_name").once("value", function(data2) {
                                most_fail = data2.val();
                                most_fail = most_fail?"@" + most_fail:"none";
                                return res.status(200).json({text: 
                                    ">>>*Who are winners?*" +
                                    "\nMost done: " + most_done + " (" + max_done + ")" +
                                    "\nMost fail: " + most_fail + " (" + max_fail + ")"
                                });
                            })
                        });
                    });
                });
            }
        } else {
            if (number_of_words == 0) {
                return res.status(200).json({text: getRandomReplyMessage(share, "say_hello")});
            } else {
                var words = [text_partials[0].toLowerCase().trim()];
                for (var i = 1; i < Math.min(7, number_of_words); i++) {
                    words.push( (words[i-1] + " " + (text_partials[i] || '')).toLowerCase().trim() );
                }
                for (var i = 0; i < words.length; i++) {
                    var response = common_reply.input[words[i]];
                    console.log(response, words[i]);
                    if (response) {
                        return res.status(200).json({text: getRandomReplyMessage(share, response)});
                    }
                }
                return res.status(200).json({text: getRandomReplyMessage(share, "nothing_to_say")});
            }
        }
    } else {
        var push_ref = ref.child("ideas").child(share.group_id).push();
        push_ref.setWithPriority({
            comments: 0,
            up_votes: 0,
            down_votes: 0,
            score: 0,
            createdBy: share.uid,
            title: share.text,
            uid:  share.uid,
            createdDate: Date.now(),
            status: 0
        }, -Date.now(), function(error) {
            if (error) {
                return res.status(200).json({text: "Something wrong. Can not post your idea."});
            } else {
                return res.status(200).json({text: "Great. Your idea has been posted with id = `" + push_ref.key() +
                    "`\n Check out all ideas at <" + keys.innovative_webste + "/#/index/main?groupId=" + share.group_id + "|here>"});
            }
        })
    }
}

var create_group = function(share) {
    var res = share.res;
    share.group_id = "slack_" + share.channel_id;

    console.log("begin create group if not existed", share.group_id);
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

var add_group_to_user = function(share) {
    ref.child("user_group").child(share.uid).child(share.group_id).set(true, function(error) {
        if (error) {
            return res.status(200).json({text: "Add user group failed abnormally!"});
        } else {
            var obj = {}
            obj[share.uid] = true;
            ref.child("group_user").child(share.group_id).child(share.uid).set(true, function(error) {
                if (error) {
                    return res.status(200).json({text: "Add user group failed abnormally!"});
                } else {
                    process_message(share);
                }
            })
        }
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
