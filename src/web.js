var fs = require('fs');

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser').json();
var bunyanMiddleware = require('bunyan-middleware');
var compress = require('compression');
var enableDestroy = require('server-destroy');

var log = require('./logger').web;
var login = require('./web/login');
var restAPI = require('./web/restAPI');
var hookAPI = require('./hookAPI');
var methodAPI = require('./web/methodAPI');
var callbackHandler = require('./callbackHandler');

module.exports = function (config, db) {
    hookAPI.init(config, db);
    callbackHandler.init(config, db);

    var app = express();
    var httpServer, httpsServer, stopServer;

    app.use(compress());
    app.use(bodyParser);

    //Request logging 
    app.use(bunyanMiddleware({logger: log}));

    //This will allow us to use signed cookies to track which user has logged in
    //The signed cookies essentially become single session login tokens
    app.use(cookieParser(config.cookieSecret, {
        expires: new Date() - 1,
        httpOnly: true
    }));

    //Compiled Ember files
    app.use(express.static(config.appPath + '/dist/'));

    app.post('/callback', callbackHandler.handle);

    //Login module handles login/logout/isLoggedIn
    //Also blocks access to /api if not logged in 
    app.use(login(config, db, log));

    app.get('/api/config', function(req, resp) {
        resp.send(config);
    });

    app.post('/api/config', function(req, resp) {
        config.replace(req.body);
        resp.sendStatus(200);
    });
    
    app.use('/api/method', methodAPI(config, db, function() {
        hookAPI.destroy();
        stopServer()
    }));
    
    //REST API Module handles Ember REST stuff
    app.use('/api', restAPI(config, db));

    //For any unrecgonized paths send the same path as '/' to let ember handle it
    app.use(function(req, res, next) {
        res.sendFile(config.appPath + '/dist/index.html');
    });

    //Error handling
    app.use(function(err, req, res, next) {
        log.error(err);
        res.sendStatus(500);
    });

    if (config.httpPort) {
        httpServer = require('http').createServer(app);
        enableDestroy(httpServer);
        httpServer.listen(config.httpPort);
        log.info('HTTP Server started on ' + config.httpPort);
    }

    if (config.httpsPort) {
        try {
            var key = fs.readFileSync(config.httpsKeyFile);
            var cert = fs.readFileSync(config.httpsCertFile);

            httpsServer = require('https').createServer({
                key: key,
                cert: cert,

                //Below so Chrome does not complain about unsecure signatures
                ciphers: 'ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL',
                honorCipherOrder: true
            }, app);
            enableDestroy(httpsServer);
            httpsServer.listen(config.httpsPort);
            log.info('HTTPS Server started on ' + config.httpsPort);
        } catch(e) {
            log.error(e);
            log.error({keFile: config.httpsKeyFile, certFile: config.httpsCertFile, port: config.httpsPort}, 'Could not start httpsServer');
        }

    }

    //Used to kill the running server so supervisor will automatically restart it
    stopServer = function() {
        log.warn('Stopping Server');

        setTimeout(function() {
            log.warn('Server Force Stopped');
            process.exit(0);
        },20000);

        var onDestroy = function() {
            if (!httpServer && !httpsServer) {
                log.warn('Server Stopped');
                process.exit(0);
            }
        };
        if (httpServer) {
            httpServer.destroy(function() {
                httpServer = false;
                onDestroy();
            });
        }
        if (httpsServer) {
            httpsServer.destroy(function() {
                httpsServer = false;
                onDestroy();
            });
        }
    };

};
