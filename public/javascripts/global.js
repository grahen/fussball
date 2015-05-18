// Userlist data array for filling in info box
var userListData = [];

angular.module('fussball-app', [
    'ngRoute',
    'fussball-app.games'
]).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/games-list/:gameid?', {
            templateUrl: 'views/games-list.html',
            controller: 'FussballCtrl'
        });

        $routeProvider.otherwise({redirectTo: '/games-list'});
    }]);


// DOM Ready =============================================================
$(document).ready(function () {

    // Populate the user table on initial page load

    populateTable();

    // Username link click
    $('#userList').find('table tbody').on('click', 'td a.linkshowuser', showUserInfo);


});

// Functions =============================================================

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON('/users/userlist', function (data) {

        userListData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function () {
            tableContent += '<tr>';
            tableContent += '<td><a href="#" class="linkshowuser" rel="' + this.username + '">' + this.username + '</a></td>';
            tableContent += '<td>' + this.email + '</td>';
            tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $("#userList").find("table tbody").html(tableContent);
    });
}

// Show User Info
function showUserInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisUserName = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = userListData.map(function (arrayItem) {
        return arrayItem.username;
    }).indexOf(thisUserName);

    // Get our User Object
    var thisUserObject = userListData[arrayPosition];

    //Populate Info Box
    $('#userInfoName').text(thisUserObject.fullname);
    $('#userInfoAge').text(thisUserObject.age);
    $('#userInfoGender').text(thisUserObject.gender);
    $('#userInfoLocation').text(thisUserObject.location);

}
