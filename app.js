const express = require('express')
const app = express()
const db = require("./database.js")
const bcrypt = require('bcrypt')
const session = require('express-session')

const helper = require('./utils/helper')
const { checkAuth, checkIsLogin } = helper; // достаем функцию из helper (через деструтуризацию)


app.set('view engine', 'ejs')
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'))
app.use(session({ secret: 'randomly generated secret' }))
app.use(express.urlencoded())

function setCurrentUser(req, res, next) {
    if (req.session.loggedIn) {
        var sql = "SELECT * FROM users WHERE id = ?"
        var params = [req.session.userId]
        db.get(sql, params, (err, row) => {
            if (row !== undefined) { res.locals.currentUser = row }
            return next()
        });
    } else { return next() }
}
app.use(setCurrentUser)

//checkAuth - проверка зарегистрированогог пользователя

app.get('/', checkAuth, (req, res) => { // редирект на страничку /login если пользователь не логинился 
    // res.render('index', { activePage: "home" })
    // console.log(req.session, "req.session.loggedIn");

    var sql = "SELECT * FROM posts WHERE userId = ?"
    var params = [req.session.userId] // то что будет на месте "?"
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.render('index', { activePage: "home", posts: rows })
    });

})

app.get('/contact', checkAuth, (req, res) => { res.render('contact', { activePage: "contact" }) })
app.get('/npost', checkAuth, (req, res) => { res.render('npost', { activePage: "npost" }) })
app.post('/contact', checkAuth, (req, res) => { res.render('contact_answer', { activePage: "contact", formData: req.body }) })
app.get('/posts', checkAuth, (req, res) => {
    var sql = "SELECT * FROM posts"
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.render('posts', { activePage: "posts", posts: rows })
    });
})
app.post('/npost', checkAuth, (req, res) => {
    var data = [
        req.body.title,
        req.session.userName,
        req.body.category,
        req.body.body,
        req.session.userId
    ]
    if (!req.session.userName || !req.session.userId) // не создавать посты без Username и UserId 
    {
        res.status(400)
        res.send("UserName UserId not found in request body")
        return;
    }
    var sql = "INSERT INTO posts (title, userName, category, body, userId) VALUES (?,?,?,?,?)"
    db.run(sql, data, (err, result) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.render('npost_answer', { activePage: "npost", formData: req.body })
    })
})
app.get('/posts/:id/edit', checkAuth, (req, res) => {
    var sql = "SELECT * FROM posts WHERE id = ?"
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.render('edit_post', { post: row, activePage: "posts" })
    })
})
app.post('/posts/:id/edit', (req, res) => {
    var sql = "UPDATE posts SET title = COALESCE(?,title), userName = COALESCE(?,userName), category = COALESCE(?,category), body = COALESCE(?,body) WHERE id = ?"
    var data = [
        req.body.title,
        req.body.userName,
        req.body.category,
        req.body.body,
        req.params.id
    ]
    db.run(sql, data, (err, result) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.redirect('/posts')
    })
})

app.get('/posts/:id/delete', checkAuth, (req, res) => {
    var sql = "DELETE FROM posts WHERE id = ?"
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.redirect('/posts')
    });
})

app.get('/posts/:id', checkAuth, (req, res) => {
    var sql_posts = "SELECT * FROM posts WHERE id = ?"
    var sql_comm = "SELECT * FROM comm WHERE id_post = ?"
    var params = [req.params.id]
    var data = {
        activePage: 'posts',
        post: null,
        comm: null
    }
    db.all(sql_posts, params, (err, row) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        data.post = row[0];
    });
    db.all(sql_comm, params, (err, row) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        data.comm = row;
        res.render('show_post', data);
    });
})
app.post('/posts/:id', checkAuth, (req, res) => {
    var sql = "INSERT INTO comm (userNamec, comment, id_post) VALUES (?,?,?)"
    var data = [
        req.body.userNamec,
        req.body.comment,
        req.params.id
    ]
    db.run(sql, data, (err, result) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.redirect('/posts/' + req.params.id)
    })
})
app.get('/register', checkIsLogin, (req, res) => { res.render('register', { activePage: "register" }) })
app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        var data = [
            req.body.name,
            req.body.email,
            hash
        ]
        var sql = "INSERT INTO users (name, email, password,failed_logins) VALUES (?,?,?,0)"
        db.run(sql, data, (err, result) => {
            if (err) {
                res.status(400)
                res.send("database error:" + err.message)
                return;
            }
            res.render('register_answer', { activePage: "register", formData: req.body })
        });
    });
})
app.get('/login', checkIsLogin, (req, res) => { res.render('login', { activePage: "login", error: "" }) })
app.post('/login', (req, res) => {
    var sql = "SELECT * FROM users WHERE email = ?"
    var params = [req.body.email]
    var error = ""
    db.get(sql, params, (err, row) => {
        if (err) { error = err.message }


        if (row === undefined) {
            error = "Wrong email or password";
        }
        var flcheck = row && row["failed_logins"]


        if (error !== "") {
            res.render('login', { activePage: "login", error: error })
            return;
        }

        bcrypt.compare(req.body.password, row["password"], (err, hashRes) => {
            if (hashRes === false) {
                if (error === "") { flcheck = flcheck + 1; }
                //flcheck = 0;
                console.log(flcheck);
                var flog = "UPDATE users SET failed_logins = ? WHERE email = ?"
                var fl_q = [req.body.failed_logins = flcheck, req.body.email]
                db.run(flog, fl_q, (err1, result) => {
                    if (err1) {
                        res.status(400);
                        res.send("database error:" + err.message);
                        return;
                    }
                })
                error = "Wrong email or password"
                if (flcheck > 3) { error = "Your account is blocked" }
                res.render('login', { activePage: "login", error: error })
                return;
            }
            if (flcheck <= 3) {
                flcheck = 0;
                req.session.userId = row["id"]
                req.session.loggedIn = true
                req.session.userName = row["name"] // добавляем userName в сессию для использования в post запросов 
                res.redirect("/")
            } else {
                error = "Your account is blocked"
                res.render('login', { activePage: "login", error: error })
                return;
            }
        });
    })
})
app.get('/logout', checkAuth, (req, res) => {
    req.session.userId = null
    req.session.loggedIn = false
    res.redirect("/login")
})

app.get('/profile', checkAuth, (req, res) => { res.render('profile', { activePage: "profile" }) })
app.post('/profile', (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        var data = [
            req.body.name,
            req.body.email,
            hash
        ]
        var sql = "UPDATE users SET name = COALESCE(?,name), email = COALESCE(?,email), password = COALESCE(?,password) WHERE id = ?"
        db.run(sql, data, (err, result) => {
            if (err) {
                res.status(400)
                res.send("database error:" + err.message)
                return;
            }
            res.render('profile_answer', { activePage: "profile", formData: req.body })
        });
    });
})
const PORT = process.env.PORT || 3000
app.listen(PORT)