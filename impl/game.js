var m = require('monet');

/**
 * Get hold of the current game, that is if there is one running. If not None is returned in the callback.
 * @param db
 * @param callback
 */
function getCurrentGame(db, callback) {
    getGame(db, (game) => {
        if (game.isSome() && game.some().winner === "") {
            callback(game);
        } else {
            callback(m.Maybe.None());
        }
    });
};


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


exports.getGame = getGame;
exports.getCurrentGame = getCurrentGame;
