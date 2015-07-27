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

        remove: {
            clean: {
                dirList: ['tmp/*','dist/*']
            },
            packageClean: {
                dirList: ['package/']
            }
        },

        exec: {
            emberBuildWatch: {
                cmd: nodeBin + '/ember build --watch'
            },
            emberBuildProd: {
                cmd: nodeBin + '/ember build -prod'
            },
            log: {
                cmd: 'tail -f ' + __dirname + '/logs/webhookServer.log | ' + nodeBin + '/bunyan --color'
            },
            packageInstall: {
                cwd: 'package/webhook-tool',
                cmd: 'npm install --production'
            }
        },

        copy: {
            package: {
                files: [
                    { expand: true, src: ['index.js', 'package.json', 'README.md', 'start.sh'], dest: 'package/webhook-tool' },
                    { expand: true, src: ['src/**'], dest: 'package/webhook-tool' },
                    { expand: true, src: ['dist/**'], dest: 'package/webhook-tool'}
                ]
            }
        },

        compress: {
            package: {
                options: {
                    archive: 'webhookTool.<%= pkg.version %>.tar.gz'
                },
                files: [
                    { expand: true, cwd: 'package', src: ['**'], dest: '.' }
                ]
            },
            packageNoLibs: {
                options: {
                    archive: 'webhookTool.<%= pkg.version %>.no-libs.tar.gz'
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
                tasks: ['buildWatch', 'start']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-remove');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-supervisor');
    grunt.loadNpmTasks('grunt-parallel');

    grunt.registerTask('clean', ['remove:clean']);
    grunt.registerTask('buildWatch', ['exec:emberBuildWatch']);
    grunt.registerTask('buildProd', ['exec:emberBuildProd']);
    grunt.registerTask('start', 'Start the application', ['supervisor']);
    grunt.registerTask('default', ['clean','parallel:run']);
    grunt.registerTask('log', ['exec:log']);
    grunt.registerTask('package', 'Create a package', ['buildProd', 'copy:package', 'chmod', 'exec:packageInstall', 'compress:package'], ['remove:packageClean']);
    grunt.registerTask('packageNoLibs', 'Create a minimal package (no external libs)', ['buildProd', 'copy:package', 'chmod', 'compress:packageNoLibs', 'remove:packageClean']);

    grunt.registerTask('chmod', 'Set permissions on start.sh', function() {
        fs.chmodSync('./package/webhook-tool/start.sh','755');
    });
};
