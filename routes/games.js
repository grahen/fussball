var express = require('express');
var router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger();

var bus = require('../bus');

var ObjectID = require('mongodb').ObjectID

var stream = 'game';


//Todo do some initialization from the db. find a current game.

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
    return db.collection('game').find().toArray(function (err, items) {
        if (items.length == 0) {
            deliver();
        } else {
            deliver(items[0]);
        }
    });
}

/*
 * GET current ongoing game.
 */
router.get('/current', function (req, res) {
    getGame(req.db, function (items) {
        res.json(items);
    });
});


/*
 * POST to adduser.
 */
router.post('/adduser', function (req, res) {
    var db = req.db;
    db.collection('userlist').insert(req.body, function (err, result) {
        res.send(
            (err === null) ? {msg: ''} : {msg: err}
        );
    });
});

function fireGameCreated(es, callback) {
    es.getEventStream(stream,
        function (err, stream) {
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
 * POST to take position.
 */
router.post('/createGame', function (req, res) {
    logger.debug("Create a new game");

    var es = req.es;
    var db = req.db;

    var game = getGame(req.db, function (game_1) {
        var id = new ObjectID();

        if (game_1 !== undefined && game_1.winner === "") {
            logger.debug("Nope the previous game is still in progress...");
            res.json({
                gameId: game_1.currentId,
                msg: "Game already started"});

        } else {
            logger.debug("Create a new one on this mf: " + JSON.stringify(game_1));
            db.collection('game').update({name: 'theGame'},
                {
                    name: "theGame", //Very static, we'll try to find another way later on.
                    currentId: id.toHexString(),
                    timeStarted: new Date().toISOString(),
                    timeEnded: "",
                    team_one: {},
                    "team_two": {},
                    "score": {
                        "team_one": 0,
                        "team_two": 0
                    },
                    "winner": ""
                },
                upsert=true);
            res.json({newGameId: id.toHexString()}); //Todo better
        }

    });
});


/*
 * POST to take position.
 */
router.post('/takePosition/:gameId/:team/:position/:player', function (req, res) {
    var es = req.es;
    logger.debug("position: " + req.params.team);

    //Todo change the name of the stream id.

    es.getEventStream(stream,
        function (err, stream) {
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

            res.send(
                (err === null) ? {msg: ''} : {msg: err}
            );
        });
});


module.exports = router;