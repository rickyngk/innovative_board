'use strict';

angular.module('inspinia')
  .controller('MainCtrl', function ($scope, firebaseHelper, $rootScope) {
        $scope.ideas = null;
        $scope.isLoading = true;

        $scope.ideas = firebaseHelper.syncArray("ideas");
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
