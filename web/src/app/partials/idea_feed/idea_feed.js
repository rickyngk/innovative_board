angular.module('inspinia')
.directive('ideaFeed', function() {
    return {
        restrict: 'E',
        scope: {
            data: '=',
            group: '@'
        },
        controller: function($scope, firebaseHelper, $sce, $rootScope) {
            $scope.formatDate = function(input) {
                var date = new Date(input)
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
                return year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + sec;
            }
            $scope.createdDate = $scope.formatDate($scope.data.createdDate)

            $scope.$watch("data.title", function() {
                if ($scope.data.title) {
                    $scope.title = $sce.trustAsHtml($scope.data.title.replace(/(?:\r\n|\r|\n)/g, '<br />'));
                }
            })

            $scope.user_profile = firebaseHelper.syncObject("profiles_pub/" + $scope.data.uid);
            $scope.me = firebaseHelper.syncObject("profiles_pub/" + firebaseHelper.getUID());
            $scope.created_user_profile = firebaseHelper.syncObject("profiles_pub/" + $scope.data.createdBy);
            $scope.gravatar = $rootScope.gravatar;
            $scope.ideas_vote = firebaseHelper.syncObject(["ideas_votes", $scope.group, $scope.data.$id, firebaseHelper.getUID()]);

            $scope.$on("user:login", function(data) {
                $scope.me = firebaseHelper.syncObject("profiles_pub/" + firebaseHelper.getUID());
            });

            var upvote = function(from_down_vote) {
                firebaseHelper.transaction(["ideas", $scope.group, $scope.data.$id], function(data) {
                    if (!data) {
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

            $scope.IncrComment = function() {
                firebaseHelper.transaction(["ideas", $scope.group, $scope.data.$id], function(data) {
                    if (!data) {
                        return;
                    }
                    data.comments = (data.comments || 0) + 1;
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

            $scope.showComments = false;
            $scope.onComments = function() {
                $scope.showComments = !$scope.showComments;

                if ($scope.showComments && !$scope.comments_ref) {
                    $scope.comments_ref = firebaseHelper.getFireBaseInstance(["idea_comments", $scope.group, $scope.data.$id]);
                    $scope.comments = firebaseHelper.syncArray($scope.comments_ref.limitToLast(50));
                }
            }

            $scope.comment = "";
            $scope.onSendComment = function() {
                var comment = $scope.comment;
                console.log(comment)
                if (firebaseHelper.getUID()) {
                    $scope.comments_ref.push().set({
                        createdDate: Date.now(),
                        comment: comment,
                        uid: firebaseHelper.getUID(),
                        email: firebaseHelper.getAuthEmail(),
                        display_name: $scope.me.display_name
                    }, function(ref) {
                        $scope.IncrComment();
                        $scope.comment = "";
                        $scope.$digest();
                    })
                } else {
                    $rootScope.notifyError("Something wrong @@");
                }
            }

            $scope.onSetStatus = function(status) {
                firebaseHelper.transaction(["ideas", $scope.group, $scope.data.$id], function(data) {
                    if (!data) {
                        return;
                    }
                    data.status = status;
                    return data;
                })
            }
        },
        templateUrl: "app/partials/idea_feed/idea_feed.html"
    }
})
