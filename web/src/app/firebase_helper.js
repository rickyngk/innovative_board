window.FIREBASE_URL = "https://innovativeboard.firebaseio.com";

angular.module('firebaseHelper', [])
.service('firebaseHelper', function($firebaseObject, $firebaseArray, $firebaseObject, $firebaseAuth, $rootScope, $state, notify) {
    var self = this;

    this.getFireBaseInstance = function(key) {
        key = getPath(key);
        return new Firebase(key?FIREBASE_URL + "/" + key:FIREBASE_URL);
    }

    this.buildPath = function(arr) {
        return arr.join("/")
    }

    var getPath = function(p) {
        if (!p) {
            return p;
        }
        if (typeof(p) == "string") {
            return p;
        }
        return self.buildPath(p);
    }

    this.bindObject = function(path, $scope, key) {
        path = getPath(path);
        console.log("bindObject", path);
        var syncObject = $firebaseObject(self.getFireBaseInstance(path));
        syncObject.$bindTo($scope, key);
    }

    this.syncObject = function(path) {
        path = getPath(path);
        console.log("syncObject", path);
        return $firebaseObject(self.getFireBaseInstance(path));
    }

    this.syncProtectedObject = function(path) {
        path = getPath(path);
        console.log("syncProtectedObject", path);
        return $firebaseObject(self.getFireBaseInstance(path + "/" + self.getUID()));
    }

    this.syncArray = function(path) {
        path = getPath(path);
        console.log("syncArray", path);
        return $firebaseArray(self.getFireBaseInstance(path));
    }

    this.syncProtectedArray = function(path) {
        path = getPath(path);
        console.log("syncArray", path + "/" + self.getUID());
        return $firebaseArray(self.getFireBaseInstance(path + "/" + self.getUID()));
    }

    this.transaction = function(path, f) {
        path = getPath(path);
        self.getFireBaseInstance(path).transaction(function(current_val) {
            if (f) {return f(current_val);}
            return current_val;
        })
    }

    this.auth = $firebaseAuth(self.getFireBaseInstance());
    this.authData = null;
    this.profileData = null;
    this.auth.$onAuth(function(authData) {
        console.log("$onAuth", authData);
        self.authData = authData;
        if (authData) {
            self.syncObject("profiles/" + self.getUID()).$loaded(
                function (data) {
                    self.profileData = data;
                    $rootScope.$broadcast('user:login',authData);
                    // if (data.role !== "admin") {
                    //     $state.go("login");
                    //     $rootScope.notifyError("Invalid permission");
                    // }
                },
                function (error) {
                    $rootScope.notifyError("Fail to get data");
                    $state.go("login");
                }
            )
        }
    });

    this.isAdmin = function() {
        return (this.profileData && this.profileData.role === "admin");
    }

    this.getUID = function() {
        if (this.authData && this.authData.uid) {
            return this.authData.uid;
        }
        return "";
    }

    this.hasAlreadyLogin = function() {
        return this.authData != null;
    }

    this.getAuthEmail = function() {
        if (this.authData) {
            if (this.authData.password && this.authData.password.email) {
                return this.authData.password.email;
            }
        }
        return "";
    }

    this.getGravatar = function() {
        if (this.authData) {
            if (this.authData.password && this.authData.password.email) {
                return "http://www.gravatar.com/avatar/" + md5(this.authData.password.email) + "?s=200&r=pg&d=mm";
            }
        }
        return "http://www.gravatar.com/avatar/" + md5("nothing") + "?s=200&r=pg&d=mm";
    }

    this.logout = function() {
        self.auth.$unauth();
        self.authData = null;
        $state.go("login");
    }

    this.login = function(email, password, callback) {
        callback = callback || {};
        self.auth.$authWithPassword({email: email, password: password})
            .then(function(authData) {
                self.authData = authData;
                if (callback.success) {callback.success(authData);}
            })
            .catch(function(error) {
                $rootScope.notifyError("Invalid account");
                self.authData = null;
                if (callback.error) {callback.error(error);}
            });

    }
});
