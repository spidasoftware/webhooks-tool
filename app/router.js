import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('users');
  this.route('webhooks', function() {
    this.route('new');
  });
  this.route('config');
  this.route('webhook', { path: '/webhook/:id' });
  this.route('admin');
});

export default Router;
