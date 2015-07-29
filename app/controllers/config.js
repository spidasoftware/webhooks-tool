import Ember from 'ember';
import Restart from 'webhooks-tool/mixins/restart';

var propertyMap = [
    {
        key: 'httpPort',
        name: 'HTTP Port',
        description: 'The port with which to start this server (for HTTP). Leave blank or enter 0 to disbale HTTP.',
        requiresRestart: true,
        type: 'number',
    },
    {
        key: 'httpsPort',
        name: 'HTTPS Port',
        description: 'The port with which to start this server (for HTTPS).  Leave blank or enter 0 to disable HTTPS.',
        requiresRestart: true,
        type: 'number'
    },
    {
        key: 'httpsCertFile',
        name: 'HTTPS Certificate File',
        description: 'The Certificate needed to enable HTTPS encryption',
        requiresRestart: true,
        type: 'string',
    },
    {
        key: 'httpsKeyFile',
        name: 'HTTPS Key File',
        description: 'The Key needed to enable HTTPS encryption',
        requiresRestart: true,
        type: 'string',
    },
    {
        key: 'externalServerUrl',
        name: 'Server External URL',
        description: 'The External URL Server name from which this server is visible to SPIDAMin.',
        requiresRestart: true,
        type: 'string'
    },
    {
        key: 'apiToken',
        name: 'SPIDAMin API Token',
        description: 'API Token used to connect to SPIDAMin',
        requiresRestart: false,
        type: 'string'
    },
    {
        key: 'minBaseUrl',
        name: 'SPIDAMin Base URL',
        description: 'Base URL of SPIDAMin server',
        requiresRestart: false,
        type: 'string'
    },
    {
        key: 'product',
        name: 'SPIDAMIn Product',
        description: 'SPIDAMin Product to use to register webhooks',
        requiresRestart: false,
        type: 'string'
    },
    {
        key: 'leaseTime',
        name: 'Lease Time (seconds)',
        description: 'Webhook Lease Time (time before renew required)',
        requiresRestart: false,
        type: 'number'
    },
    {
        key: 'leaseLeadTime',
        name: 'Lease Lead Time (seconds)',
        description: 'Time before a webhook expires to renew',
        requiresRestart: false,
        type: 'number'
    },
    {
        key: 'logScriptOut',
        name: 'Log Executed Script Output',
        description: 'Includes script output in webhook log',
        requiresRestart: false,
        type: 'boolean'
    },
    {
        key: 'logCallbackData',
        name: 'Log Executed Script Input',
        description: 'Includes script input in webhook log',
        requiresRestart: false,
        type: 'boolean'
    },
    {
        key: 'passServerInfo',
        name: 'Pass Server Info to Script',
        description: 'Pass the apiToken and SpidaMin Base URL to executed scripts',
        requiresRestart: false,
        type: 'boolean'
    }
];

//This proxies it's value property to the value of the property in the config
//object with the same key (Basically maps [{key: key, value: value}] to {key: value} )
var ConfigPropertyProxy = Ember.Object.extend({
    isDirty: false,

    value: Ember.computed('key','config', {
        get: function(key) {
            key = this.get('key');
            var config = this.get('config');

            return config[key];
        },
        set: function(key, value, oValue) {
            key = this.get('key');
            var config = this.get('config');

            if (oValue !== value) {
                this.set('isDirty',true);
                var type = this.get('type');
                if (type === 'number') {
                    config[key] = Number(value);
                } else if (type === 'boolean') {
                    config[key] = !!value;
                } else {
                    config[key] = value;
                }
            }

            return config[key];
        }
    }),

    isBoolean: function() {
        return this.get('type') === 'boolean';
    }.property('type')
});


export default Ember.Controller.extend(Restart,{
    dirtyConfig: function() {
        return this.get('configProperties').isAny('isDirty');
    }.property('configProperties.@each.isDirty'),

    configProperties: function() {
        var config = this.get('model');

        return propertyMap.map(function(property) {
            var proxy = ConfigPropertyProxy.create(property);
            proxy.set('config',config);
            return proxy;
        });
    }.property('model'),

    actions: {
        save: function() {
            var self = this;

            this.send('startWorking','Saving config...');
            Ember.$.ajax({
                url: '/api/config',
                data: JSON.stringify(this.get('model')),
                method: 'POST',
                processData: false,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function() {
                self.get('configProperties').forEach(function(property) {
                    property.set('isDirty', false);
                });
                self.send('stopWorking');
            },function() {
                //Handle Error Here
                self.send('stopWorking');
            });
        },

        restart: function() {
            var self=this;

            this.send('startWorking','Restarting...');
            this.restart().then(function() {
                self.send('stopWorking');
            });
        }
    }
});
