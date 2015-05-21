'use strict';

angular.module('fussball-app.services', ['ngResource'])
    .factory('Game', ['$resource',
        function ($resource) {
            return $resource('games/:id', null, {
                query: {method: 'GET', params: {}, isArray: false},
                'takePosition': {method: 'POST', params:{takePosition:true}}
            });
        }])

    .factory('Users', function () {
        return {
            getUsers: function () {
                //Todo factory stuff for getting the list of users
            }
        }
    })
    .factory('Stuff', function () {
        return {
            getUsers: function () {
                //Todo factory stuff for getting the list of users
            }
        }
    });