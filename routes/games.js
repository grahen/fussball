"use strict";

var express = require('express');
var router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger();

var bus = require('../bus');
var g = require('../impl/game');

var ObjectID = require('mongodb').ObjectID;

var streamName = 'game';

var m = require("monet");

function theGame(evt) {
    logger.debug("here we go: " + JSON.stringify(evt));
}

bus.on('event', theGame);

/*
 * GET current ongoing game.
 */
router.get('/current', (req, res) => g.getGame(req.db, (items) => {
    if (items.some()) {
        res.json(items.some());
    } else {
        res.json({})
    }

}));

function fireGameCreated(es, callback) {
    es.getEventStream(streamName, (err, stream) => {
        stream.addEvent(
            {
                createGame: {
                    gameId: '1234'
                }
            });

        stream.commit();
    });
}

function createGame(db, callback) {
    var id = new ObjectID();
    var g = {
        name: "theGame1", //Very static, we'll try to find another way later on.
        gameId: id.toHexString(),
        timeStarted: '',
        timeEnded: '',
        team_one: {},
        team_two: {},
        score: {
            team_one: 0,
            team_two: 0
        },
        winner: ''
    };

    db.collection('game').update({name: "theGame1"}, g,{upsert:true}, (err) => {
        logger.error(err);

        if (err) throw err;

        callback(g);
    });
}

/*
 * POST to create the game, it is only possible to create a game if there is none running..
 */
router.post('/createGame', (req, res) => {
    logger.debug("Create a new game");

    var es = req.es;
    var db = req.db;

    g.getCurrentGame(req.db, (game) => {

        if (game.isSome() && req.query.force != 'true') {
            logger.debug("Nope the previous game is still in progress...");
            res.status(400).send('Game already started!!');

        } else {
            createGame(db, (newGame) => {
                es.getEventStream(streamName, (err, stream) => {
                    stream.addEvent(
                        {
                            gameCreated: {
                                gameId: newGame.gameId,
                                timeCreated: new Date().toISOString()
                            }
                        });

                    stream.commit();

                    res.json({game: newGame});
                });
            });
        }
    });
});


function updatePosition(team, position, player, game) {
    var g = JSON.parse(JSON.stringify(game));
    g[team][position] = player;
    return g;
}

/**
 *
 * @param game
 * @returns None if it is ok to start, Some(err: String) otherwise.

 */
function okToStart(game) {
    if (game.isSome() && game.some().startTime != '') {
        return m.Maybe.Some('Game already started ');
    }


    //Todo check the seating, it must be either a single game. I.e. at least one player on each team.

}

router.post('/startGame', (req, res) => {
    var es = req.es;
    var db = req.db;
    try {
        g.getCurrentGame(db, (game) => {
            var startedAt = new Date();
            var startIt = okToStart(game).isNone()
            //Validate that we actually can start,
            if (startIt.isNone()) {
                db.collection('game').update({name: "theGame1"}, {$set: {timeStarted: startedAt.toISOString()}}, (err) => {
                    if (err) throw err;

                    g.getCurrentGame(db, (startedGame) => {
                        postEvent(es, {
                            started: startedGame.some()
                        }, () => {
                            res.send({game: startedGame.some()}); //Well well no error handling!
                        });
                    });
                });
            } else {
                res.status(400).send({err: startIt.some()});
            }
        });
    } catch (err) {
        logger.error("Error: " + err);
        res.status(500).send(err);
    }
});



/*
 * POST to take position.
 */
router.post('/:gameId/takePosition', (req, res) => {
    takePos(req, res, req.params.gameId);
    //if (req.query.takePosition) {
    //
    //} else {
    //    res.send({err:"nope"});
    //}
});


function takePos(req, res, gameId) {
    var es = req.es;
    var db = req.db;

    g.getCurrentGame(req.db, (game) => {
        if (game.isSome()) {

            var t = req.body.team;
            var g = updatePosition(t, req.body.position, req.body.player, game.some());

            var new_team = {};
            new_team[t] = g[t];

            db.collection('game').update({name: "theGame1"}, {$set: new_team}, (err) => {
                logger.debug("Db updated! Or not! ?: " + err);

                if (err) throw err;
            });

            es.getEventStream(streamName, (err, stream) => {
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
            res.status(400).send('No game present!');
        }
    });

}

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

    //Todo Refactor callback hell..
    try {
        g.getCurrentGame(req.db, (game) => {
            if (game.isSome() && game.some().timeStarted != '') {

                var score = {};
                score['score.' + t] = 1;

                updateDbScore(score, db,
                    (updatedGame) => {
                        postEvent(es, {
                                scored: {
                                    team: t
                                }
                            }, checkEndGame(updatedGame, res)
                        );
                    }
                )

            } else {
                res.status(400).send('No started game present!');
            }
        });

    } catch (err) {
        res.send(err);
    }
});

/**
 *
 * @param updatedGame
 * @param res
 * @returns {Function}
 */
function checkEndGame(updatedGame, res) {
    return () => {
        if (updatedGame.score.team_one == 10) {
            endGame(db, updatedGame, (endedGame) => {
                res.send(endedGame)
            });

        } else {
            res.send(updatedGame);
        }
    }
}

function getWinner(score) {
    if (score.team_one > score.team_two) {
        return 'team_one';
    }
    return 'team_two';
}

/**
 * Ends the game in the database and in the callback returns the game object in the db.
 * @param db
 * @param gameToEnd
 * @param callback
 */
function endGame(db, gameToEnd, callback) {

    var g = JSON.parse(JSON.stringify(gameToEnd));
    delete g._id;

    var d = new Date().toISOString();
    var w = getWinner(gameToEnd.score);

    g.timeEnded = d;
    g.winner = w;

    db.collection('game').update({name: 'theGame1'},
        {
            $set: {
                timeEnded: d,
                winner: w
            }
        },
        (err) => {
            if (err) {
                logger.error("error updating to end game: " + err);
                throw err;
            }
        });


    db.collection('gameHistory').insert(
        g,
        (err) => {
            if (err) {
                logger.error(err);
                throw err;
            }

            callback(g);
        });
}

function updateDbScore(score, db, callback) {
    db.collection('game').update({name: "theGame1"},
        {$inc: score},
        (err) => {
            if (err) {
                logger.error(err);
                throw err;
            }

            g.getCurrentGame(db, (game) => callback(game.some()));
        });
}

function postEvent(es, evt, doneCommitting) {
    es.getEventStream(streamName, (err, stream) => {
        stream.addEvent(evt);
        stream.commit();
        if (err) throw err;
        doneCommitting()

    });
}

module.exports = router;