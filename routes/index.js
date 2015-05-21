var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('layout');
});


router.get('/views/:view', (req, res, next) => {
    console.log(req.params.view);
    res.render(req.params.view);
});


router.get('/views/users-list.html', (req, res, next) => {
    res.render('users-list');
});

module.exports = router;
