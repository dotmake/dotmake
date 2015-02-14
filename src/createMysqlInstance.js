
var spawn = require('child_process').spawn;
var es = require('event-stream');
var Promise = require('bluebird');

var DOCKER_ENV = {
    DOCKER_CERT_PATH: '/Users/nickmatantsev/.boot2docker/certs/boot2docker-vm',
    DOCKER_HOST: 'tcp://192.168.59.103:2376',
    DOCKER_TLS_VERIFY: '1'
};

module.exports = function createMysqlInstance() {
    console.log('starting database!');

    return new Promise(function (resolve, reject) {
        var startupOutput = '';

        dockerArgs = [
            'run',
            '--rm',
            '--tty',
            // '-p', '0.0.0.0:3306:3306',
            '-e', 'MYSQL_ROOT_PASSWORD=root',
            'mysql'
        ];

        var isReady = false;
        var child = spawn('/usr/local/bin/docker', dockerArgs, { env: DOCKER_ENV });

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        es.merge(child.stdout, child.stderr).on('data', function (data) {
            if (!isReady) {
                startupOutput += data;

                // match entire startup output for magic string
                if (/mysqld: ready for connections/.exec(startupOutput)) {
                    isReady = true;
                    resolve();
                }
            }
        });

        child.on('close', function () {
            // ignore exit when already resolved
            if (isReady) {
                return;
            }

            reject(startupOutput);
        });
    });
}
