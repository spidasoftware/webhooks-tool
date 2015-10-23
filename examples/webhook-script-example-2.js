#!/usr/bin/env node
//NOTE: this script must be executable: chmod +x webhook-script-example-2.js

console.log("Webhook name: " + process.argv[1]);
console.log("Webhook event name: " + process.argv[2]);

var stdin = process.stdin,
    stdout = process.stdout,
    inputChunks = [];

stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
    inputChunks.push(chunk);
});

stdin.on('end', function () {
    var inputJSON = inputChunks.join(),
        parsedData = JSON.parse(inputJSON),
        outputJSON = JSON.stringify(parsedData, null, '    ');
    stdout.write("stdin data:");
    stdout.write(outputJSON);
    stdout.write('\n');
});