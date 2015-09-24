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
                }, -Date.now(), function(ref) {
                    $scope.onCancel();
                })
            };

            $scope.allowAssign = false;
            $scope.assigned_user = null;
            $scope.users = [];

            var doSync = function() {
                // console.log("xxxxxx");
                if (firebaseHelper.getUID()) {
                    $scope.data.uid = firebaseHelper.getUID();
                    $scope.user_profile = firebaseHelper.syncObject(["profiles_pub", $scope.data.uid]);
                    $scope.allowAssign = firebaseHelper.getRole() === "admin" || firebaseHelper.getRole() === "mod";
                    if ($scope.allowAssign) {
                        $scope.users = [];
                        firebaseHelper.getFireBaseInstance("profiles_pub").once("value", function(snapshot) {
                            snapshot.forEach(function(childSnapshot) {
                                $scope.users.push({
                                    display_name: childSnapshot.val().display_name,
                                    uid: childSnapshot.key()
                                });
                            });
                            $scope.assigned_user = "";
                            $scope.$apply();
                        })
                    }
                    $timeout(function() {
                        $scope.$apply();
                    }, 100)
                }
            }

            $scope.$on("user:login", function(data) {
                // console.log("yyyyyyy");
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
