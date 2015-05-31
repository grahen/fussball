'use strict';

angular.module('fussball-app.controllers', [])
    .controller('FussballCtrl', ['$scope', 'Game', 'Users', 'Score','socket',
        function ($scope, Game, Users, Score, socket) {

            socket.on("gameUpdated", function(game) {
                if (game.timeStarted =='') {
                   console.log("Should do magic stuff");
                   console.log($scope.users);
                   clearPlayerPositions($scope);
                   setupPlayers($scope.users, game, $scope);
               }
                $scope.err = null;
                $scope.currentGame = game;
            });

            $scope.teams = {team_one: "Silver", team_two:"Black"};

            $scope.endGame = function (id) {
                Game.endGame({id: id}).$promise.then(ok,err);
            };

            $scope.takePosition = function (id, team, position, player) {
                var json = {};
                json['team'] = team;
                json['position'] = position;
                json['player'] = player.username;

                console.log("Take pos in " + id + " with: " + JSON.stringify(json));
                Game.takePosition({id: id}, json).$promise.then(ok, err);
            };

            $scope.startGame = function (id) {
                Game.startGame({id: id}).$promise.then(ok, err);
            };

            $scope.createGame = function () {

                Game.createGame({}).$promise.then(function(data){
                    clearPlayerPositions($scope);
                    ok(data);
                }, err);
            };

            $scope.correction = function (team) {
                scoreOrCorrection(team, -1, 'C');
            };

            $scope.score = function (team) {
                scoreOrCorrection(team, 1, 'S');
            };

            function scoreOrCorrection(team, count, type) {
                if ($scope.currentGame.timeEnded == '') { //only if it hasn't been ended.
                    Score.score({targetTeam: team, count: count, scoreType: type}).$promise.then(ok, err);
                }
            }

            function ok(game) {
                console.log(game);
                $scope.currentGame = game;
            }

            function err(resp) {
                console.log(resp);
                $scope.err = resp.data.err;
            }

            Game.query({id: "current"}, function (current) {
                $scope.currentGame = current;
                //$scope.teamOneOffense = current.team_one.offense;

                $scope.users = Users.query(function(users){
                    setupPlayers(users, current, $scope);
                    console.log($scope.teamOneOffense);
                });


            });
        }])
    .controller('UserCtrl', function ($scope, Stuff, Users) {
        $scope.users = Users.query();

        $scope.addUser = function (username, name, email) {
            console.log("New user! username: " + username + " name: " + name + " email: " + email);

            //TODO Yes we could have a resource construction here!!!!!!
            var user = {};
            user.name = name;
            user.username = username;
            user.email = email;

            Stuff.addUser(user).then(function () {
                $scope.users = Users.query();
            });

        };
    }).controller('StuffCtrl', ['$scope', 'Game', 'Stuff', 'Users', 'Score',
        function ($scope, Game, Stuff, Users, Score) {

            $scope.users = Users.query();

            Game.query({id: "current"}, function (current) {
                $scope.stuffData = current;
            });

            $scope.takePosition2 = function (team, position, player, id) {
                clear();
                var json = {};
                json['team'] = team;
                json['position'] = position;
                json['player'] = player.username;

                console.log("Take pos with: " + JSON.stringify(json));

                Stuff.takePosition(id, json).then(handleResponse);
            };

            $scope.createGame = function (force) {
                console.log("Create new game: " + force);
                clear();
                Stuff.createGame(force).then(handleResponse);
            };

            $scope.endGame = function (id) {
                console.log("End game :" + id);
                Stuff.endGame(id).then(handleResponse);
            };

            $scope.startGame = function (id) {
                clear();
                Stuff.startGame(id).then(handleResponse);
            };

            $scope.correction = function (team, count) {
                scoreOrCorrection(team, count, 'C');
            };

            $scope.score = function (team, count) {
                scoreOrCorrection(team, count, 'S');
            };

            $scope.getCurrentGame = function () {
                clear();
                Game.query({id: "current"}, function (current) {
                    clear();
                    $scope.stuffData = current;
                });
            };

            function scoreOrCorrection(team, count, type) {

                Score.score({targetTeam: team, count: count, scoreType: type}).$promise.then(function (data) {
                    console.log(data);
                    $scope.stuffData = data;
                    $scope.err = null;
                }, function (err) {
                    console.log("error: " + err.data.err);
                    $scope.stuffData = null;
                    $scope.err = err.data.err;
                });
            }

            function handleResponse(data) {
                console.log("handling data");
                console.log(data);

                if (data.status != 200) {
                    handleError(data);
                } else {
                    $scope.stuffData = data.data;
                }
            }

            function handleError(err) {
                $scope.stuffData = null;
                $scope.err = err.data;
            }

            function clear() {
                $scope.currentGame = null;
                $scope.err = null;
                $scope.stuffData = null;
            }
        }]);

function setupPlayers(users, game, $scope) {
    $scope.teamOneOffense = users.filter(function(e) {
        return e.username == game.team_one.offense
    })[0];

    $scope.teamTwoOffense = users.filter(function(e) {
        return e.username == game.team_two.offense
    })[0];

    $scope.teamOneDefense = users.filter(function(e) {
        return e.username == game.team_one.defense
    })[0];

    $scope.teamTwoDefense = users.filter(function(e) {
        return e.username == game.team_two.defense
    })[0];
}

function clearPlayerPositions($scope){
    $scope.teamOneDefense = null;
    $scope.teamOneOffense = null;
    $scope.teamTwoDefense = null;
    $scope.teamTwoOffense = null;
}

