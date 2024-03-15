"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationResult = void 0;
const express_validator_1 = require("express-validator");
// middleware to handle validation results from express-validator
function handleValidationResult(req, res, next) {
  const result = (0, express_validator_1.validationResult)(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() });
  }
  next();
}
exports.handleValidationResult = handleValidationResult;
