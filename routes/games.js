"use strict";

var express = require('express');
var router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger();

var bus = require('../bus');

var ObjectID = require('mongodb').ObjectID;

var stream = 'game';

var m = require("monet");

function theGame(evt) {
    logger.debug("here we go: " + JSON.stringify(evt));
}

bus.on('event', theGame);

/**
 *
 * @param db the db connection, i.e. mongo connection.
 * @param deliver a callback function that is called when there is a result form the database.
 * @returns {null|*}
 */
function getGame(db, deliver) {
    return db.collection('game').find({name: "theGame1"}).toArray((err, items) => {
        if (items.length == 0) {
            deliver(m.Maybe.None());
        } else {
            deliver(m.Maybe.Some(items[0]));
        }
    });
}


function getCurrentGame(db, deliver) {
    getGame(db, (game) => {
        if (game.isSome() && game.some().winner === "") {
            deliver(game);
        } else {
            deliver(m.Maybe.None());
        }
    });
}

/*
 * GET current ongoing game.
 */
router.get('/current', (req, res) => getGame(req.db, (items) => res.json(items)));

/*
 * POST to adduser.
 */
router.post('/adduser', (req, res) => {
    var db = req.db;
    db.collection('userlist').insert(req.body, (err, result) => res.send((err === null) ? {msg: ''} : {msg: err}));
});

function fireGameCreated(es, callback) {
    es.getEventStream(stream, (err, stream) => {
        stream.addEvent(
            {
                createGame: {
                    gameId: '1234'
                }
            });

        stream.commit();
    });
}

/*
 * POST to create the game, it is only possible to create a game if there is none running..
 */
router.post('/createGame', (req, res) => {
    logger.debug("Create a new game");

    var es = req.es;
    var db = req.db;

    getCurrentGame(req.db, (game) => {

        if (game.isSome()) {
            logger.debug("Nope the previous game is still in progress...");
            res.json({
                gameId: game.currentId,
                msg: "Game already started"
            });

        } else {
            var id = new ObjectID();

            logger.debug("Create a new one on this mf: " + JSON.stringify(game));
            var d = new Date().toISOString();
            var g = {
                name: "theGame1", //Very static, we'll try to find another way later on.
                gameId: id.toHexString(),
                timeStarted: d,
                timeEnded: "",
                team_one: {},
                team_two: {},
                score: {
                    team_one: 0,
                    team_two: 0
                },
                winner: ""
            };

            db.collection('game').update({name: "theGame1"}, g, (err) => {
                logger.error(err);
                if (err) throw err;
            });

            //We respond to the client once the event has been committed on the stream.
            es.getEventStream(stream, (err, stream) => {
                stream.addEvent(
                    {
                        gameCreated: {
                            gameId: id.toHexString(),
                            timeStarted: d
                        }
                    });
                stream.commit();
                res.json({game: g});
            });
        }
    });
});


function updatePosition(team, position, player, game) {
    var g = JSON.parse(JSON.stringify(game));
    g[team][position] = player;
    return g;
}

/*
 * POST to take position.
 */
router.post('/takePosition/:gameId/:team/:position/:player', (req, res) => {
    var es = req.es;
    var db = req.db;

    getCurrentGame(req.db, (game) => {
        if (game.isSome()) {

            var t = req.params.team;
            var g = updatePosition(t, req.params.position, req.params.player, game.some());

            var new_team = {};
            new_team[t] = g[t];

            db.collection('game').update({name: "theGame1"}, {$set: new_team}, (err) => {
                logger.debug("Db updated! Or not! ?: " + err);

                if (err) throw err;
            });

            es.getEventStream(stream, (err, stream) => {
                stream.addEvent(
                    {
                        positionTaken: {
                            gameId: req.params.gameId,
                            team: req.params.team,
                            position: req.params.position,
                            player: req.params.player
                        }
                    });

                stream.commit();
                res.send((err === null) ? {game: g} : {game: err});
            });
        } else {
            res.send("No game running!");
        }
    });
});

/*
 * POST to score on the current game if no game is running this event is ignored.
 *
 * If the game is won, that will be sent back to the client, with information on which team that won.
 *
 * The first team to 10 wins.
 */
router.post('/score/:scoredBy', (req, res) => {
    var es = req.es;
    var db = req.db;

    var t = req.params.scoredBy;

    getCurrentGame(req.db, (game) => {
        if (game.isSome()) {

            var score = {};
            score['score.' + t] = 1;

            db.collection('game').update({name: "theGame1"},
                {$inc: score}, (err) => {
                    logger.debug("Db updated! Or not! ?: " + err);

                    if (err) throw err;
                });

            es.getEventStream(stream, (err, stream) => {
                stream.addEvent(
                    {
                        scored: {
                            team: t
                        }
                    });

                stream.commit();


                getCurrentGame(db, (g) => {
                    //Todo resolve winner!!!! If any team has 10 the game is over!


                    res.send((err === null) ? {game: g} : {game: err});
                });

            });
        } else {
            res.send("No game running!");
        }
    });
});


module.exports = router;