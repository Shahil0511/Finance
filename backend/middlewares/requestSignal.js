"use strict";

const { makeRequestSignal } = require("../db/postgres");

function attachRequestSignal(req, _res, next) {
  req.requestSignal = makeRequestSignal(req);
  next();
}

module.exports = { attachRequestSignal };
