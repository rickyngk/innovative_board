angular.module('inspinia').controller('LoginCtrl', function ($scope, $state, firebaseHelper) {
	$scope.email = "";
	$scope.password = "";
	$scope.onlogin = function() {
        firebaseHelper.login($scope.email, $scope.password, {
            success: function(data) {
                $state.go("index.main");
            }
        });
		return true;
	}
});
