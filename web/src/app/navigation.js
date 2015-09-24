'use strict';

angular.module('inspinia')

.controller('NavCtrl', function ($scope, firebaseHelper, $timeout, $state) {
    $scope.email = firebaseHelper.getAuthEmail();

    $scope.$on("user:login", function() {
        $scope.email = firebaseHelper.getAuthEmail();
    })

    $scope.onLogout = function() {
        firebaseHelper.logout();
    }

    $scope.onChangePassword = function() {
        $state.go("change_pass");
    }
})
.controller('TopNavCtrl', function ($scope, firebaseHelper) {
    $scope.onLogout = function() {
        firebaseHelper.logout();
    }
})
;
