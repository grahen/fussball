"use strict";
var express = require('express');
var router = express.Router();

var games = require('../impl/game');
var m = require('monet');

/*
 * GET userlist.
 */
router.get('/userlist', function (req, res) {
    var db = req.db;
    getAllUsers(db, (items) => res.json(items));
});

/*
 * POST to adduser.
 */
router.post('/adduser', function (req, res) {
    var db = req.db;
    console.log(JSON.stringify(req.body));
    db.collection('userlist').insert(req.body, function (err, result) {
        res.send(
            (err === null) ? {msg: ''} : {msg: err}
        );
    });
});

/**
 * Find all the users in the db and return them through given callback
 * @param db
 * @param callback
 */
function getAllUsers(db, callback) {
    db.collection('userlist').find().toArray(function (err, items) {
        callback(items);
    });
}

function getOpposingTeam(team) {
    if (team === "team_one") {
        return "team_two"
    }

    return "team_one";
}

function getPossiblePlayerForPosition (db, filterThese, f) {
    getAllUsers(db, (users) => {
        f(users.map(u => u.username).filter(u => u != null && filterThese.indexOf(u) < 0)); //Only those that aren't on the opposing team.
    });
}

/**
 * Get lists of players available for a specific seat if there is a current game.
 *
 * A player cannot be on opposing teams at the same time. However it is possible to take both seats on one side.
 *
 */
router.get('/forPosition/:team/:position', function (req, res) {
    var db = req.db;

    games.getCurrentGame(db, (game) => {
        if (game.isSome()) { //There is a current game.

            var g = game.some();
            var oppTeam = g[getOpposingTeam(req.params.team)];
            var filterThese = [oppTeam.offense, oppTeam.defense].filter(s => s != undefined);

            getPossiblePlayerForPosition(db, filterThese, (response) => res.json(response))
        } else {
            res.json({msg: 'No current game present!'});
        }
    });
});


module.exports = router;