/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

var config = require('config');
var Code = require('code');   // assertion library
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var server = require('../server');

lab.experiment('Basic Server Tests', function () {

    lab.test('Contract controller /contract.json', function (done) {
        var options = {
            method: 'GET',
            url: '/contract.json'
        };

        server.inject(options, function (response) {
            //var result = JSON.parse(response.result);
            Code.expect(response.statusCode).to.equal(200);
            done();
        });
    });

});
