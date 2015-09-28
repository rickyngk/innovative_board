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

.run(function($rootScope, $state, notify, $http, firebaseHelper) {
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
        return "https://www.gravatar.com/avatar/" + md5(email) + "?s=200&r=pg&d=mm";
    }

    $rootScope.sendSlack = function(group_id, message) {
        if (group_id && message) {
            firebaseHelper.getFireBaseInstance(["groups", group_id, "slack_webhook"]).once('value', function(snapshot) {
                var hook = snapshot.val();
                if (hook) {
                    if (!SLACK_NOTIF_URL) {
                        console.log("Missing config SLACK_NOTIF_URL")
                    } else {
                        $http.post(SLACK_NOTIF_URL, { webhook : hook, message: message });
                    }
                }
            });
        }
    }
})
;
