'use strict';

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
                data: '='
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

                $scope.user_profile = firebaseHelper.syncObject("profiles_pub/" + $scope.data.uid);
                $scope.gravatar = $rootScope.gravatar;

                $scope.ideas_stat = firebaseHelper.syncObject("ideas_stat/" + $scope.data.$id);
                $scope.ideas_vote = firebaseHelper.syncObject(["ideas_votes", $scope.data.$id, $scope.data.uid]);

                var upvote = function(from_down_vote) {
                    firebaseHelper.transaction(["ideas_stat", $scope.data.$id], function(data) {
                        if (!data) {
                            data = {up_votes: 0, down_votes: 0, comments: 0};
                        }
                        data.up_votes++;
                        if (from_down_vote) {
                            data.down_votes--;
                        }
                        return data;
                    })
                }
                var downvote = function(from_up_vote) {
                    firebaseHelper.transaction(["ideas_stat", $scope.data.$id], function(data) {
                        if (!data) {
                            data = {up_votes: 0, down_votes: 0, comments: 0};
                        }
                        data.down_votes++;
                        if (from_up_vote) {
                            data.up_votes--;
                        }
                        return data;
                    })
                }

                $scope.onUpVote = function(from_down_vote) {
                    firebaseHelper.transaction(["ideas_votes", $scope.data.$id, $scope.data.uid], function(data) {
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
                    firebaseHelper.transaction(["ideas_votes", $scope.data.$id, $scope.data.uid], function(data) {
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
                    // firebaseHelper.transaction("ideas_stat/" + $scope.data.$id, function(data) {
                    //     if (!data) {
                    //         data = {up_votes: 0, down_votes: 0, comments: 0};
                    //     }
                    //     data.comments++;
                    //     return data;
                    // })
                }
            },
            template: '\
                    <a ui-sref="profile" class="pull-left"> \
                        <img alt="image" class="img-circle" ng-src="{{gravatar(user_profile.email)}}"> \
                    </a> \
                    <div class="media-body "> \
                        <small class="pull-right">{{createdDate}}</small> \
                        <strong>{{user_profile.display_name}}</strong><br> \
                        <div class="well">{{data.title}}</div> \
                        <div class="pull-right"> \
                            <a class="btn btn-xs btn-white" ng-click="onUpVote()"><i class="fa fa-thumbs-up"></i> {{ideas_stat.up_votes}}</a> \
                            <a class="btn btn-xs btn-white" ng-click="onDownVote()"><i class="fa fa-thumbs-down"></i> {{ideas_stat.down_votes}}</a> \
                            <a class="btn btn-xs btn-white" ng-click="onComments()"><i class="fa fa-comments-o"></i> {{ideas_stat.comments}}</a> \
                        </div> \
                    </div> \
            '
        }
    })

    .directive('newIdeaFeed', function() {
        return {
            restrict: 'E',
            scope: {
                onFinished: '&'
            },
            controller: function($scope, firebaseHelper, $sce, $rootScope) {
                if (!firebaseHelper.getUID()) {
                    firebaseHelper.logout();
                    return;
                }
                $scope.data = {
                    title: "",
                    uid: firebaseHelper.getUID()
                }
                $scope.user_profile = firebaseHelper.syncObject(["profiles_pub", $scope.data.uid]);
                $scope.gravatar = $rootScope.gravatar;

                $scope.onSave = function() {
                    var ref = firebaseHelper.getFireBaseInstance("ideas");
                    ref.push().set({
                        createdDate: Date.now(),
                        title: $scope.data.title,
                        uid: $scope.data.uid
                    }, function() {
                        $scope.onCancel();
                    })
                }

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
                        <textarea placeholder="Enter your idea here" class="form-control" rows="6" ng-model="data.title"> </textarea> \
                        <p></p> \
                        <div class="pull-right"> \
                            <a ng-disabled="!data.title" class="btn btn-xs btn-white" ng-click="onSave()"><i class="fa fa-save"></i> Save</a> \
                            <a class="btn btn-xs btn-white" ng-click="onCancel()"><i class="fa fa-trash"></i> Cancel</a> \
                        </div> \
                    </div> \
            '
        }
    })


    ;
