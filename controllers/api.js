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
var _ = require('lodash');
var ApiRequestError = require('../errors/apiRequestError');
var elasticsearch = require('elasticsearch');
var moment = require('moment');
var ElasticsearchQuery = require('../lib/elasticsearchQuery');

var ApiController = function ( index ) {
    this.ES_INDEX = index;
    this.EXPECTED_PARAMS = ['search', 'count', 'limit', 'offset'];
    this.MAX_LIMIT = 100;
    this.MAX_COUNT_LIMIT = 1000;

    this.client = new elasticsearch.Client({
        host: config.get('elasticsearch.host') + ':' + config.get('elasticsearch.port'),
        log: {
            type: 'file',
            level: 'error',
            path: './logs/elasticsearch.log'
        }
    });
};

ApiController.prototype.getParams = function getParams(params) {
    var _this = this;
    _.each(_.keys(params), function(param) {
        if (_this.EXPECTED_PARAMS.indexOf(param) === -1) {
            logger.error(params);
            throw new ApiRequestError('Invalid parameter: ' + param,422);
        }
    });

    if (params.limit) {
        var limit = parseInt(params.limit);
        if (isNaN(limit)) {
            throw new ApiRequestError('Invalid limit parameter value.',422);
        }
        params.limit = limit;
    }

    if (params.offset) {
        var offset = parseInt(params.offset);
        if (isNaN(offset)) {
            throw new ApiRequestError('Invalid offset parameter value.',422);
        }
        params.offset = offset;
    }

    // Limit to 100 results per search request.
    if (!params.count && params.limit && params.limit > this.MAX_LIMIT) {
        throw new ApiRequestError('Limit cannot exceed ' + this.MAX_LIMIT + ' results for search requests. Use ' + 'the offset param to get additional results.',422);
    }

    // Limit to 1000 results per count request.
    if (params.count && params.limit && params.limit > this.MAX_COUNT_LIMIT) {
        throw new ApiRequestError('Limit cannot exceed ' + this.MAX_COUNT_LIMIT + ' results for count requests.',422);
    }

    // Do not allow ski param with count requests.
    if (params.count && params.offset) {
        throw new ApiRequestError('Should not use offset param when using count.',422);
    }

    // Set default values for missing params
    params.offset = params.offset || 0;
    if (!params.limit) {
        if (params.count) {
            params.limit = 100;
        } else {
            params.limit = 10;
        }
    }

    var clean_params = {};
    _.extend(clean_params,
        _.pick(params, _this.EXPECTED_PARAMS));

    return clean_params;
};

ApiController.prototype.getElasticsearchParams = function getElasticsearchParams(params) {

    var ESQuery = new ElasticsearchQuery({});
    var query = ESQuery.buildQuery(params);

    // Added sort by _id to ensure consistent results across servers
    var search_params = {
        index: this.ES_INDEX,
        body: query.toJSON(),
        sort: '_uid'
    };

    if (!params.count) {
        search_params.from = params.offset;
        search_params.size = params.limit;
    }

    return search_params;
};

ApiController.prototype.search = function search(params, es_search_params) {
    var _this = this;
    return this.client.search(es_search_params).then(function(body) {
        //logger.debug(body);
        if (body.hits.hits.length === 0) {
            return _this.error('No matches found.',404);
        }

        var results = {};

        if (!params.count) {
            results.offset = params.offset;
            results.limit = params.limit;
            results.total = body.hits.total;

            results.data = [];
            for (var i = 0, hits = body.hits.hits.length; i < hits; i++) {
                results.data.push(body.hits.hits[i]._source);
            }
            return results;
        } else if (params.count) {
            if (body.facets.count.terms) {
                // Term facet count
                if (body.facets.count.terms.length !== 0) {
                    results.data = body.facets.count.terms;
                    return results;
                } else {
                    return _this.error('Nothing to count.',404);
                }
            } else if (body.facets.count.entries) {
                // Date facet count
                if (body.facets.count.entries.length !== 0) {
                    for (var j = 0, total = body.facets.count.entries.length; j < total; j++) {
                        var day = moment(body.facets.count.entries[j].time);
                        body.facets.count.entries[j].time = day.format('YYYY-MM-DD');
                    }
                    results.data = body.facets.count.entries;
                } else {
                    return _this.error('Nothing to count.',404);
                }
            } else {
                return _this.error('Nothing to count.',404);
            }
        } else {
            return _this.error('No matches found.',404);
        }
    }, function(error) {
        logger.error(error);
        return _this.error('Check your request and try again.',500);
    });
};

ApiController.prototype.error = function error(message, code) {
    return {
        error: {
            code: code,
            message: message
        }
    };
};

module.exports = ApiController;
