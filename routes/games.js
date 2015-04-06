var express = require('express');
var router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger();

var evts = require('events');
var bus = new evts.EventEmitter();


function theGame(evt) {
    console.log(evt);

}

bus.on('event', theGame);


/*
 * GET current ongoing game.
 */
router.get('/current', function (req, res) {
    var db = req.db;
    db.collection('game').find().toArray(function (err, items) {
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

/*
 * POST to take position.
 */
router.post('/takePosition/:team/:position/:player', function (req, res) {


    var es = req.es;
    logger.debug("position: " + req.params.team);

    //Todo change the name of the stream id.

    es.getEventStream('streamId',
        function (err, stream) {
            stream.addEvent(
                {
                    positionTaken: {
                        team: req.params.team,
                        position: req.params.position,
                        player: req.params.player
                    }
                });

            stream.commit();


            //stream.commit(function (err, stream) {
            //    console.log(stream.eventsToDispatch); // this is an array containing all added events in this commit.
            //});
            res.send(
                (err === null) ? { msg: '' } : { msg: err }
            );

        });


});

module.exports = router;