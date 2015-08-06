export default function(toMock) {
    var Mocked = function() {
        Mocked._instances.push(this);
        this._called={_init: [arguments]};
        if (this._init) {
            this._init.apply(this, arguments);
        }
    };

    Mocked._instances=[];

    Mocked.reset = function() {
        this._instances=[];
    };

    Mocked.prototype._registerCall = function(method,args) {
        if (this._called[method]) {
            this._called[method].push(args);
        } else {
            this._called[method] = [args];
        }
    };

    var mockFunction = function(name, func) {
        return function() {
            this._registerCall(name, arguments);
            return func.apply(this, arguments);
        };
    };

    for (var prop in toMock) {
        if (typeof(toMock[prop]) === 'function') {
            Mocked.prototype[prop] = mockFunction(prop, toMock[prop]);
        } else {
            Mocked.prototype[prop] = toMock[prop];
        }
    }

    return Mocked;
}
