angular.module("inspinia",["ngAnimate","ngCookies","ngTouch","ngSanitize","ngResource","ui.router","ui.bootstrap","firebase","firebaseHelper","cgNotify"]).config(["$stateProvider","$urlRouterProvider","firebaseHelperConfigProvider",function(e,a,o){o.setURL("https://ib-slack.firebaseio.com"),e.state("login",{url:"/login",templateUrl:"app/auth/login.html"}).state("change_pass",{url:"/change_pass",templateUrl:"app/auth/change_pass.html"}).state("index",{"abstract":!0,url:"/index",templateUrl:"components/common/content.html",resolve:{currentAuth:["firebaseHelper",function(e){return e.auth.$requireAuth()}]}}).state("index.main",{url:"/main",templateUrl:"app/main/main.html",data:{pageTitle:"Example view"}}).state("index.minor",{url:"/minor",templateUrl:"app/minor/minor.html",data:{pageTitle:"Example view"}}),a.otherwise("/login")}]).run(["$rootScope","$state","notify",function(e,a,o){e.$on("$stateChangeError",function(e,o,s,t,n,i){console.log("$stateChangeError",i),"AUTH_REQUIRED"===i&&a.go("login")}),e.inspiniaTemplate="components/common/notify.html",o.config({duration:"5000",position:"center"}),e.notifyError=function(a){o({message:a,classes:"alert-danger",templateUrl:e.inspiniaTemplate})},e.notifySuccess=function(a){o({message:a,classes:"alert-success",templateUrl:e.inspiniaTemplate})},e.gravatar=function(e){return"http://www.gravatar.com/avatar/"+md5(e)+"?s=200&r=pg&d=mm"}}]),angular.module("inspinia").directive("newIdeaFeed",["$timeout",function(e){return{restrict:"E",scope:{onFinished:"&",group:"@"},controller:["$scope","firebaseHelper","$sce","$rootScope",function(a,o,s,t){a.data={title:""},a.gravatar=t.gravatar,a.onSave=function(){if(!o.getUID())return t.notifyError("Something wrong @@"),void a.onCancel();var e=o.getFireBaseInstance(["ideas",a.group]),s=o.getUID();a.allowAssign&&a.assigned_user&&(s=a.assigned_user),e.push().setWithPriority({createdDate:Date.now(),title:a.data.title,uid:s,createdBy:o.getUID()},-Date.now(),function(){a.onCancel()})},a.allowAssign=!1,a.assigned_user=null;var n=function(){o.getUID()&&(a.data.uid=o.getUID(),a.user_profile=o.syncObject(["profiles_pub",a.data.uid]),a.allowAssign="admin"===o.getRole()||"mod"===o.getRole(),e(function(){a.$apply()},100))};a.$on("group:users",function(){a.users=t.groupUsers}),a.$on("user:login",function(){n()}),n(),a.onCancel=function(){a.data.title="",a.onFinished&&a.onFinished()}}],templateUrl:"app/partials/new_idea_feed/new_idea_feed.html"}}]),angular.module("inspinia").directive("ideaFeed",function(){return{restrict:"E",scope:{data:"=",group:"@"},controller:["$scope","firebaseHelper","$sce","$rootScope",function(e,a,o,s){e.formatDate=function(e){var a=new Date(e),o=a.getFullYear(),s=a.getMonth()+1,t=a.getDate(),n=a.getHours(),i=a.getMinutes(),l=a.getSeconds();return 10>s&&(s="0"+s),10>t&&(t="0"+t),10>n&&(n="0"+n),10>i&&(i="0"+i),10>l&&(l="0"+l),o+"/"+s+"/"+t+" "+n+":"+i+":"+l},e.createdDate=e.formatDate(e.data.createdDate),e.$watch("data.title",function(){e.data.title&&(e.title=o.trustAsHtml(e.data.title.replace(/(?:\r\n|\r|\n)/g,"<br />")))}),e.user_profile=a.syncObject("profiles_pub/"+e.data.uid),e.me=a.syncObject("profiles_pub/"+a.getUID()),e.created_user_profile=a.syncObject("profiles_pub/"+e.data.createdBy),e.gravatar=s.gravatar,e.ideas_vote=a.syncObject(["ideas_votes",e.group,e.data.$id,a.getUID()]),e.$on("user:login",function(){e.me=a.syncObject("profiles_pub/"+a.getUID())});var t=function(o){a.transaction(["ideas",e.group,e.data.$id],function(e){return e?(e.up_votes=(e.up_votes||0)+1,o&&(e.down_votes=(e.down_votes||0)-1),e.score=(e.up_votes||0)-(e.down_votes||0),e):void 0})},n=function(o){a.transaction(["ideas",e.group,e.data.$id],function(e){return e?(e.down_votes=(e.down_votes||0)+1,o&&(e.up_votes=(e.up_votes||0)-1),e.score=(e.up_votes||0)-(e.down_votes||0),e):void 0})},i=function(o,s){a.transaction(["ideas",e.group,e.data.$id],function(e){return e?(o&&(e.up_votes=(e.up_votes||0)-1),s&&(e.down_votes=(e.down_votes||0)-1),e.score=(e.up_votes||0)-(e.down_votes||0),e):void 0})};e.IncrComment=function(){a.transaction(["ideas",e.group,e.data.$id],function(e){return e?(e.comments=(e.comments||0)+1,e):void 0})},e.onUpVote=function(){return a.getUID()?void a.transaction(["ideas_votes",e.group,e.data.$id,a.getUID()],function(e){return e||(e={value:0}),0==e.value?(t(!1),e.value=1):-1==e.value?(t(!0),e.value=1):(i(!0,!1),e.value=0),e}):void s.notifyError("Something wrong @@")},e.onDownVote=function(){return a.getUID()?void a.transaction(["ideas_votes",e.group,e.data.$id,a.getUID()],function(e){return e||(e={value:0}),0==e.value?(n(!1),e.value=-1):1==e.value?(n(!0),e.value=-1):(i(!1,!0),e.value=0),e}):void s.notifyError("Something wrong @@")},e.showComments=!1,e.onComments=function(){e.showComments=!e.showComments,e.showComments&&!e.comments_ref&&(e.comments_ref=a.getFireBaseInstance(["idea_comments",e.group,e.data.$id]),e.comments=a.syncArray(e.comments_ref.limitToLast(50)))},e.comment="",e.onSendComment=function(){var o=e.comment;console.log(o),a.getUID()?e.comments_ref.push().set({createdDate:Date.now(),comment:o,uid:a.getUID(),email:a.getAuthEmail(),display_name:e.me.display_name},function(){e.IncrComment(),e.comment="",e.$digest()}):s.notifyError("Something wrong @@")}}],templateUrl:"app/partials/idea_feed/idea_feed.html"}}),angular.module("inspinia").controller("MainCtrl",["$scope","firebaseHelper","$rootScope",function(e,a,o){e.ideas=null,e.isLoading=!0,o.currentGroup="",o.userGroups=[],e.$on("user:login",function(){a.bindObject("profiles/"+a.getUID(),e,"data"),a.getFireBaseInstance(["user_group",a.getUID()]).once("value",function(e){o.userGroups=[];var a=e.val();for(k in a)a[k]&&o.userGroups.push(k);o.currentGroup=o.userGroups[0]})}),e.$watch("currentGroup",function(){if(o.currentGroup){var s=a.getFireBaseInstance(["group_user",o.currentGroup]);s.once("value",function(e){var s=e.val();for(k in s)s[k]&&a.getFireBaseInstance(["profiles_pub",k]).once("value",function(e){var a=e.val();o.groupUsers=[],o.groupUsers.push({display_name:a.display_name,uid:e.key()})});o.$apply(),o.$broadcast("group:users",{})}),e.ideas_ref=a.getFireBaseInstance(["ideas",e.currentGroup]).orderByPriority(),e.ideas=a.syncArray(e.ideas_ref),e.ideas.$loaded(function(){e.isLoading=!1})}}),e.showAddBlock=!1}]),angular.module("inspinia").controller("LoginCtrl",["$scope","$state","firebaseHelper","$timeout",function(e,a,o,s){e.email="",e.password="",e.isForgotPasswordMode=!1,e.onlogin=function(){return e.isForgotPasswordMode?o.resetPassword(e.email,{success:function(){e.isForgotPasswordMode=!1,s(function(){e.$apply()},100)}}):(console.log(e.email,e.password),o.login(e.email,e.password,{success:function(){a.go("index.main")}})),!0}}]),angular.module("inspinia").controller("ChangePassCtrl",["$scope","$state","firebaseHelper",function(e,a,o){e.email="",e.password="",e.new_password="",e.new_password_confirm="",e.ready=!1,e.email=o.getAuthEmail(),e.ready=!!e.email,e.$on("user:login",function(){e.ready=!0,e.email=o.getAuthEmail()}),e.onChangePassword=function(){return o.updatePassword(e.password,e.new_password,{success:function(){a.go("index.main")}}),!0},e.goBack=function(){a.go("index.main")}}]),angular.module("inspinia").controller("NavCtrl",["$scope","firebaseHelper","$timeout","$state",function(e,a,o,s){e.email=a.getAuthEmail(),e.$on("user:login",function(){e.email=a.getAuthEmail()}),e.onLogout=function(){a.logout()},e.onChangePassword=function(){s.go("change_pass")}}]).controller("TopNavCtrl",["$scope","firebaseHelper",function(e,a){e.onLogout=function(){a.logout()}}]),$(document).ready(function(){function e(){var e=$("body > #wrapper").height()-61;$(".sidebard-panel").css("min-height",e+"px");var a=$("nav.navbar-default").height(),o=$("#page-wrapper").height();a>o&&$("#page-wrapper").css("min-height",a+"px"),o>a&&$("#page-wrapper").css("min-height",$(window).height()+"px"),$("body").hasClass("fixed-nav")&&$("#page-wrapper").css("min-height",$(window).height()-60+"px")}$(window).bind("load resize scroll",function(){$("body").hasClass("body-small")||e()}),setTimeout(function(){e()})}),$(function(){$(window).bind("load resize",function(){$(this).width()<769?$("body").addClass("body-small"):$("body").removeClass("body-small")})}),angular.module("inspinia").directive("sideNavigation",["$timeout",function(e){return{restrict:"A",link:function(a,o){a.$watch("authentication.user",function(){e(function(){o.metisMenu()})})}}}]).directive("minimalizaSidebar",["$timeout",function(e){return{restrict:"A",template:'<a class="navbar-minimalize minimalize-styl-2 btn btn-primary " href="" ng-click="minimalize()"><i class="fa fa-bars"></i></a>',controller:["$scope","$element",function(a){a.minimalize=function(){angular.element("body").toggleClass("mini-navbar"),!angular.element("body").hasClass("mini-navbar")||angular.element("body").hasClass("body-small")?(angular.element("#side-menu").hide(),e(function(){angular.element("#side-menu").fadeIn(500)},100)):angular.element("#side-menu").removeAttr("style")}}]}}]),angular.module("inspinia").run(["$templateCache",function(e){e.put("app/auth/change_pass.html",'<div class="middle-box text-center loginscreen animated fadeInDown" ng-controller="ChangePassCtrl"><div><div><h1 class="logo-name">IB</h1></div><h3>Welcome to Innovative Board</h3><form class="m-t" role="form" ng-submit="onChangePassword()"><div class="form-group"><input ng-readonly="true" name="email" type="email" class="form-control" placeholder="Email" required="" ng-model="email"></div><div class="form-group"><input name="" type="password" class="form-control" placeholder="Password" required="" ng-model="password"></div><div class="form-group"><input name="" type="password" class="form-control" placeholder="New password" required="" ng-model="new_password"></div><div class="form-group"><input name="" type="password" class="form-control" placeholder="New password confirm" required="" ng-model="new_password_confirm"></div><button type="submit" class="btn btn-primary block full-width m-b" ng-disabled="!ready || !new_password || new_password != new_password_confirm">Change Password</button> <button ng-click="goBack()" class="btn block full-width m-b">Go back</button></form><p class="m-t"><small>Inspinia we app framework base on Bootstrap 3 &copy; 2014</small></p></div></div>'),e.put("app/auth/login.html",'<div class="middle-box text-center loginscreen animated fadeInDown" ng-controller="LoginCtrl"><div><div><h1 class="logo-name">IB</h1></div><h3>Welcome to Innovative Board</h3><form class="m-t" role="form" ng-submit="onlogin()" ng-show="!isForgotPasswordMode"><div class="form-group"><input name="email" type="email" class="form-control" placeholder="Email" required="" ng-model="email"></div><div class="form-group"><input name="password" type="password" class="form-control" placeholder="Password" required="" ng-model="password"></div><button type="submit" class="btn btn-primary block full-width m-b">Login</button> <a ng-click="isForgotPasswordMode = true"><small>Reset password</small></a></form><form class="m-t" role="form" ng-submit="onlogin()" ng-show="isForgotPasswordMode"><div class="form-group"><input name="email" type="email" class="form-control" placeholder="Email" required="" ng-model="email"></div><button type="submit" class="btn btn-primary block full-width m-b">Reset password</button> <a ng-click="isForgotPasswordMode = false"><small>Login</small></a></form><p class="m-t"><small>Inspinia we app framework base on Bootstrap 3 &copy; 2014</small></p></div></div>'),e.put("app/main/main.html",'<div class="wrapper wrapper-content animated fadeInRight" ng-controller="MainCtrl"><div class="row"><div class="col-lg-offset-1 col-lg-10"><div class="ibox float-e-margins"><div class="ibox-title"><h5>In discussion ideas</h5><div class="ibox-tools" ng-show="!isLoading && !showAddBlock"><a class="btn btn-success btn-circle btn-outline" ng-click="showAddBlock = true"><i class="fa fa-plus"></i></a></div><div style="clear:both"></div></div><div class="ibox-content"><div><div class="feed-activity-list"><div class="feed-element" ng-hide="!isLoading"><div class="media-body"><strong>Loading <i class="fa fa-refresh fa-spin"></i></strong></div></div><div class="feed-element" ng-show="!isLoading && ideas.length == 0 && !showAddBlock"><div class="media-body"><strong>No idea here. <a ng-click="showAddBlock = true">Create one</a></strong></div></div><new-idea-feed ng-show="showAddBlock" style="display:block" group="{{currentGroup}}" class="feed-element" on-finished="showAddBlock = false"></new-idea-feed><idea-feed style="display:block" class="feed-element" data="r" group="{{currentGroup}}" ng-repeat="r in ideas"></idea-feed></div></div></div></div></div></div></div>'),e.put("app/minor/minor.html",'<div class="wrapper wrapper-content animated fadeInRight"><div class="row"><div class="col-lg-12"><div class="text-center m-t-lg"><h1>Simple example of second view</h1><small>Configure in app.js as index.minor state.</small></div></div></div></div>'),e.put("components/common/content.html",'<div id="wrapper"><div ng-include="\'components/common/navigation.html\'"></div><div id="page-wrapper" class="gray-bg {{$state.current.name}}"><div ng-include="\'components/common/topnavbar.html\'"></div><div ui-view=""></div><div ng-include="\'components/common/footer.html\'"></div></div></div>'),e.put("components/common/footer.html",'<div class="footer"><div class="pull-right"></div><div><strong>Copyright</strong> Vietnamworks &copy; 2015</div></div>'),e.put("components/common/ibox_tools.html",'<div class="ibox-tools dropdown" dropdown=""><a ng-click="showhide()"><i class="fa fa-chevron-up"></i></a> <a class="dropdown-toggle" href="" dropdown-toggle=""><i class="fa fa-wrench"></i></a><ul class="dropdown-menu dropdown-user"><li><a href="">Config option 1</a></li><li><a href="">Config option 2</a></li></ul><a ng-click="closebox()"><i class="fa fa-times"></i></a></div>'),e.put("components/common/navigation.html",'<nav class="navbar-default navbar-static-side" role="navigation" ng-controller="NavCtrl"><div class="sidebar-collapse"><ul side-navigation="" class="nav metismenu" id="side-menu"><li class="nav-header"><div class="dropdown profile-element" dropdown=""><img alt="image" class="img-circle" style="max-width:40px" ng-src="{{gravatar(email)}}"> <a class="dropdown-toggle" dropdown-toggle="" href=""><span class="clear"><span class="block m-t-xs"><strong class="font-bold">{{email}}</strong></span> <span class="text-muted text-xs block">Menu<b class="caret"></b></span></span></a><ul class="dropdown-menu animated fadeInRight m-t-xs"><li><a href="" ng-click="onChangePassword()">Change password</a></li><li class="divider"></li><li><a href="" ng-click="onLogout()">Logout</a></li></ul></div><div class="logo-element">IB</div></li><li ui-sref-active="active"><a ui-sref="index.main"><i class="fa fa-laptop"></i> <span class="nav-label">In Discussion</span></a></li></ul></div></nav>'),e.put("components/common/notify.html","<div class=\"gmail-template cg-notify-message\" ng-click=\"$close()\" ng-class=\"[$classes, $position === 'center' ? 'cg-notify-message-center' : '', $position === 'left' ? 'cg-notify-message-left' : '', $position === 'right' ? 'cg-notify-message-right' : '']\" ng-style=\"{'margin-left': $centerMargin}\"><style>\n        .gmail-template {\n            text-align: center;\n            border:1px solid rgb(240, 195, 109);\n            background-color: rgb(249, 237, 190);\n            font-size: 13px;\n            font-weight: bold;\n            padding:2px 8px 2px 8px;\n            border-radius: 0;\n            color:#333;\n        }\n    </style><div ng-show=\"!$messageTemplate\">{{$message}}</div><div ng-show=\"$messageTemplate\" class=\"cg-notify-message-template\"></div></div>"),e.put("components/common/topnavbar.html",'<div class="row border-bottom" ng-controller="TopNavCtrl"><nav class="navbar navbar-static-top white-bg" role="navigation" style="margin-bottom: 0"><div class="navbar-header"><span minimaliza-sidebar=""></span><form role="search" class="navbar-form-custom" method="post" action=""><div class="form-group"><input type="text" placeholder="Search for something..." class="form-control" name="top-search" id="top-search"></div></form></div><ul class="nav navbar-top-links navbar-right"><li class="dropdown" dropdown=""><a class="dropdown-toggle count-info" href="" dropdown-toggle="">{{currentGroup}}</a><ul class="dropdown-menu animated fadeInRight m-t-xs" ng-show="userGroups && userGroups.length > 1"><li><a ng-click="currentGroup = r" ng-repeat="r in userGroups">{{r}}</a></li></ul></li><li><a href="" ng-click="onLogout()"><i class="fa fa-sign-out"></i> Log out</a></li></ul></nav></div>'),e.put("app/partials/idea_feed/idea_feed.html",'<a class="pull-left"><img alt="image" class="img-circle" ng-src="{{user_profile.avatar || gravatar(user_profile.email)}}"></a><div class="media-body"><small ng-show="data.score > 0" class="pull-right label label-info">{{data.score || 0}} pts</small> <small ng-show="data.score < 0" class="pull-right label label-danger">{{data.score || 0}} pts</small> <small ng-show="!data.score || data.score == 0" class="pull-right label">{{data.score || 0}} pts</small> <strong>{{user_profile.display_name}}</strong><br><small class="text-muted">{{createdDate}}</small> <small class="text-muted hidden-xs">. Created by: {{created_user_profile.display_name}}</small><div class="well" ng-bind-html="title"></div><small class="text-success" ng-show="ideas_vote.value==1"><i class="fa fa-thumbs-up"></i> You like this</small> <small class="text-danger" ng-show="ideas_vote.value==-1"><i class="fa fa-thumbs-down"></i> You don\'t like this</small><div class="pull-right"><a class="btn btn-xs" ng-class="{\'btn-white\': ideas_vote.value!=1, \'btn-primary\': ideas_vote.value==1}" ng-click="onUpVote()"><i class="fa fa-thumbs-up"></i> {{data.up_votes || 0}}</a> <a class="btn btn-xs" ng-class="{\'btn-white\': ideas_vote.value!=-1, \'btn-danger\': ideas_vote.value==-1}" ng-click="onDownVote()"><i class="fa fa-thumbs-down"></i> {{data.down_votes || 0}}</a> <a class="btn btn-xs" ng-class="{\'btn-white\': !showComments, \'btn-outline\': data.comments > 0, \'btn-primary\': showComments || data.comments}" ng-click="onComments()"><i class="fa fa-comments-o"></i> {{data.comments || 0}}</a></div><div class="row" style="clear:both" ng-show="showComments"><div class="col-lg-11 col-lg-offset-1"><div class="social-feed-box"><div class="social-footer"><div class="social-comment" ng-repeat="c in comments"><a href="" class="pull-left"><img alt="image" ng-src="{{c.avatar || gravatar(c.email)}}"></a><div class="media-body"><a href="#">{{c.display_name}}</a> {{c.comment}}<br><small class="text-muted">{{formatDate(c.createdDate)}}</small></div></div><div class="social-comment"><a href="" class="pull-left"><img alt="image" ng-src="{{gravatar(me.email)}}"></a><div class="media-body"><textarea maxlength="140" ng-model="comment" class="form-control" placeholder="Write comment..."></textarea></div></div><p></p><div class="pull-right"><strong>{{140 - comment.length}} chars left</strong> <button class="btn btn-xs btn-primary" ng-disabled="!comment" ng-click="onSendComment()"><i class="fa fa-send"></i> Send</button> <button class="btn btn-xs" ng-click="showComments = false"><i class="fa fa-times"></i> Close</button></div><div style="clear:both"></div></div></div></div></div></div>'),e.put("app/partials/new_idea_feed/new_idea_feed.html",'<aclass="pull-left"><img alt="image" class="img-circle" ng-src="{{user_profile.avatar || gravatar(user_profile.email)}}"><div class="media-body"><small class="pull-right">{{createdDate}}</small><p><strong>{{user_profile.display_name}}</strong></p><textarea maxlength="512" placeholder="Enter your idea here" class="form-control" rows="6" ng-model="data.title"> </textarea><p></p><div ng-show="allowAssign && users && users.length > 0"><p><strong>Idea of</strong></p><select class="form-control m-b" name="account" ng-model="assigned_user"><option value="">@me</option><option ng-repeat="u in users" value="{{u.uid}}">{{u.display_name}}</option></select></div><div class="pull-right"><strong>{{512 - data.title.length}} chars left</strong> <button ng-disabled="!data.title" class="btn btn-xs btn-primary" ng-click="onSave()"><i class="fa fa-save"></i> Save</button> <button class="btn btn-xs btn-warning" ng-click="onCancel()"><i class="fa fa-trash"></i> Cancel</button></div></div></aclass="pull-left">')}]);