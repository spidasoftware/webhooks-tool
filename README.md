# Webhooks-tool

The SPIDAMin Webhooks Tool can be used to trigger scripts to run based on SPIDAMin events.  

## Installation

### Prerequisites

The following prerequisites are needed to run the Webhooks Tool.  

* [Node.js](http://nodejs.org/)

### Deployment

* Download the webhooksTool.x.y.z.tar.gz package
* Extract the package with `tar xfv webhooksTool.x.y.z.tar.gz`
* Run `webhooks-tool/start.sh`

## Setup

The webhooks tool server will initially start over HTTP on port 8080.  An initial user is setup with username: admin and password: changemeplease.  To begin setting up the application navigate to http://<servername>:8080 with your browser.  And log in using the default admin credentials.

### Change default admin password

* Click on the Users navigation button in the upper-right
* Click the reset password button next to the admin user
* Enter a new password and click Reset

### Config

![Config Page](doc/config.png)

Update the configurations options as required:

* HTTP Port -- The port to use for HTTP connections (set to 0 to disable HTTP connections)
* HTTPS Port -- The port to use for HTTPS connections (set to 0 to disable HTTPS connections)
* HTTPS Certification File -- The path to a certificate file (required for HTTPS)
* HTTPS Key File -- The path to a key file to go with the above certificate (required for HTTPS)
* Server External URL -- The URL from which SPIDAMin can access this server. (i.e. http://webhookstool.example.com:8080)
* SPIDAMin API Token -- The API token generated by SPIDAMin which will be used to access the Webhook API (User must be a SPIDAMin Admin)
* SPIDAMin Base URL -- The base URL to use to access SPIDAMin (i.e. https://min.example.com)
* SPIDAMin Product -- The product to use when accessing the SPIDAMin webhook server.  (i.e. projectmanager)
* Lease Time (seconds) -- The amount of time a requested webhook should remain on SPIDAMin before needing to be renewed.
* Lease Lead Time (seconds) -- The amount of time prior to the expiration of a webhook before the Webhook Tool will automatically renew it.
* Log Executed Script Output -- Logs script output in both the internal application log and the log created for each webhook.  (Caution: Turning this on can make your database size grow large)
* Log Executed Script Input -- Logs script input in both the interbal application log and the log created for each webhook. (Cattion: Turning this on can make your database size grow large)
* Pass Server Info to Script -- Will include the SPIDAMin API token and base URL that can be used to access SPIDAMin.  (Useful if your scripts will be accessing the SPIDAMin API)

Once config has been updated click Save.  If you have updated the HTTP, HTTPS, or External URL settings a system restart is required.  Click Restart to restart the server.

## Users

![Users Page](doc/users.png)

![Creating a new user](doc/newUser.png)

## Webhooks

![Webhooks Page](doc/webhooks.png)

![Creating a webhook](doc/newWebhook.png)

![Testing an event filter](doc/testEventFilter.png)

![Testing a script](doc/testScript.png)

## Admin

![Admin Page](doc/admin.png)

## Development

### Prerequisites

The following prerequisites are required only for development of the Webhooks Tool.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://www.ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

### Installation

* `git clone https://github.com/spidasoftware/webhooks-tool.git`
* change into the new directory
* `npm install`
* `bower install`

### Running / Development

* `grunt`
* Visit your app at [http://localhost:8080](http://localhost:8080).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `grunt test`
* `ember test --server` -- For interactive ember-only tests

### Building

* `grunt` (development) -- Will build and run the application in development mode
* `grunt package` (production) -- Will create a production 
* `grunt packageNoLibs` -- Will create a production packge which requires running `npm install` to run

### Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](http://www.ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

