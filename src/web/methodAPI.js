//Method API
//Handles non-REST actions the client may perform.  Mounted under /api/method

var Router = require('express').Router;
var multer = require('multer');
var Promise = require('bluebird');
var zlib = Promise.promisifyAll(require('zlib'));
var tar = require('tar-fs');

var importExport = require('../importExport');
var hash = require('../login').hash;
var hookAPI = require('../hookAPI');

var fileUpload = multer({
    storage: multer.memoryStorage()
});

var callbackHandler = require('../callbackHandler');

//Used to generate a nice timestamp for the exported files
var pad2 = function(x) {
    return (x<10 ? '0' : '') + x;
}
var timestamp = function() {
    var d = new Date();
    return '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes());
}

module.exports = function(config, db, stopServer) {
    importExport.init(config, db);

    var router = Router();

    //Returns a unique instanceId (the process id) for this server instance
    //used by the client during a restart to determine if the server has
    //restarted.
    router.get('/instanceId', function(req, resp) {
        resp.send({instanceId: process.pid});
    });

    //Send the current instanceId and restart.  The client should wait until a
    //successful response from a call to /instanceId with and different
    //instanceId before proceeding
    router.get('/restart', function(req, resp) {
        resp.send({instanceId: process.pid});
        setTimeout(stopServer, 1000);
    });

    //Executes a scipt attached to a webhook with test data
    router.post('/testScript', function(req, res) {
        callbackHandler.executeChildProcess({
            stdin: req.body.stdin,
            cmd: req.body.script,
            args: [req.body.name, req.body.eventName]
        }, req.log).then(function(result) {
            result.scriptRan = true;
            res.send(result);
        }).catch(function(err) {
            req.log.warn(err, 'Unable to run test script');
            res.send({
                scriptRan: false,
                message: err.display
            });
        });
    });

    //Create a export file
    router.get('/export/:type', function(req, res) {
        var type = req.params.type;

        //Get export data
        importExport.exportGroup(type).then(function(result) {
            //And compressit
            return zlib.gzipAsync(result);    
        }).then(function(compressed) {
            //Then send it to the user
            res.set('Content-Type','application/octet-stream');
            res.set('Content-Disposition','attachment; filename="webhookTool-export-' + type + '-' + timestamp() + '.json.gz"');
            res.send(compressed);
        });
    });

    //Import the export file created above
    router.post('/import/:type', fileUpload.single('import'), function(req, res) {
        var type = req.params.type;

        req.log.info({type: type}, 'File upload');
        //If we got a file
        if (req.file) {
            //Decompress it
            zlib.gunzipAsync(req.file.buffer).then(function(data) {
                //The import it
                return importExport.importGroup(type,data);
            }).then(function() {
                //Let the user know it worked
                res.send({success: true});
            }).catch(function(e) {
                //Handle import failure
                req.log.warn(e,'File upload failed')
                res.send({
                    success: false,
                    message: e.message
                });
            });
        } else {
            req.log.warn('File upload failed, no file sent');
            return res.send({
                success: false,
                message: 'Missing file'
            });
        }
    });

    //Tar and gzip logs
    router.get('/logs', function (req, res) {
        var gzip = zlib.createGzip();
        res.set('Content-Type','application/octet-stream');
        res.set('Content-Disposition','attachment; filename="webhookToolLogs-' + timestamp() +'.tar.gz"');
        tar.pack('./logs').pipe(gzip).pipe(res);
    });

    //Reset a user's password
    router.post('/resetPassword', function(req, res) {
        var userId = req.body.userId;
        var password = req.body.password;

        if (password && password.length >=8) {
            db.findById('users', userId).then(function(user) {
                if (user) {
                    user.password = hash(password);
                    db.update('users', userId, user).then(function() {
                        res.sendStatus(200);
                    });
                } else {
                    res.sendStatus(404);
                }
            });
        } else {
            res.sendStatus(422);
        }

    });

    //Called to resync the webhooks with Min
    router.get('/resync', function(req, res) {
        hookAPI.refresh().then(function() {
            res.sendStatus(200);
        });
    });

    return router;
}
   
