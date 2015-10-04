# Innovative Board

A project for studying how to use Firebase (100% Firebase-powered app).

Idea is realy simple. User posts his ideas then teamate can vote

This application includes two components:
+ Web app, locates in /web
+ Slack bot, used for intergrating web app with slack.

In current version, user can connect to application via slack only, no register module sopported. 

# How to run web app

1. First you have to register your own Firebase account (https://www.firebase.com), and create an application on firebase.
2. Rename `config.js.template` to `config.js` and update `FIREBASE_URL` value to your firebase application URL e.g https://<your_app_name>.firebaseio.com (web/src/app/config.js)
3. Installed required npm modules and bower packages (powered by gulp) 

        $cd web
        $npm install 
        $bower install 

4. Develop on localhost

        $gulp serve
    
5. Pack and prepare for deploying

        $gulp

6. Deploy to firebase static host (see https://www.firebase.com/docs/hosting/guide/deploying.html)


# Build slack bot

1. Require nodejs
2. Rename keys.js.template to keys.js

    + `firebase_app`: Firebase application name (eg: `ib-slack`)
    + `firebase_key`: Firebase SECRETS key https://<your_firebase_app>.firebaseio.com/?page=Admin
    + `slack`: slack authentication key (https://api.slack.com/web)
    + `innovative_webste`: where you host your website. If your use firebase statis hosting, it will be: http://<your_firebase_app>/firebaseapp.com

3. Run app

        $cd slackbot
        node app.js
        
However, prefer using `pm2` (https://github.com/Unitech/pm2) to manage node app.

3. Hosting your host somewhere e.g Digital Occean or Heroku

# Intergate slack with Application
## Outcome (*require*)
Send info from slack to web-app, included register user 

1. Register outcome webhook intergration at https://navigos.slack.com/services/new 
2. Set up outcome info, point to slackbot url: http://<your_slackbot_domain>:4000/idea

## Income
Send notify to slack

1. Register income webhook intergration at (optional)
2. Set up income info, copy `Webhook URL` from slack
3. Access your firebase appication database, find your group data at group/your_group_id, add field: `slack_webhook` with this url

        <your_app>
            groups
                <your_group>
                    slack_xyz
                        created_date: 1234
                        name: '...'
                        slack_webhook: "https://hooks.slack.com/services/..."
                        
4. Update `SLACK_NOTIF_URL` in web app config (`web/src/app/config.js`) then build and deploy again.

        SLACK_NOTIF_URL = "http://<your_slackbot_domain>:4000/notif";
        



