angular.module('inspinia')
  .controller('MainCtrl', function ($scope, firebaseHelper, $rootScope) {
        $scope.ideas = null;
        $scope.isLoadingPlainingIdea = true;
        $scope.isLoadingProcessingIdea = true;
        $scope.isLoadingDoneIdea = true;
        $scope.isLoadingFailIdea = true;
        $scope.orderBy = "-createdDate";
        // $scope.groupID = "slack_C0B977PLZ";

        $rootScope.currentGroup = "";
        $rootScope.groupsName = {};
        $rootScope.userGroups = [];

        $scope.$on("user:login", function() {
            var last_view_group = localStorage.getItem("lastOpenedGroup");
            var open_last = false;

            firebaseHelper.bindObject("profiles/" + firebaseHelper.getUID(), $scope, "data");
            firebaseHelper.getFireBaseInstance(["user_group", firebaseHelper.getUID()]).once("value", function(snapshot) {
                $rootScope.groupsName = {};
                $rootScope.userGroups = [];
                var groups = snapshot.val();
                for (k in groups) {
                    if (groups[k]) {
                        firebaseHelper.getFireBaseInstance(["groups", k]).once("value", function(snapshot) {
                            $rootScope.groupsName[snapshot.key()] = snapshot.val().name
                        })
                        if (last_view_group == k) {
                            open_last = true;
                        }
                        $rootScope.userGroups.push(k);
                    }
                }
                if (open_last) {
                    $rootScope.currentGroup = last_view_group
                } else {
                    $rootScope.currentGroup = $rootScope.userGroups[0];
                }
            });
        });

        $scope.$watch("currentGroup", function(){
            if ($rootScope.currentGroup) {
                var ref = firebaseHelper.getFireBaseInstance(["group_user", $rootScope.currentGroup]);
                ref.once("value", function(snapshot) {
                    var users = snapshot.val();
                    $rootScope.groupUsers = [];
                    for (k in users) {
                        // console.log(k, users[k]);
                        if (users[k]) {
                            firebaseHelper.getFireBaseInstance(["profiles_pub", k]).once("value", function(snapshot2) {
                                var val = snapshot2.val();
                                $rootScope.groupUsers.push({
                                    display_name: val.display_name,
                                    uid: snapshot2.key()
                                });
                            })
                        }
                    }
                    $rootScope.$apply();
                    $rootScope.$broadcast('group:users',{});
                })

                $scope.ideas_ref = firebaseHelper.getFireBaseInstance(["ideas", $scope.currentGroup]).orderByChild("status").equalTo(0);
                $scope.ideas = firebaseHelper.syncArray($scope.ideas_ref);
                $scope.ideas.$loaded(function(){
                    $scope.isLoadingPlainingIdea = false;
                })

                $scope.precessing_ideas = firebaseHelper.syncArray(firebaseHelper.getFireBaseInstance(["ideas", $scope.currentGroup]).orderByChild("status").equalTo(1));
                $scope.precessing_ideas.$loaded(function(){
                    $scope.isLoadingProcessingIdea = false;
                })

                $scope.done_ideas = firebaseHelper.syncArray(firebaseHelper.getFireBaseInstance(["ideas", $scope.currentGroup]).orderByChild("status").equalTo(2));
                $scope.done_ideas.$loaded(function(){
                    $scope.isLoadingDoneIdea = false;
                })

                $scope.fail_ideas = firebaseHelper.syncArray(firebaseHelper.getFireBaseInstance(["ideas", $scope.currentGroup]).orderByChild("status").equalTo(3));
                $scope.fail_ideas.$loaded(function(){
                    $scope.isLoadingFailIdea = false;
                })
            }
        })

        $scope.showAddBlock = false;
    });
