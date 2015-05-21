'use strict';

angular.module('fussball-app.controllers',[])
    .controller('FussballCtrl', ['$scope', 'Game',
        function ($scope, Game) {
             Game.query({id: "current"}, function(current) {
                 $scope.currentGame = current;
            });
        }])
    .controller('UserCtrl', function ($scope, $routeParams, $http) {
        $scope.users = {};

        $http.get('/users/userlist').success(function (data, status, headers, config) {
            console.log(data);
            console.log(status);
            $scope.users = data;

        }).error(function (data, status, headers, config) {
            console.log("error " + status);
        });

        $scope.addUser = function (username, name, email) {
            console.log(username + "---" + name + "--" + email);
            $scope.name = "";
            $scope.username = "";
            $scope.email = "";
        }
    }).controller('StuffCtrl', ['$scope', 'Game',
        function ($scope, Game) {
            $scope.takePosition = function(position) {
                console.log("Take pos with: " + position);

                Game.takePosition({id:"theGame1"}, JSON.parse(position));
            };

        }]);