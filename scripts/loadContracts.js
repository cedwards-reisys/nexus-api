/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var config = require('config');
var Q = require('q');
var Storage = require('./storage');
var logger = require('../utils/logger');

var contractSchema = require('../schemas/contract.json');


Storage.isAlive().then(function(){

    logger.info('Elasticsearch is available.');

    logger.info('Creating index if missing.');
    return Storage.getIndex('contracts').then(function(body){
        logger.debug(body);
    }).catch(function (error) {
        logger.debug(error);
        Storage.createIndex('contracts').then(function(){
            logger.info('Creating schema.');
            return Storage.updateSchema('contracts','contract',contractSchema).then(function(body){
                logger.debug(body);
            });
        });
    });

}).then(function(){

    //logger.info('Importing data.');
    //return Storage.importData();
    //return Storage.deleteType('contracts','contract');

    //return Storage.updateSchema('contracts','contract',contractSchema).then(function(body){
    //    logger.debug(body);
    //});

}).catch(function (error) {
    logger.error(error);
}).done(function(){
    //Storage.closeClient();
    //logger.info('Done');
    //process.exit(0);
});

Storage.importData();




