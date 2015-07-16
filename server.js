/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var config = require('config');
var Hapi = require('hapi');
var GoodWinston = require('good-winston');
var Logger = require('./utils/logger');

var server = new Hapi.Server();

server.connection({host: config.get('server.address'), port: config.get('server.port'), routes: config.get('server.routes')});

server.route(require('./routes'));

server.register([
    {
        register: require('inject-then')
    },
    {
        register: require('good'),
        options: {
            opsInterval: 300000,
            reporters: [
                new GoodWinston({
                    ops: '*',
                    request: '*',
                    response: '*',
                    log: '*',
                    error: '*'
                }, Logger)
            ]
        }
    }
], function (err) {
    if (err) {
        return server.log(['error'], 'good load error: ' + err);
    }
});

server.start(function () {
    server.log('info', 'Server environment: ' + config.util.getEnv('NODE_ENV'));
    server.log('info', 'Server running at: ' + server.info.uri);
});

module.exports = server;
