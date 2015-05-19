var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index2', { title: 'Express' });
});


router.get('/views/games-list.html', (req, res, next) => {
    res.render('games-list', { title: 'Express' });
});


router.get('/views/users-list.html', (req, res, next) => {
    res.render('users-list', { title: 'Express' });
});

module.exports = router;
