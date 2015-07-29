var Router = require('express').Router;
var hash = require('../login').hash;

var LOGIN_TIME = 30 * 60 * 1000; //30 Minutes

var validLoginToken = function(req) {
    var loginToken = req.signedCookies.LOGIN_TOKEN;
    if (loginToken) {
        loginToken = JSON.parse(loginToken);
    }

    if (loginToken && loginToken.isLoggedIn && loginToken.expires > Date.now()) {
        return loginToken;
    } else {
        return false;
    }
};

var setLoginToken = function(user, res) {
    var loginToken = {
        user: user.name,
        id: user._id || user.id,
        expires: Date.now() + LOGIN_TIME,
        isLoggedIn: true
    };
    res.cookie('LOGIN_TOKEN', JSON.stringify(loginToken), {signed: true});

    return loginToken;
};


module.exports = function(config, db, log) {
    var router = Router();

    router.post('/login', function(req, resp) {
        db.loginUser(req.body.name, hash(req.body.password)).then(function(user) {
            var result = { success: false };

            if (user) {
                result.success = true;
                result.login = setLoginToken(user, resp);

                log.info('User: ' + user.name + ' successfully logged in.');
            } else {
                resp.clearCookie('LOGIN_TOKEN');

                log.warn({body: req.body}, 'Invalid login');
            }

            resp.send(result);
        }).catch(function(err) {
            log.warn(err);
            resp.send({ success: false });
        });
    });

    router.get('/logout', function(req, resp) {
        resp.clearCookie('LOGIN_TOKEN');
        resp.sendStatus(200);
    });

    router.get('/isLoggedIn', function(req, resp) {
        var token = validLoginToken(req);

        if (token) {
            resp.send({ login: token });
        } else {
            resp.send({ login: { isLoggedIn: false }});
        }
    });

    router.get('/renewLogin', function(req, resp) {
        var loginToken = validLoginToken(req);
        if (loginToken) {
            resp.send({
                success: true,
                login: setLoginToken(loginToken, resp)
            });
        } else {
            resp.sendStatus(403);
        }
    });

    //User must be logged in to access the REST api
    router.use('/api', function(req, resp, next) {
        if (validLoginToken(req)) {
            next();
        } else {
            resp.sendStatus(403);
        }
    });

    return router;
};
    
