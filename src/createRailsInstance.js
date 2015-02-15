
var path = require('path');
var spawn = require('child_process').spawn;
var es = require('event-stream');
var Promise = require('bluebird');

var DOCKER_ENV = {
    DOCKER_CERT_PATH: '/Users/nickmatantsev/.boot2docker/certs/boot2docker-vm',
    DOCKER_HOST: 'tcp://192.168.59.103:2376',
    DOCKER_TLS_VERIFY: '1'
};

module.exports = function createRailsInstance(srcPath) {
    console.log('starting Rails!');

    return new Promise(function (resolve, reject) {
        var startupOutput = '';

        dockerArgs = [
            'run',
            '--rm',
            '--tty',
            '-p', '0.0.0.0:3000:3000',
            '-v', path.resolve(srcPath) + ':/mount/src',
            '-w', '/mount/src',
            'rails',
            'sh', '-c', 'bundle install && bin/rake db:migrate RAILS_ENV=development && rails server -b 0.0.0.0'
        ];

        var isReady = false;
        var child = spawn('/usr/local/bin/docker', dockerArgs, { env: DOCKER_ENV });

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        es.merge(child.stdout, child.stderr).on('data', function (data) {
            if (!isReady) {
                startupOutput += data;

                // match entire startup output for magic string
                if (/WEBrick::HTTPServer#start:/.exec(startupOutput)) {
                    isReady = true;
                    resolve();
                }
            }
        }).pipe(process.stdout);

        child.on('close', function () {
            // ignore exit when already resolved
            if (isReady) {
                return;
            }

            reject('NOPE');
        });
    });
}
