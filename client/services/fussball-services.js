'use strict';

angular.module('fussball-app.services', ['ngResource'])
    .factory('Game', ['$resource',
        function ($resource) {
            return $resource('games/:id', null, {
                query: {method: 'GET', params: {}, isArray: false},
                //'takePosition': {method: 'POST', params: {takePosition: true}},
                'createGame': {method: 'POST', params: {force: '@force'}}
            });
        }])

    .factory('Users', ['$resource',
        function ($resource) {
            return $resource('/users/userlist', null, {
                query: {method: 'GET', params: {}, isArray: true}
            });
        }])
    .service('Stuff', function ($http, $q) {

        return ({
            createGame: createGame,
            score: score,
            correction: correction,
            startGame: startGame,
            takePosition: takePosition,
            addUser: addUser
        });

        function addUser(data) {
            return $http.post('users/adduser', data).then(handlers());


        }


        function createGame(force) {
            // $http returns a promise, which has a then function, which also returns a promise
            // Return the promise to the controller
            return $http.post('games/createGame', {}, {params: {force: force}}).then(function (response) {
                console.log(response);
                return response;
            }, function (error) {
                console.log(error);
                return error;
            });

        }

        //Well there is currently only a way to start the current game, not bound to id at the moment.
        function startGame(id) {
            return $http.post('games/startGame').then(handlers());
        }

        function takePosition(id, data) {
            return $http.post('games/' + id + '/takePosition', data).then(handlers());
        }

        function handlers() {
            return [function (response) {
                console.log(response);
                return response.data;
            }, function (error) {
                console.log(error);
                return error;
            }]
        }

        function score(team) {
            console.log("Team " + team + " scored");
        }

        function correction(team, number) {
            console.log("Correction on team " + team + " number of goals: " + number);
        }

    });