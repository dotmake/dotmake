
var Promise = require('bluebird');

module.exports = function promisifyGulpStream(stream) {
    return new Promise(function (resolve, reject) {
        stream.on('data', function (f) {
            // do nothing, but this helps get the pipe flowing
        });

        stream.on('error', function (e) {
            reject(e);
        });

        stream.on('end', function () {
            resolve(true);
        });
    });
};
