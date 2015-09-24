'use strict';

angular.module('inspinia')

.controller('NavCtrl', function ($scope, firebaseHelper, $timeout) {
    $scope.email = firebaseHelper.getAuthEmail();

    $scope.$on("user:login", function() {
        $scope.email = firebaseHelper.getAuthEmail();
    })

    $scope.onLogout = function() {
        firebaseHelper.logout();
    }
})
.controller('TopNavCtrl', function ($scope, firebaseHelper) {
    $scope.onLogout = function() {
        firebaseHelper.logout();
    }
})
;
