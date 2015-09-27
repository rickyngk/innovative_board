angular.module('inspinia')
  .controller('MainCtrl', function ($scope, firebaseHelper, $rootScope) {
        $scope.ideas = null;
        $scope.isLoading = true;
        $scope.groupID = "slack_C0B977PLZ";

        $rootScope.currentGroup = "public";
        $rootScope.userGroups = [];


        // $scope.ideas = firebaseHelper.syncArray("ideas");
        $scope.ideas_ref = firebaseHelper.getFireBaseInstance(["ideas", $scope.groupID]).orderByPriority();

        $scope.ideas = firebaseHelper.syncArray($scope.ideas_ref);
        $scope.ideas.$loaded(function(){
            $scope.isLoading = false;
        })

        console.log("xxx");
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
        })

        $scope.showAddBlock = false;
    });
