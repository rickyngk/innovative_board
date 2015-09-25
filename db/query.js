var Firebase = require("firebase");
var url = "https://" + process.argv[2] + ".firebaseio.com/" + process.argv[3];
console.log("GET:" + url);
var ref = new Firebase(url) ;
ref.on("value",
    function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var key = childSnapshot.key();
            var childData = childSnapshot.val();
            console.log("key:", key);
            console.log("data:", JSON.stringify(childData));
        });
        process.exit();
    },
    function(error) {
        console.log(error);
        process.exit();
    }
);
