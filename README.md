#Database setup

    mongod --dbpath ./data (or full path)

    mongo

    use nodetest2

    db.userlist.insert({'username' : 'test1','email' : 'a@b.com','fullname' : 'Bob Smith'})

# Patch bin/www
    ...
    var server = http.createServer(app);

    var io = app.io;    
    io.attach(server);

