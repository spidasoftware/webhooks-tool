//Handles hashing of passwords
var Hashes = require('jshashes');

var passwordHash = new Hashes.SHA512();
//Salt is used to prevent rainbow attacks
var salt = 'SodiumChloride';

module.exports = {
    hash: function(s) {
        return passwordHash.hex(s + salt);
    }
};
