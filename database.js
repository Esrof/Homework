var sqlite3 = require('sqlite3').verbose()
    //PRAGMA foreign_keys;
var DBSOURCE = "./db/db.sqlite"

var db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        //Cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to the SQLite database')
        db.run(`CREATE TABLE posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title text,
			author text,
			category text,
			body text
			)`,
            (err) => {
                if (err) {
                    console.log("Table posts id already created:" + err.message)
                } else {
                    console.log("Table posts is created")
                }
            });
        db.run(`CREATE TABLE comm (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			authorc TEXT,
			comment TEXT,
			id_post INTEGER
			)`,
            (err) => {
                if (err) {
                    console.log("Table comm id already created:" + err.message)
                } else {
                    console.log("Table comm is created")
                }
            });
        db.run(`CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name text,
			email text UNIQUE,
			password text,
			failed_logins INTEGER,
			CONSTRAINT email_unique UNIQUE (email)
			)`,
            (err) => {
                if (err) {
                    console.log("Table users id already created:" + err.message)
                } else {
                    console.log("Table users is created")
                }
            });

    }
});
module.exports = db