//Web/Login
//Hanles login into front-end
var Router = require('express').Router;
var hash = require('../login').hash;

//Login is handled by a cryptographically signed login token.  When a user logs
//in the server creates a token for the user with name and expiry time and
//signs it.  The client can then use this to authenticate to the server.  This
//has the advantage that no session data is required to be stored server side,
//and client logins will survive server restart.
//
//A valid login token is required to access anything under the /api path

//Users will remain logged in for this long before they must renew their login
//token
var LOGIN_TIME = 30 * 60 * 1000; //30 Minutes

//Returns the login token in req if it is valid and exists; false otherwise
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

//Creates a signed login token for user in res
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

    //Prevents access to /api and below if the user is not logged in
    router.use('/api', function(req, resp, next) {
        if (validLoginToken(req)) {
            next();
        } else {
            resp.sendStatus(403);
        }
    });

    //Logs in the user, adds login token to resp if username and password are
    //valid
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

    //Logs out the user
    router.get('/logout', function(req, resp) {
        resp.clearCookie('LOGIN_TOKEN');
        resp.sendStatus(200);
    });

    //Used by the front-end to determine if the user is logged in
    router.get('/isLoggedIn', function(req, resp) {
        var token = validLoginToken(req);

        if (token) {
            resp.send({ login: token });
        } else {
            resp.send({ login: { isLoggedIn: false }});
        }
    });

    //Create a new login token for a currently logged in user
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

    return router;
};
    
