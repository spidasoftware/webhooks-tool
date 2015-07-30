var fs = require('fs');

module.exports = function(grunt) {
    var nodeBin = __dirname + '/node_modules/.bin';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        supervisor: {
            target: {
                script: 'index.js',
                options: {
                    watch: ['index.js','src']
                }
            }
        },

        clean: {
            tmp: ['tmp/*','dist/*'],
            package: ['package/'],
            testData: ['test-data/'],
            pidFile: ['webhooks-tool.pid']
        },

        exec: {
            emberBuildWatch: {
                cmd: nodeBin + '/ember build --watch'
            },
            emberBuildProd: {
                cmd: nodeBin + '/ember build -prod'
            },
            log: {
                cmd: 'tail -f ' + __dirname + '/logs/webhooksTool.log | ' + nodeBin + '/bunyan --color'
            },
            packageInstall: {
                cwd: 'package/webhooks-tool',
                cmd: 'npm install --production'
            },
            startTest: {
                cmd: 'node ' + __dirname + '/index.js -p -d ' + __dirname + '/test-data'
            },
            startTestWatch: {
                cmd: nodeBin + '/supervisor -w "index.js,src" --save-pid ' + __dirname + '/webhooks-tool.pid ' + __dirname + '/index.js'
            },
            emberTest: {
                cmd: nodeBin + '/ember test'
            },
            emberTestServe: {
                cmd: nodeBin + '/ember test --serve'
            }
        },

        copy: {
            package: {
                files: [
                    { expand: true, src: ['index.js', 'package.json', 'README.md', 'start.sh'], dest: 'package/webhooks-tool' },
                    { expand: true, src: ['src/**'], dest: 'package/webhooks-tool' },
                    { expand: true, src: ['dist/**'], dest: 'package/webhooks-tool'}
                ]
            },
            testData: {
                files: [
                    {expand: true, flatten:true, src: ['tests/data/*'], dest: 'test-data' }
                ]
            }
        },

        compress: {
            package: {
                options: {
                    archive: 'webhooksTool.<%= pkg.version %>.tar.gz'
                },
                files: [
                    { expand: true, cwd: 'package', src: ['**'], dest: '.' }
                ]
            },
            packageNoLibs: {
                options: {
                    archive: 'webhooksTool.<%= pkg.version %>.no-libs.tar.gz'
                },
                files: [
                    { expand: true, cwd: 'package', src: ['**'], dest: '.' }
                ]
            }
        },

        parallel: {
            run: {
                options: {
                    grunt: true,
                    stream: true,
                },
                tasks: ['exec:emberBuildWatch', 'start']
            },
            test: {
                options: {
                    grunt: true,
                    stream: true,
                },
                tasks: ['testServer', 'runTests']
            },
            testServe: {
                options: {
                    grunt: true,
                    stream: true,
                },
                tasks: ['testServerWatch', 'runTestsServe']
            },
            
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-supervisor');
    grunt.loadNpmTasks('grunt-parallel');

    grunt.registerTask('start', 'Start the application', ['supervisor']);
    grunt.registerTask('default', ['clean','parallel:run']);
    grunt.registerTask('log', ['exec:log']);
    grunt.registerTask('testServe', ['clean','parallel:testServe']);
    grunt.registerTask('package', 'Create a package', [
        'exec:emberBuildProd',
        'copy:package',
        'chmod',
        'exec:packageInstall',
        'compress:package',
        'clean:package'
    ]);
    grunt.registerTask('packageNoLibs', 'Create a minimal package (no external libs)', [
        'buildProd',
        'copy:package',
        'chmod',
        'compress:packageNoLibs',
        'clean:package'
    ]);
    grunt.registerTask('testServer', 'Starts a server with test data and cleans up after itself when done', [
        'copy:testData',
        'exec:startTest',
        'clean:testData',
        'clean:pidFile'
    ]);
    grunt.registerTask('testServerWatch', 'Starts a server with test data and cleans up after itself when done', [
        'copy:testData',
        'exec:startTestWatch',
        'clean:testData',
        'clean:pidFile'
    ]);
    grunt.registerTask('runTests', 'Runs ember tests once sever has started and then kills server', [
        'waitForServerStart',
        'exec:emberTest',
        'killServer'
    ]);
    grunt.registerTask('runTestsServe', 'Runs ember test --serve once webhooks tool has start then kills webhooks Tool when done', [
        'waitForServerStart',
        'exec:emberTestServe',
        'killServer'
    ]);

    grunt.registerTask('test', 'Run tests', ['parallel:test']);

    grunt.registerTask('chmod', 'Set permissions on start.sh', function() {
        var done = this.async();

        fs.chmod('./package/webhooks-tool/start.sh','755', function(err) {
            done(!err)
        });
    });

    grunt.registerTask('waitForServerStart', 'Waits until the webhook tool has started', function() {
        var done = this.async();

        var waitMax = 30;

        function waitForStart() {
            grunt.log.writeln('Looking for webhooks-tool.pid...');
            fs.readFile(__dirname + '/webhooks-tool.pid', function(err, data) {
                if (err) {
                    waitMax--;
                    if (waitMax > 0) {
                        setTimeout(waitForStart, 1000);
                    } else {
                        grunt.log.writeln('Server did not start (or did not write a pid file).  Giving up.');
                        done(false);
                    }
                } else {
                    done();
                }
            });
        }

        waitForStart();
    });

    grunt.registerTask('killServer', 'Kills the running test server', function() {
        var done = this.async();
        fs.readFile(__dirname + '/webhooks-tool.pid', function(err, data) {
            grunt.log.writeln('Killing server with pid: ' + data);
            process.kill(data,'SIGINT');
            done(!err);
        });
    });
};
