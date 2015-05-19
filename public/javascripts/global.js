// Userlist data array for filling in info box
var userListData = [];

angular.module('fussball-app', [
    'ngRoute',
    'fussball-app.games'
]).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/games-list/:gameid?', {
            templateUrl: 'views/games-list.html',
            controller: 'FussballCtrl'
        }).when('/users/:userId?', {
            templateUrl: 'views/users-list.html',
            controller: 'UserCtrl'
        });

        $routeProvider.otherwise({redirectTo: '/games-list'});
    }]);


// DOM Ready =============================================================
$(document).ready(function () {

    $.material.init()

    $(".nav a").on("click", function(){
        $(".nav").find(".active").removeClass("active");
        $(this).parent().addClass("active");
    });

});


