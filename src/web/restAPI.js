var Promise = require('bluebird');
var Router = require('express').Router;
var hookAPI = require('../hookAPI');

var singularMap = {
    users: 'user',
    webhooks: 'webhook',
    logEntries: 'logEntry',
    logs: 'log'
};

var trigger = function(event, model, o) {
    if (model === 'webhooks') {
        return hookAPI[event](o);
    } else {
        return Promise.resolve(o);
    }
};

var I = function(x) { return x; };

var filter = function(model) {
    if (model === 'users') {
        return function(user) { 
            delete user.password;
            return user;
        };
    } else {
        return I;
    }
};


module.exports = function(config, db) {
    //This returns a function that given a object or array, will format it for
    //Ember and send it using the given response
    var buildResultSender = function(req, res) {
        //This returns an object wrapping o in either the singular or plural name for
        //model depending on if o is an array.  (This is what Ember expects)
        return function(o) {
            var model = req.params.model;
            req.log.trace(o, 'Got result from db');
            var result = {};

            if (o) {
                if( Object.prototype.toString.call(o) === '[object Array]' ) {
                    result[model] = o.map(filter(model));
                } else {
                    result[singularMap[model]] = filter(model)(o);
                }

                req.log.trace(result, 'Sending to Ember');
                
                res.send(result);
            } else {
                res.sendStatus(404);
            }

            return o;
        };
    };

    var router = Router();

    router.get('/:model/:id', function(req, res) {
        db.findById(req.params.model, req.params.id)
        .then(buildResultSender(req, res));
    });

    router.get('/:model', function(req, res) {
        var resultSender = buildResultSender(req, res);

        if (req.query.ids) {
            var ids = JSON.parse(req.query.ids);
            db.findByIds(req.params.model, ids).then(resultSender);
        } else {
            db.all(req.params.model).then(resultSender);
        }
    });

    router.put('/:model/:id', function(req, res) {
        var model = req.params.model;
        trigger('update', model, req.body[singularMap[model]]).then(function(object) {
            req.log.debug({object: object}, 'Calling update');
            return db.update(model, req.params.id, object);
        }).then(buildResultSender(req, res));
    });

    router.post('/:model', function(req, res) {
        var model = req.params.model;
        trigger('create', model, req.body[singularMap[model]]).then(function(object) {
            return db.insert(model, object);
        }).then(buildResultSender(req, res));
    });

    router.delete('/:model/:id', function(req, res) {
        var model = req.params.model;
        var id = req.params.id;

        trigger('delete',model,id).then(function() {
            return db.delete(model, id);
        }).then(function() {
            res.send({});
        });
    });

    return router;

};
