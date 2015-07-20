/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

//var contractController = require('./controllers/contract');

exports.endpoints = [
    {
        method: 'GET',
        path: '/contract',
        config: {handler: require('./controllers/contract').getIndex}
    },
    {
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            // respond with available resources list
            var list = {
                routes: [
                    {
                        path: '/contract',
                        verb: 'GET',
                        params: {

                        }
                    }
                ]
            };
            reply(list);
        }
    }
];