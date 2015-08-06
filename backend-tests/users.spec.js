var frisby = require('frisby');
var eternalLogin = 'LOGIN_TOKEN=s%3A%7B%22user%22%3A%22admin%22%2C%22id%22%3A%22zQZmDrezttF4Z6AV%22%2C%22expires%22%3A32996211657896%2C%22isLoggedIn%22%3Atrue%7D.i1dqpewfkhT5mTzTkA71yaVljvBKW4%2BP%2Fl5qr2%2F15wk';
var testServer = 'http://localhost:8080';

frisby.globalSetup({
    request: {
        headers: { Cookie: eternalLogin }
    }
});

var expectedTestUsers = [
    {"name":"test123","_id":"GdO6VUq8BfkUY7cd"},
    {"name":"test","_id":"w82evYv7gNf20f5G"},
    {"name":"admin","_id":"zQZmDrezttF4Z6AV"}
];

describe('User Tests', function() {
    frisby.create('Get users')
        .get(testServer + '/api/users')
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .expectJSON('users', expectedTestUsers)
        .toss();

    frisby.create('Create user')
        .post(testServer + '/api/users', { user: { name: 'TESTTESTTEST' }}, { json: true })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .afterJSON(function(resp) {
            frisby.create('Config user added')
                .get(testServer + '/api/users')
                .expectStatus(200)
                .expectHeaderContains('content-type', 'application/json')
                .expectJSON('users.?', resp.user)
                .toss();

            frisby.create('Delete user')
                .delete(testServer + '/api/users/' + resp.user._id)
                .expectStatus(200)
                .expectHeaderContains('content-type', 'application/json')
                .expectJSON({})
                .after(function() {
                    frisby.create('User was deleted')
                    .get(testServer + '/api/users')
                    .expectStatus(200)
                    .expectHeaderContains('content-type', 'application/json')
                    .expectJSON('users', expectedTestUsers)
                    .toss();

                })
                .toss();

        })
        .toss();
});





