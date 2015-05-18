'use strict';

angular.module('fussball-app.games')

.factory('Games', function() {
    var lists = [
        {
            id:0,
            name:"Italian Cars",
            items : ['Ferrari', 'Fiat', 'Lamborghini', 'Maserati']
        },
        {
            id:1,
            name:"Exotic Fruits",
            items : ['Banana', 'Pineapple']
        },
        {
            id:2,
            name:"Programming Languages",
            items : ['C', 'Scala', 'JavaScript']
        }
    ];
    return {

        //This is a json object. thus comma separate them,
        getGames: function() {
            return lists;
        },

        addList: function(name) {
            lists.push({id: lists.length, name: name, items:[]});
        },

        openList: function(idx) {
           return lists[idx];
        },

        addItemToList: function(id, value) {
          lists[id].items.push(value);
        },

        remove: function(id, value) {
            lists[id].items =  lists[id].items.filter(function(o) {
                return o !== value;
            })
        }

    };


});