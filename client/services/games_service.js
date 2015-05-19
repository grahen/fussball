'use strict';

angular.module('fussball-app.games')

.factory('Games', function() {
    return {

        //This is a json object. thus comma separate them,
        getGames: function() {
            return "";
        },

        addList: function(name) {
            //lists.push({id: lists.length, name: name, items:[]});
        },

        openList: function(idx) {
           return "" //lists[idx];
        },

        addItemToList: function(id, value) {
          //lists[id].items.push(value);
        },

        remove: function(id, value) {
            //lists[id].items =  lists[id].items.filter(function(o) {
            //    return o !== value;
            //})
        }

    };


});