/*
 * nexus-api
 * https://github.com/cedwards-reisys/nexus-api
 *
 * Copyright (c) 2015 Chris Edwards
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function ApiRequestError(message, code) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
};

require('util').inherits(module.exports, Error);