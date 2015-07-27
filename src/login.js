var Hashes = require('jshashes');

var passwordHash = new Hashes.SHA512();
var salt = 'SodiumChloride';

module.exports = {
    hash: function(s) {
        return passwordHash.hex(s + salt);
    }
};
