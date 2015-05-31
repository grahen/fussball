'use strict';

angular.module('fussball-app.services', ['ngResource'])
    .factory('Game', ['$resource',
        function ($resource) {
            return $resource('games/:id/:action', null, {
                query: {method: 'GET', params: {}, isArray: false},
                'createGame': {method: 'POST', params: {id: 'createGame'}},
                'endGame': {method: 'POST', params: {id: '@id', action: 'endGame'}},
                'startGame': {method: 'POST', params: {id: '@id', action: 'startGame'}},
                'takePosition': {method: 'POST', params: {id: '@id', action: 'takePosition'}}

            });
        }])
    .factory('Score', ['$resource',
        function ($resource) {
            return $resource('games/score/:scoreType/:targetTeam', null, {
                //query: {method: 'GET', params: {}, isArray: false},
                //'takePosition': {method: 'POST', params: {takePosition: true}},
                'score': {method: 'POST', params: {targetTeam: '@targetTeam', scoreType: '@scoreType'}}
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
            correction: correction,
            startGame: startGame,
            takePosition: takePosition,
            addUser: addUser,
            endGame: endGame
        });

        function addUser(data) {
            return $http.post('users/adduser', data).then(handlers());
        }

        function createGame(force) {
            // $http returns a promise, which has a then function, which also returns a promise
            // Return the promise to the controller
            return $http.post('games/createGame', {}, {params: {force: force}}).then(ok, err);
        }

        function endGame(id) {
            // $http returns a promise, which has a then function, which also returns a promise
            // Return the promise to the controller
            return $http.post('games/' + id + '/endGame', {}).then(ok, err);
        }

        //Well there is currently only a way to start the current game, not bound to id at the moment.
        function startGame(id) {
            return $http.post('games/'+id+'/startGame/', {}).then(ok, err);
        }

        function takePosition(id, data) {
            return $http.post('games/' + id + '/takePosition', data).then(ok, err);
        }

        function ok(response) {
            console.log("it was a response: ");
            console.log(response);
            return response;
        }

        function err(error) {
            console.log("it was an error: ");
            console.log(error);
            return error;
        }

        function correction(team, number) {
            console.log("Correction on team " + team + " number of goals: " + number);
        }
    });