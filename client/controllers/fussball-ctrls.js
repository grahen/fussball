'use strict';

angular.module('fussball-app.games', [])
    .controller('FussballCtrl', function ($scope, $routeParams, Games, $http) {
        $scope.currentGame = "nohting yet";

        $http.get('/games/current').success(function (data, status, headers, config) {
            console.log(data);
            console.log(status);
            $scope.currentGame = data;

        }).error(function (data, status, headers, config) {
            console.log("error " + status);

        })

        //$scope.addList = function (name) {
        //    Games.addList(name);
        //
        //    $scope.lists = Games.getGames;
        //
        //};

//        $scope.openList = function (idx) {
//            //   alert(JSON.stringify(Lists.openList(idx).items));
//            $scope.selectedList = Lists.openList(idx)
//        };
//
//
//        $scope.getList = function () {
//            //   alert(JSON.stringify(Lists.openList(idx).items));
//            return Lists.openList($routeParams.listid)
//        };
//
//        $scope.addItemToList = function (itemValue) {
//            //   alert(JSON.stringify(Lists.openList(idx).items));
//
//            Lists.addItemToList($routeParams.listid, itemValue);
//            $scope.lists = Lists.getLists();
//
////list.items.push(itemValue);
//        };
//
//        $scope.remove = function (item) {
//            //alert(item);
//
//            Lists.remove($routeParams.listid, item);
//
//          //  Lists.addItemToList($routeParams.listid, itemValue);
//            //list.items.push(itemValue);
//        };

    })
    .controller('UserCtrl', function ($scope, $routeParams, $http) {
        $scope.users = {};

        $http.get('/users/userlist').success(function (data, status, headers, config) {
            console.log(data);
            console.log(status);
            $scope.users = data;

        }).error(function (data, status, headers, config) {
            console.log("error " + status);
        });

        $scope.addUser = function(username, name, email) {
            console.log(username + "---" + name + "--" + email);
            $scope.name = "";
            $scope.username = "";
            $scope.email = "";
        }
    });