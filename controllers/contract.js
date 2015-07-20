/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

//'use strict';

var logger = require('../utils/logger');
var util = require('util');

//var ApiController = require('./api');

var ContractController = function () {
    this.ES_INDEX = 'contracts';
};

ContractController.prototype.getIndex = function (request,reply) {
    try {

        //var apiController = new ApiController(this.ES_INDEX);



        //var params = apiController.getParams(request);
        //var es_params = this.getElasticsearchParams(params);
        //var result = this.search(params,es_params);
        //reply(result);
        reply({index: null, what: 123});
    } catch (e) {
        //logger.error(e);
        //reply(this.error(e.message, e.code));
        reply(e);
    }
};

module.exports = new ContractController();

