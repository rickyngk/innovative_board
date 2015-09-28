angular.module('inspinia')
.directive('newIdeaFeed', function($timeout) {
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
                var uid = firebaseHelper.getUID();
                if ($scope.allowAssign && $scope.assigned_user) {
                    uid = $scope.assigned_user;
                }
                ref.push().setWithPriority({
                    createdDate: Date.now(),
                    title: $scope.data.title,
                    uid: uid,
                    createdBy: firebaseHelper.getUID(),
                    status: 0
                }, -Date.now(), function(ref) {
                    firebaseHelper.getFireBaseInstance(["profiles_pub", firebaseHelper.getUID(), "display_name"]).once('value', function(snapshot){
                        $rootScope.sendSlack($scope.group, "@" + snapshot.val() + " has just added idea:\n>>>" + $scope.data.title);
                    }, function() {
                        $rootScope.sendSlack($scope.group, "A user has just added idea:\n>>>" + $scope.data.title);
                    });

                    $scope.onCancel();
                })
            };

            $scope.allowAssign = false;
            $scope.assigned_user = null;
            var doSync = function() {
                if (firebaseHelper.getUID()) {
                    $scope.data.uid = firebaseHelper.getUID();
                    $scope.user_profile = firebaseHelper.syncObject(["profiles_pub", $scope.data.uid]);
                    $scope.allowAssign = firebaseHelper.getRole() === "admin" || firebaseHelper.getRole() === "mod";
                    $timeout(function() {
                        $scope.$apply();
                    }, 100)
                }
            }

            $scope.$on("group:users", function() {
                $scope.users = $rootScope.groupUsers;
            })

            $scope.$on("user:login", function(data) {
                doSync();
            });
            doSync();

            $scope.onCancel = function() {
                $scope.data.title = "";
                if ($scope.onFinished) {
                    $scope.onFinished();
                }
            }
        },
        templateUrl: "app/partials/new_idea_feed/new_idea_feed.html"
    }
})
