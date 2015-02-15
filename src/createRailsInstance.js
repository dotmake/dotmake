
var path = require('path');
var spawn = require('child_process').spawn;
var es = require('event-stream');
var MD5 = require('MD5');
var tar = require('tar-stream');
var Promise = require('bluebird');

var fs = require("fs");

var DOCKER_ENV = {
    DOCKER_CERT_PATH: '/Users/nickmatantsev/.boot2docker/certs/boot2docker-vm',
    DOCKER_HOST: 'tcp://192.168.59.103:2376',
    DOCKER_TLS_VERIFY: '1'
};

function createBundleCacheImage(absPath, imageName, gemfileData, gemfileLockData) {
    return new Promise(function (resolve, reject) {
        console.log('building image: ' + imageName);

        var buildArgs = [
            'build',
            '--force-rm',
            '-t', imageName,
            '-'
        ];

        var buildCommands = [
            'FROM dotmake-pre-rails',
            'ADD Gemfile /tmp/bundle-staging/',
            'ADD Gemfile.lock /tmp/bundle-staging/',
            'WORKDIR /tmp/bundle-staging/',
            'RUN bundle install'
        ];

        var child = spawn('/usr/local/bin/docker', buildArgs, { env: DOCKER_ENV });

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        var contextTar = tar.pack();
        contextTar.pipe(child.stdin);

        contextTar.entry({ name: 'Dockerfile' }, buildCommands.join("\n"));
        contextTar.entry({ name: 'Gemfile' }, gemfileData);
        contextTar.entry({ name: 'Gemfile.lock' }, gemfileLockData);
        contextTar.finalize();

        es.merge(child.stdout, child.stderr).pipe(process.stdout);

        child.on('close', function (code) {
            if (code !== 0) {
                reject(new Error('failed to build bundler cache image; docker error ' + code));
            }

            resolve(imageName);
        });
    });
}

function checkOrCreateBundleCacheImage(absPath) {
    var gemfileData = fs.readFileSync(path.resolve(absPath, 'Gemfile'));
    var gemfileLockData = fs.readFileSync(path.resolve(absPath, 'Gemfile.lock'));

    var imageName = 'dotmake-bundle-cache-' + MD5(gemfileData) + '-' + MD5(gemfileLockData);

    return new Promise(function (resolve, reject) {
        console.log('checking image: ' + imageName);

        var child = spawn('/usr/local/bin/docker', [], { env: DOCKER_ENV });

        child.on('close', function (code) {
            if (code === 0) {
                // return already-built image name
                resolve(imageName);
            } else {
                // trigger image creation
                resolve(createBundleCacheImage(absPath, imageName, gemfileData, gemfileLockData));
            }
        });
    });
}

function createRailsInstanceFromBundleCache(absPath, cacheImage) {
    console.log('starting Rails!');

    return new Promise(function (resolve, reject) {
        var startupOutput = '';

        dockerArgs = [
            'run',
            '--rm',
            '--tty',
            '-p', '0.0.0.0:3000:3000',
            '-v', absPath + ':/mount/src',
            '-w', '/mount/src',
            cacheImage,
            'sh', '-c', 'bin/rake db:migrate RAILS_ENV=development && rails server -b 0.0.0.0'
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

module.exports = function createRailsInstance(srcPath) {
    var absPath = path.resolve(srcPath);

    return checkOrCreateBundleCacheImage(absPath)
    .then(function (cacheImage) {
        return createRailsInstanceFromBundleCache(absPath, cacheImage);
    });
};
