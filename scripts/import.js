/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var config = require('config');
var logger = require('../utils/logger');
var Promise = require('bluebird');

var esCSV = new ElasticsearchCSV({
    es: { index: 'contracts', type: 'contract', host: config.get('elasticsearch.host') + ':' + config.get('elasticsearch.port') },
    csv: { filePath: '/Users/cedwards/Downloads/contract_all_2015.csv', headers: true }
});

esCSV.import()
    .then(function (response) {
        // Elasticsearch response for the bulk insert
        //logger.debug(response);
    }, function (err) {
        // throw error
        throw err;
    });
