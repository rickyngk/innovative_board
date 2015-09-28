angular.module('inspinia', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngResource', 'ui.router', 'ui.bootstrap', 'firebase', 'firebaseHelper', 'cgNotify'])

.config(function ($stateProvider, $urlRouterProvider, firebaseHelperConfigProvider) {
    firebaseHelperConfigProvider.setURL(FIREBASE_URL);

    $stateProvider

    .state('login', {
        url: '/login',
        templateUrl: "app/auth/login.html"
    })
    .state('change_pass', {
        url: '/change_pass',
        templateUrl: "app/auth/change_pass.html"
    })

    .state('index', {
        abstract: true,
        url: "/index",
        templateUrl: "components/common/content.html",
        resolve: {
            currentAuth: function(firebaseHelper) {
                return firebaseHelper.auth.$requireAuth();
            }
        }
    })
    .state('index.main', {
        url: "/main?groupId",
        templateUrl: "app/main/main.html",
        data: { pageTitle: 'Example view' }
    })
    .state('index.minor', {
        url: "/minor",
        templateUrl: "app/minor/minor.html",
        data: { pageTitle: 'Example view' }
    })

    $urlRouterProvider.otherwise('/index/main');
})

.run(function($rootScope, $state, notify, $http) {
    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        console.log("$stateChangeError", error);
        if (error === "AUTH_REQUIRED") {
            $state.go("login");
        }
    });



    $rootScope.inspiniaTemplate = 'components/common/notify.html';
    notify.config({
       duration: '5000',
       position: 'center'
    });
    $rootScope.notifyError = function(message) {
        notify({ message: message, classes: 'alert-danger', templateUrl: $rootScope.inspiniaTemplate});
    }
    $rootScope.notifySuccess= function(message) {
        notify({ message: message, classes: 'alert-success', templateUrl: $rootScope.inspiniaTemplate});
    }

    $rootScope.gravatar = function(email) {
        return "http://www.gravatar.com/avatar/" + md5(email) + "?s=200&r=pg&d=mm";
    }

    $rootScope.sendSlack = function(group_id, message) {
        if (group_id && message) {
            firebaseHelper.getFireBaseInstance(["groups"], group_id).once('value', function(snapshot) {
                var hook = snapshot.val().slack_webhook;
                if (!hook) {
                    console.log("No slack webhook found for group id " + group_id + ". Add slack_webhook value to groups/" + group_id + " in firebase data");
                } else {
                    if (!SLACK_NOTIF_URL) {
                        console.log("Missing config SLACK_NOTIF_URL")
                    } else {
                        $http({
                            url: SLACK_NOTIF_URL,
                            method: "POST",
                            data: { webhook : hook, message: message }
                        })
                        .then(function(response) {
                            console.log(response);
                        },
                        function(response) { // optional
                            console.log(response);
                        });
                    }
                }
            });
        }
    }
})
;
