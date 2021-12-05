function newPostSubmit(event) {
    console.log(event)
}

function checkAuth(req, res, next) { // редирект на страничку /login если пользователь не логинился 
    if (req.session.loggedIn) {
        return next()
    } else {
        res.redirect('/login')
    }
}


function checkIsLogin(req, res, next) { // редирект на страничку /(Home) если пользователь уже залогинился (не попадет на логин)
    if (!req.session.loggedIn) {
        return next()
    } else {
        res.redirect('/')
    }
}


module.exports = { // передача переменных на экспорт 
    newPostSubmit,
    checkAuth,
    checkIsLogin,
    uploadFile,
}