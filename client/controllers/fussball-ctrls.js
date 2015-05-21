'use strict';

angular.module('fussball-app.controllers',[])
    .controller('FussballCtrl', ['$scope', 'Game',
        function ($scope, Game) {
             Game.query({id: "current"}, function(current) {
                 $scope.currentGame = current;
            });
        }])
    .controller('UserCtrl', function ($scope, Stuff, Users) {
        $scope.users = Users.query();

        $scope.addUser = function (username, name, email)  {
            console.log("New user! username: " + username + " name: " + name + " email: " + email);

            //TODO Yes we could have a resource construction here!!!!!!
            var user = {};
            user.name  = name;
            user.username = username;
            user.email = email;

            Stuff.addUser(user).then(function(){
                $scope.users = Users.query();
            });

        };
    }).controller('StuffCtrl', ['$scope', 'Game', 'Stuff', 'Users',
        function ($scope, Game, Stuff, Users) {

            $scope.users = Users.query();

            $scope.takePosition = function(position, id) {
                console.log("Take pos with: " + position);

                Stuff.takePosition(id, JSON.parse(position)).then(handleResponse);
            };

            $scope.takePosition2 = function(team, position, player, id) {
               var json = {};
                json['team'] = team;
                json['position'] = position;
                json['player'] = player.username;

                console.log("Take pos with: " + json);

                Stuff.takePosition(id, json).then(handleResponse);
            };

            $scope.createGame = function (force) {
                console.log("Create new game: " + force);
                clear();
                Stuff.createGame(force).then(handleResponse);
            };

            $scope.startGame = function(id) {
                clear();
                Stuff.startGame(id).then(handleResponse);
            };

            function handleResponse(data) {
                console.log("handling data")
                if (data.status != 200) {
                    handleError(data);
                } else {
                    $scope.stuffData = data.data;
                }
            }

            function handleError(err) {
                $scope.err = err.data;
            }

            function clear() {
                $scope.currentGame = "";
                $scope.err = null;
            }
        }]);

