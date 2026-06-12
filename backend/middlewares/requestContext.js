"use strict";

function requestContext(req, _res, next) {
  req.requestStartedAt = Date.now();
  next();
}

module.exports = { requestContext };
