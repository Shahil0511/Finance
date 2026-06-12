"use strict";

class ApiError extends Error {
  constructor(statusCode, message, detail) {
    super(message);
    this.statusCode = statusCode;
    this.publicMessage = message;
    this.detail = detail;
  }
}

module.exports = { ApiError };
