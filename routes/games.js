var express = require('express');
var router = express.Router();


/*
 * GET current ongoing game.
 */
router.get('/current', function(req, res) {
    var db = req.db;
    db.collection('game').find().toArray(function (err, items) {
        res.json(items);
    });
});


/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
    var db = req.db;
    db.collection('userlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});