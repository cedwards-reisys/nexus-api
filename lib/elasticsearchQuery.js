/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var ejs = require('elastic.js');
var ElasticsearchQueryError = require('../errors/elasticsearchQueryError');

var ElasticsearchQuery = function (options) {

    // Supported characters:
    // all letters and numbers
    // . for long.field.names
    // _ for other_fields
    // : for fields
    // ( ) for grouping
    // " for quoting
    // [ ] and { } for ranges
    // >, < and = for ranges
    // - for dates and boolean
    // + for boolean
    // space for terms
    this.SUPPORTED_QUERY_RE = '^[0-9a-zA-Z\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$';

    if (options.dateFields) {
        this.dateFields = options.dateFields;
    }
};

ElasticsearchQuery.prototype.supportedQueryString = function supportedQueryString(query) {
    var supported_query_re = new RegExp(this.SUPPORTED_QUERY_RE);
    return supported_query_re.test(query);
};

ElasticsearchQuery.prototype.buildQuery = function buildQuery(params) {
    var q = ejs.Request();

    if (!params.search && !params.count) {
        q.query(ejs.MatchAllQuery());
        return q;
    }

    if (params.search) {
        if (!this.supportedQueryString(params.search)) {
            throw new ElasticsearchQueryError('Search not supported: ' + params.search,422);
        }
        q.query(ejs.QueryStringQuery(params.search));
    }

    if (params.count) {
        if (this.dateFields && this.dateFields.indexOf(params.count) !== -1) {
            q.facet(ejs.DateHistogramFacet('count').
                field(params.count).interval('day').order('time'));
        } else {
            var limit = parseInt(params.limit);
            q.facet(ejs.TermsFacet('count').
                fields(params.count).size(limit));
        }
    }

    return q;
};

module.exports = ElasticsearchQuery;
