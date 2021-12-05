const express = require('express')
const app = express()
const db = require("./database.js")
const bcrypt = require('bcrypt')
const session = require('express-session')

const fileUpload = require('express-fileupload')

const helper = require('./utils/helper')
const { checkAuth, checkIsLogin } = helper; // достаем функцию из helper (через деструтуризацию)

app.use(fileUpload());


app.set('view engine', 'ejs')
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))
app.use(express.static(__dirname + '/public')); // подключение собственных стилей 
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'))
app.use(session({ secret: 'randomly generated secret' }))
app.use(express.urlencoded())

function setCurrentUser(req, res, next) { /// получаем данного юзера 
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

app.get('/', checkAuth, (req, res) => { // вывод всех постов на станицу home
    // res.render('index', { activePage: "home" })
    // console.log(req.session, "req.session.loggedIn");

    var sql = "SELECT * FROM posts"
    db.all(sql, [], (err, rows) => {
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

app.get('/posts', checkAuth, (req, res) => { // вывод только своих постов (сортируем с помощью userId)

    var sql = "SELECT * FROM posts WHERE userId = ?"
    var params = [req.session.userId] // то что будет на месте "?" (получаем данного юзера)

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.render('posts', { activePage: "posts", posts: rows })
    });

})
app.post('/npost', checkAuth, (req, res) => { // сохранение полученных данных из npost
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
    var sql = "INSERT INTO posts (title, userName, category, body, userId) VALUES (?,?,?,?,?)" // добавляет новый пост в таблицу posts
    db.run(sql, data, (err, result) => {
        if (err) {
            res.status(400)
            res.send("database error:" + err.message)
            return;
        }
        res.render('npost_answer', { activePage: "npost", formData: req.body })
    })
})
app.get('/posts/:id/edit', checkAuth, (req, res) => { //отображение страницы редактирования 
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
app.post('/posts/:id/edit', (req, res) => { // запись новой  полученой информации в базу данных 
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
        res.redirect('/posts') // перенаправляем пользователя 
    })
})

app.get('/posts/:id/delete', checkAuth, (req, res) => { // удаление записей из БД с помощью id
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

app.get('/posts/:id', checkAuth, (req, res) => { // отображение страницы с комментариями 
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

app.post('/posts/:id', checkAuth, (req, res) => { // полученые комментарии записываються в БД
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
app.get('/register', checkIsLogin, (req, res) => { res.render('register', { activePage: "register" }) }) // роут формы регистрации 
app.post('/register', (req, res) => { // шифровка и сохранение полученой информации в базу данных 
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
app.get('/login', checkIsLogin, (req, res) => { res.render('login', { activePage: "login", error: "" }) }) // роут формф логина
app.post('/login', (req, res) => { // обработка (сохранение) данных и проверка пароля
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

        bcrypt.compare(req.body.password, row["password"], (err, hashRes) => { // проверка пароля 
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

//checkAuth - пропуск пользователя если тот авторизован 

app.get('/logout', checkAuth, (req, res) => { // проверка авторизирован человек или нет, если да то удаляем пользователя из сесии 
    req.session.userId = null
    req.session.loggedIn = false
    res.redirect("/login")
})

app.get('/profile', checkAuth, (req, res) => { res.render('profile', { activePage: "profile" }) })
app.post('/profile', (req, res) => { // принимаем post-запрос 
    console.log("profile", req.body)
    bcrypt.hash(req.body.password, 10, (err, hash) => { //кодируем пароль пользователя 
        var data = [ // формируем data для запроса 
            req.body.name, // достаем name из body из запроса 
            req.body.email,
            hash
        ]
        var sql = "UPDATE users SET name = COALESCE(?,name), email = COALESCE(?,email), password = COALESCE(?,password) WHERE id = ?" // формируем sql строку 
        db.run(sql, data, (err, result) => { // запрос в базу данных  используя sql строку и data
            if (err) { // обрабатываем ошибку 
                res.status(400) // устанока статуса ошибки 
                res.send("database error:" + err.message) // текст ошибки 
                return;
            }
            res.render('profile_answer', { activePage: "profile", formData: req.body }) // рендерим успешный ответ 
        });
    });
})

app.post('/upload', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.image;

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv('/files/' + req.files[0].name, function(err) {
        if (err)
            return res.status(500).send(err);

        res.send('File uploaded!');
    });
});
const PORT = process.env.PORT || 3000
app.listen(PORT)