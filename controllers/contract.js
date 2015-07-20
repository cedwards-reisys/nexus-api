/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var logger = require('../utils/logger');
var ApiController = require('./api');

var apiController = new ApiController({index: 'contracts', dateFields:['signeddate','effectivedate','currentcompletiondate','ultimatecompletiondate','lastdatetoorder','registrationdate','renewaldate','last_modified_date']});

var ContractController = function () {
    this.ES_INDEX = 'contracts';
};

ContractController.prototype.getIndex = function (request,reply) {
    try {
        var params = apiController.getParams(request.query);
        var es_params = apiController.getElasticsearchParams(params);
        var result = apiController.search(params,es_params);
        reply(result);
    } catch (e) {
        logger.error(e);
        reply(apiController.error(e.message, e.code));
    }
};

module.exports = new ContractController();
