"use strict";

var express = require('express');
var router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger();

var bus = require('../bus');
var g = require('../impl/game');

var ObjectID = require('mongodb').ObjectID;

var streamName = 'game';

var io;

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


function createGame(db, callback) {
    var id = new ObjectID();
    var g = {
        name: "theGame1", //Very static, we'll try to find another way later on.
        gameId: id.toHexString(),
        timeStarted: '',
        timeEnded: '',
        team_one: {
            offense: "",
            defense: ""
        },
        team_two: {
            offense: "",
            defense: ""
        },
        score: {
            team_one: 0,
            team_two: 0
        },
        winner: ''
    };

    db.collection('game').update({name: "theGame1"}, g, {upsert: true}, (err) => {
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
                    postGameToClients(newGame);
                    res.json(newGame);
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

function isTeamsOk(t1, t2) {
    return t1.offense != t2.offense && t1.offense != t2.defense && t1.defense != t2.offense && t1.defense != t2.defense
        && t1.offense != "" && t1.defense != "" && t2.offense != "" && t2.defense != "";
}

/**
 *
 * @param maybeGame
 * @returns None if it is ok to start, Some(err: String) otherwise.

 */
function okToStart(maybeGame) {

    var ret = m.Maybe.None();
    if (maybeGame.isSome()) {
        var game = maybeGame.some();
        if ((game.timeStarted != "")) {
            ret = m.Maybe.Some('Game already started ');
        } else if (!isTeamsOk(game.team_one, game.team_two)) {
            ret = m.Maybe.Some('A player cannot be on both teams, and there must be at least one player on each team');
        }
    }

    return ret;
}

router.post('/:gameId/startGame', (req, res) => {
    var es = req.es;
    var db = req.db;

    //Todo do something with the id.

    try {
        g.getCurrentGame(db, (game) => {
            var startedAt = new Date();
            var startIt = okToStart(game);
            //Validate that we actually can start,
            if (startIt.isNone()) {
                db.collection('game').update({name: "theGame1"}, {$set: {timeStarted: startedAt.toISOString()}}, (err) => {
                    if (err) throw err;

                    g.getCurrentGame(db, (startedGame) => {
                        postEvent(es, {
                            started: startedGame.some()
                        }, () => {
                            postGameToClients(startedGame.some());
                            res.send(startedGame.some()); //Well well no error handling!
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
                if (err === null) {
                    postGameToClients(g);
                    res.send(g);
                } else {
                    rest.send(err);
                }
            });
        } else {
            res.status(400).send('No game present!');
        }
    });

});

/**
 * POST to score on the current game if no game is running this event is ignored.
 */
function createScoreEvent(team, count, type) {
    if (type == 'C') {
        return {corrected: {team: team, count: count}}
    } else {
        return {scored: {team: team}}
    }
}

function validateScore(game, team, count) {
    if (game.timeStarted == '') {
        return m.Validation.fail({err: "No started game present"});
    }

    if ((game.score[team] + count) < 0) {
        return m.Validation.fail({err: "Score cannot be negative"});
    }

    return m.Validation.success();
}

router.post('/score/:scoreType/:targetTeam', (req, res) => {
    var es = req.es;
    var db = req.db;

    var team = req.params.targetTeam;
    var type = req.params.scoreType;
    var count = req.body.count;

    logger.debug("Score for " + team + " c: " + count + " type: " + type);

    try {
        g.getCurrentGame(req.db, (game) => {

            var validated = game.map((g) => {
                return validateScore(g, team, count);
            }).orSome(m.Validation.fail({err: 'No started game present!'}));

            validated.cata((err) => res.status(400).send(err), (data) => {
                var score = {};
                score['score.' + team] = count; //Inc is done in db call, if this one is negative it's decreased in db.

                updateDbScore(score, db, (updatedGame) => {
                    postEvent(es, createScoreEvent(team, count, type),
                        () => {
                            postGameToClients(updatedGame);
                            res.send(updatedGame);
                        });
                })
            });
        });

    } catch (err) {
        res.send(err);
    }
});

/*
 * POST to end the game
 */
router.post('/:gameId/endGame', (req, res) => {
    logger.debug("End game  " + req.params.gameId);

    var es = req.es;
    var db = req.db;

    g.getCurrentGame(req.db, (game) => {

        var notOkToEnd = isOkToEnd(game);
        if (notOkToEnd.isSome()) {
            logger.debug("Not ok to end, " + notOkToEnd.some());
            res.status(400).send(notOkToEnd.some());

        } else {
            endGame(db, game.some(), (endedGame) => {
                postEvent(es, {gameEnded: {gameId: req.params.gameId}}, () => {
                    postGameToClients(endedGame);
                    res.send(endedGame)
                });
            });
        }
    });
});
/**
 * Validates that it is ok to end. A game can only be ended if it has been started and if it hasn't been ended already
 * and that the scores of the team differs..
 *
 * @param game
 */
function isOkToEnd(game) {

    if (game.isNone() || game.some().timeStarted == '') {
        return m.Maybe.Some({err: "Game hasn't been started yet"});
    }

    var g = game.some();
    if (g.score.team_one == g.score.team_two) {
        return m.Maybe.Some({err: "Same score on both teams, no winner"});
    }

    if (g.timeEnded != '') {
        return m.Maybe.Some({err: "Game already ended"});
    }

    return m.Maybe.None();
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

function postGameToClients(game) {
    logger.debug("Pushing to clients...:" + game);
    io.sockets.emit('gameUpdated', game);
}


module.exports = function (injectedIo) {

    io = injectedIo;
    return router;
};