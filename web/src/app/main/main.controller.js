angular.module('inspinia')
  .controller('MainCtrl', function ($scope, firebaseHelper, $rootScope) {
        $scope.ideas = null;
        $scope.isLoadingPlainingIdea = true;
        $scope.isLoadingProcessingIdea = true;
        $scope.isLoadingDoneIdea = true;
        $scope.isLoadingFailIdea = true;
        // $scope.groupID = "slack_C0B977PLZ";

        $rootScope.currentGroup = "";
        $rootScope.userGroups = [];

        $scope.$on("user:login", function() {
            firebaseHelper.bindObject("profiles/" + firebaseHelper.getUID(), $scope, "data");
            firebaseHelper.getFireBaseInstance(["user_group", firebaseHelper.getUID()]).once("value", function(snapshot) {
                $rootScope.userGroups = [];
                var groups = snapshot.val();
                for (k in groups) {
                    if (groups[k]) {
                        $rootScope.userGroups.push(k);
                    }
                }
                $rootScope.currentGroup = $rootScope.userGroups[0];
            });
        });

        $scope.$watch("currentGroup", function(){
            if ($rootScope.currentGroup) {
                var ref = firebaseHelper.getFireBaseInstance(["group_user", $rootScope.currentGroup]);
                ref.once("value", function(snapshot) {
                    var users = snapshot.val();
                    for (k in users) {
                        if (users[k]) {
                            firebaseHelper.getFireBaseInstance(["profiles_pub", k]).once("value", function(snapshot2) {
                                var val = snapshot2.val();
                                $rootScope.groupUsers = [];
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
