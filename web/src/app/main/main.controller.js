angular.module('inspinia')
  .controller('MainCtrl', function ($scope, firebaseHelper, $rootScope) {
        $scope.ideas = null;
        $scope.isLoading = true;
        $scope.groupID = "-JzxqFZwj34iRvz2dcrk";


        // $scope.ideas = firebaseHelper.syncArray("ideas");
        $scope.ideas_ref = firebaseHelper.getFireBaseInstance(["ideas", $scope.groupID]);

        $scope.ideas = firebaseHelper.syncArray($scope.ideas_ref);
        $scope.ideas.$loaded(function(){
            $scope.isLoading = false;
        })

        $scope.$on("user:login", function() {
            firebaseHelper.bindObject("profiles/" + firebaseHelper.getUID(), $scope, "data");
        })

        $scope.onAddIdea = function() {
            $scope.ideas.$add({
                createdDate: Date.now(),
                title: "this is a test",
                uid: firebaseHelper.getUID()
            }).catch(function(error) {
                $rootScope.notifyError(error.code);
            });
        }

        $scope.showAddBlock = false;
    });
