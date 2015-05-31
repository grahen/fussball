// Userlist data array for filling in info box
var userListData = [];

angular.module('fussball-app', [
    'ngRoute',
    'ngResource',
    'fussball-app.controllers',
    'fussball-app.services',
    'fussball-app.socket'
]).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/games-list/:gameid?', {
            templateUrl: 'views/game',
            controller: 'FussballCtrl'
        }).when('/users/:userId?', {
            templateUrl: 'views/users-list',
            controller: 'UserCtrl'
        }).when('/stuff/', {
            templateUrl: 'views/stuff',
            controller: 'StuffCtrl'
        });

        $routeProvider.otherwise({redirectTo: '/games-list'});
    }]);


// DOM Ready =============================================================
$(document).ready(function () {

    $(".nav a").on("click", function(){
        $(".nav").find(".active").removeClass("active");
        $(this).parent().addClass("active");
    });

});


