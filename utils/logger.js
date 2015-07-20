/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var config = require('config');
var fs = require('fs');
var logDirectory = './logs';

if ( !fs.existsSync(logDirectory) ) {
    fs.mkdirSync(logDirectory);
}

var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    exitOnError: false
});

if (config.util.getEnv('NODE_ENV') === 'production') {
    logger.add(winston.transports.File, {
        level: 'error',
        filename: logDirectory + '/error.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
        prettyPrint: false
    });
} else {
    logger.add(winston.transports.File, {
        level: 'info',
        filename: logDirectory + '/everything.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
        prettyPrint: false
    });

    logger.add(winston.transports.Console, {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
        prettyPrint: true
    });
}

module.exports = logger;
