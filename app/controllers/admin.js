import Ember from 'ember';
import Restart from 'webhooks-tool/mixins/restart';
import config from 'webhooks-tool/config/environment';

export default Ember.Controller.extend(Restart,{
    actions: {
        import: function(type) {
            this.set('selectingFile',true);
            this.set('fileType',type);
        },
        fileSelected: function(file) {
            var self = this;
            var type = this.get('fileType');

            this.set('uploading',true);
            this.set('uploadFailed',false);
            this.set('selectingFile',false);

            var formData = new FormData();
            formData.append('import',file);

            this.send('startWorking','Importing ' + type + ' from ' + file.name + '...');
            Ember.$.ajax(config.baseURL + 'api/method/import/' + type, {
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json'
            }).then(function(result) {
                Ember.run(function() {
                    if (result.success) {
                        //Clear out the local store
                        if (type === 'everything') {
                            self.store.unloadAll();
                        } else if (type !== 'config') {
                            self.store.unloadAll(type);
                        }
                    } else {
                        self.set('uploadFailed',true);
                        self.set('errorMessage',result.message);
                    }
                    self.send('stopWorking');
                });
            }, function() {
                Ember.run(function() {
                    self.send('stopWorking');
                    self.set('uploadFailed', true);
                    self.set('errorMessage', 'Unable to upload file');
                });
            });
        },
        restart: function() {
            var self=this;

            this.send('startWorking','Restarting...');
            this.restart().then(function() {
                self.send('stopWorking');
            });
        },

        resync: function() {
            this.send('startWorking','Syncing...');
            var self = this;
            Ember.$.ajax(config.baseURL + 'api/method/resync').then(function() {
                Ember.run(function() {
                    self.send('stopWorking');
                });
            });
        }
    }
});
