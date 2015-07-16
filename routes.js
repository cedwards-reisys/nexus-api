/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply('Hello, world!');
        }
    },
    {
        method: 'GET',
        path: '/contract.json',
        handler: function (request, reply) {
            reply('Hello!');
        }
    }
];