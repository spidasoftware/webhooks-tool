export default function(testRunner, testName, testData, testFunction) {
    for (var i = 0; i < testData.length; i++) {
        var data=testData[i];

        var name = testName;
        if (data.testName) {
            name += ': ' + data.testName;
        }

        testRunner(name, testFunction(data));
    }
}
