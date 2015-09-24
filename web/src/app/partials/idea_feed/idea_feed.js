angular.module('inspinia')
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
            $scope.created_user_profile = firebaseHelper.syncObject("profiles_pub/" + $scope.data.createdBy);
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
            var unvote = function(from_up_vote, from_down_vote) {
                firebaseHelper.transaction(["ideas", $scope.group, $scope.data.$id], function(data) {
                    if (!data) {
                        // data = {up_votes: 0, down_votes: 0, comments: 0, score: 0};
                        return;
                    }
                    if (from_up_vote) {
                        data.up_votes = (data.up_votes || 0) - 1;
                    }
                    if (from_down_vote) {
                        data.down_votes = (data.down_votes || 0) - 1;
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
                        data.value = 1;
                    } else if (data.value == -1){
                        upvote(true);
                        data.value = 1;
                    } else {
                        unvote(true, false);
                        data.value = 0;
                    }
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
                        data.value = -1;
                    } else if (data.value == 1){
                        downvote(true);
                        data.value = -1;
                    } else {
                        unvote(false, true);
                        data.value = 0;
                    }
                    return data;
                });
            }
            $scope.onComments = function() {
                $rootScope.notifyError("This feature is not implemented yet")
            }
        },
        templateUrl: "app/partials/idea_feed/idea_feed.html"
    }
})
