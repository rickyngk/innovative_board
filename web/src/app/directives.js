//Directive used to set metisMenu and minimalize button
angular.module('inspinia')
    .directive('sideNavigation', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                // Call metsi to build when user signup
                scope.$watch('authentication.user', function() {
                    $timeout(function() {
                        element.metisMenu();
                    });
                });

            }
        };
    })
    .directive('minimalizaSidebar', function ($timeout) {
        return {
            restrict: 'A',
            template: '<a class="navbar-minimalize minimalize-styl-2 btn btn-primary " href="" ng-click="minimalize()"><i class="fa fa-bars"></i></a>',
            controller: function ($scope, $element) {
                $scope.minimalize = function () {
                    angular.element('body').toggleClass('mini-navbar');
                    if (!angular.element('body').hasClass('mini-navbar') || angular.element('body').hasClass('body-small')) {
                        // Hide menu in order to smoothly turn on when maximize menu
                        angular.element('#side-menu').hide();
                        // For smoothly turn on menu
                        $timeout(function () {
                            angular.element('#side-menu').fadeIn(500);
                        }, 100);
                    } else {
                        // Remove all inline style from jquery fadeIn function to reset menu state
                        angular.element('#side-menu').removeAttr('style');
                    }
                };
            }
        };
    })
    .directive('ideaFeed', function() {
        return {
            restrict: 'E',
            scope: {
                data: '=',
                group: '@'
            },
            controller: function($scope, firebaseHelper, $sce, $rootScope) {
                var date = new Date($scope.data.createdDate)
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var hour = date.getHours();
                var minute = date.getMinutes();
                var sec = date.getSeconds();
                if (month < 10) {month = "0" + month};
                if (day < 10) {day = "0" + day};
                if (hour < 10) {hour = "0" + hour};
                if (minute < 10) {minute = "0" + minute};
                if (sec < 10) {sec = "0" + sec};
                $scope.createdDate = year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + sec;

                $scope.$watch("data.title", function() {
                    if ($scope.data.title) {
                        $scope.title = $sce.trustAsHtml($scope.data.title.replace(/(?:\r\n|\r|\n)/g, '<br />'));
                    }
                })
                // $scope.title = $sce.trustAsHtml($scope.data.title.replace(/(?:\r\n|\r|\n)/g, '<br />'));

                $scope.user_profile = firebaseHelper.syncObject("profiles_pub/" + $scope.data.uid);
                $scope.gravatar = $rootScope.gravatar;

                // $scope.ideas_stat = firebaseHelper.syncObject(["ideas", $scope.group, $scope.data.$id, "stat"]);
                $scope.ideas_vote = firebaseHelper.syncObject(["ideas_votes", $scope.group, $scope.data.$id, firebaseHelper.getUID()]);

                var upvote = function(from_down_vote) {
                    firebaseHelper.transaction(["ideas", $scope.group, $scope.data.$id], function(data) {
                        if (!data) {
                            //data = {up_votes: 0, down_votes: 0, comments: 0, score: 0};
                            return;
                        }
                        data.up_votes = (data.up_votes || 0) + 1;
                        if (from_down_vote) {
                            data.down_votes = (data.down_votes || 0) - 1;
                        }
                        data.score = (data.up_votes || 0) - (data.down_votes || 0);
                        return data;
                    })
                }
                var downvote = function(from_up_vote) {
                    firebaseHelper.transaction(["ideas", $scope.group, $scope.data.$id], function(data) {
                        if (!data) {
                            // data = {up_votes: 0, down_votes: 0, comments: 0, score: 0};
                            return;
                        }
                        data.down_votes = (data.down_votes || 0) + 1;
                        if (from_up_vote) {
                            data.up_votes = (data.up_votes || 0) - 1;
                        }
                        data.score = (data.up_votes || 0) - (data.down_votes || 0);
                        return data;
                    })
                }

                $scope.onUpVote = function(from_down_vote) {
                    if (!firebaseHelper.getUID()) {
                        $rootScope.notifyError("Something wrong @@");
                        return;
                    }
                    firebaseHelper.transaction(["ideas_votes", $scope.group, $scope.data.$id, firebaseHelper.getUID()], function(data) {
                        if (!data) { //not vote yet
                            data = {value: 0};
                        }
                        if (data.value == 0) {
                            upvote(false);
                        } else if (data.value == -1){
                            upvote(true);
                        }
                        data.value = 1;
                        return data;
                    });
                }
                $scope.onDownVote = function() {
                    if (!firebaseHelper.getUID()) {
                        $rootScope.notifyError("Something wrong @@");
                        return;
                    }
                    firebaseHelper.transaction(["ideas_votes", $scope.group, $scope.data.$id, firebaseHelper.getUID()], function(data) {
                        if (!data) {
                            data = {value: 0};
                        }
                        if (data.value == 0) {
                            downvote(false);
                        } else if (data.value == 1){
                            downvote(true);
                        }
                        data.value = -1;
                        return data;
                    });
                }
                $scope.onComments = function() {
                    $rootScope.notifyError("This feature is not implemented yet")
                }
            },
            template: '\
                    <a ui-sref="profile" class="pull-left"> \
                        <img alt="image" class="img-circle" ng-src="{{gravatar(user_profile.email)}}"> \
                    </a> \
                    <div class="media-body "> \
                        <small class="pull-right label label-info">{{data.score || 0}} pts</small> \
                        <strong>{{user_profile.display_name}}</strong><br> \
                        <small class="text-muted">{{createdDate}}</small> \
                        <div class="well" ng-bind-html="title"></div> \
                        <div class="pull-right"> \
                            <a class="btn btn-xs btn-white" ng-click="onUpVote()"><i class="fa fa-thumbs-up"></i> {{data.up_votes || 0}}</a> \
                            <a class="btn btn-xs btn-white" ng-click="onDownVote()"><i class="fa fa-thumbs-down"></i> {{data.down_votes || 0}}</a> \
                            <a class="btn btn-xs btn-white" ng-click="onComments()"><i class="fa fa-comments-o"></i> {{data.comments || 0}}</a> \
                        </div> \
                    </div> \
            '
        }
    })

    .directive('newIdeaFeed', function() {
        return {
            restrict: 'E',
            scope: {
                onFinished: '&',
                group: '@'
            },
            controller: function($scope, firebaseHelper, $sce, $rootScope) {
                $scope.data = {
                    title: ""
                }
                $scope.gravatar = $rootScope.gravatar;

                $scope.onSave = function() {
                    if (!firebaseHelper.getUID()) {
                        $rootScope.notifyError("Something wrong @@");
                        $scope.onCancel();
                        return;
                    }
                    var ref = firebaseHelper.getFireBaseInstance(["ideas", $scope.group]);
                    ref.push().setWithPriority({
                        createdDate: Date.now(),
                        title: $scope.data.title,
                        uid: firebaseHelper.getUID(),
                    }, -Date.now(), function(ref) {
                        $scope.onCancel();
                    })
                };

                $scope.$on("user:login", function(data) {
                    $scope.data.uid = firebaseHelper.getUID();
                    $scope.user_profile = firebaseHelper.syncObject(["profiles_pub", $scope.data.uid]);
                });

                $scope.onCancel = function() {
                    $scope.data.title = "";
                    if ($scope.onFinished) {
                        $scope.onFinished();
                    }
                }
            },
            template: '\
                    <a ui-sref="profile" class="pull-left"> \
                        <img alt="image" class="img-circle" ng-src="{{gravatar(user_profile.email)}}"> \
                    </a> \
                    <div class="media-body "> \
                        <small class="pull-right">{{createdDate}}</small> \
                        <p><strong>{{user_profile.display_name}}</strong></p> \
                        <textarea maxlength="140" placeholder="Enter your idea here" class="form-control" rows="6" ng-model="data.title"> </textarea> \
                        <p></p> \
                        <div class="pull-right"> \
                            <strong>{{140 - data.title.length}} chars left </strong> \
                            <a ng-disabled="!data.title" class="btn btn-xs btn-white" ng-click="onSave()"><i class="fa fa-save"></i> Save</a> \
                            <a class="btn btn-xs btn-white" ng-click="onCancel()"><i class="fa fa-trash"></i> Cancel</a> \
                        </div> \
                    </div> \
            '
        }
    })


    ;
