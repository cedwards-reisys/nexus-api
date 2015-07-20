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
var Q = require('q');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var util = require('util');
var stream = require('stream');
var eventStream = require('event-stream');
var Promise = require('bluebird');
var _ = require('lodash');
var CSV = require('comma-separated-values');
var contractSchema = require('../schemas/contract.json');

var contractCsvMeta = require('./contractCsvMeta.json');


var Storage = function() {
    this.client = new elasticsearch.Client({
        host: config.get('elasticsearch.host') + ':' + config.get('elasticsearch.port'),
        log: {
            type: 'file',
            level: 'error',
            path: './logs/elasticsearch.log'
        }
    });
};

Storage.prototype.getClient = function getClient() {
    return this.client;
};

Storage.prototype.closeClient = function closeClient() {
    return this.client.close();
};

Storage.prototype.isAlive = function isAlive() {
    return this.client.ping({
        requestTimeout: 30000
    });
};


Storage.prototype.getIndex = function getIndex ( indexName ) {
    return this.client.indices.getSettings({
        index: indexName
    }).then(function (body) {
        return body;
    }, function (error) {
        throw new Error(error);
    });
};

Storage.prototype.createIndex = function createIndex ( indexName ) {
    return this.client.indices.create({
        index: indexName
    }).then(function (body) {
        return body;
    }, function (error) {
        throw new Error(error);
    });
};

Storage.prototype.updateSchema = function updateSchema ( indexName, typeName, schema ) {
    var deferred = Q.defer();
    this.client.indices.putMapping({
        index: indexName,
        type: typeName,
        body: schema
    }, function (error) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

Storage.prototype.deleteType = function deleteType ( indexName, typeName ) {
    var deferred = Q.defer();
    this.client.indices.deleteMapping({
        index: indexName,
        type: typeName
    }, function (error) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

Storage.prototype.addItem = function addItem ( indexName, typeName, data ) {
    var deferred = Q.defer();
    this.client.index({
        index: indexName,
        type: typeName,
        body: data
    }, function (error) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

Storage.prototype.importData = function importData () {
    var _this = this;

    var lineCount = -1;
    var batch = [];

    var getBulkOperation = function(line){
        var data = line.split(",");

        var header = { index: { _index: 'contracts', _type: 'contract' } };
        var doc = {};

        for ( var i = 0, total = contractCsvHeaders.length; i < total; i++ ) {
            doc[contractCsvHeaders[i]] = data[i];
        }

        return {header: header, doc: doc};
    };

    var readable = fs.createReadStream('/Users/cedwards/Downloads/contract_all_2015.csv')
        .pipe(eventStream.split())
        .pipe(eventStream.mapSync(function (line) {
                lineCount++;
                if ( lineCount == 0 ) {
                    return; // skip over header
                }


                var data = CSV.parse(line,{ header: contractCsvMeta.headers, cast: contractCsvMeta.types });

                //var data = CSVToArray(line);

                //logger.debug(data);

                var header = { index: { _index: 'contracts', _type: 'contract' } };
                var doc = data[0];

                //logger.debug(doc);
                //process.exit(1);

                batch.push(header,doc);

                if ( lineCount % 10000 == 0 ) {
                    readable.pause();

                    // bulk import
                    logger.debug('Inserting batch into elasticsearch.');

                    _this.client.bulk({body: batch}, function (error, response) {
                        if (error) {
                            throw new Error(error);
                        } else {
                            logger.debug('Completed inserting batch into elasticsearch.');
                            batch = [];
                            readable.resume();
                        }
                    });
                }
            }).on('error', function () {
                logger.error('Error while reading file.');
            }).on('end', function () {
                logger.info('Read entirefile.')
            })
        );

    /**

    var fileStream = fs.createReadStream('/Users/cedwards/Downloads/contract_partial.csv')
        .pipe(eventStream.split())
        .pipe(eventStream.mapSync(function (line) {

            // pause the reading
            fileStream.pause();

            (function () {

                logger.debug('processing line');
                logger.debug(line);


                _this.client.index({
                    index: indexName,
                    type: typeName,
                    body: data
                }, function (error) {
                    if (error) {
                        throw new Error(error);
                    }
                });


                // resume the reading
                fileStream.resume();
            })();
        }).on('error', function () {
            console.log('Error while reading file.');
        }).on('end', function () {
            console.log('Read entirefile.')
        })
    );
    **/
};

function performSearch(termToSearch) {

    var deferred = Q.defer();
    console.log("Request handler 'search' was called.");
    var qryObj = {
        "query" : {
            "term" : { "name":termToSearch }
        }
    };
    elasticSearchClient.search(index, type, qryObj).
        on('data', function (data) {
            // console.log(data)
            deferred.resolve(JSON.parse(data));
        })
        .on('error', function (err) {
            console.log(err);
            return deferred.resolve(err);
        })
        .exec();
    return  deferred.promise;
}

function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];
    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;
    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];
        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)
        ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );
        }


        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
            );

        } else {

            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        if ( typeof strMatchedValue == 'undefined' ) {
            strMatchedValue = null;
        }

        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return arrData[0];
}


module.exports = new Storage();

