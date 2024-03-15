"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const express_1 = __importDefault(require("express"));
const install_1 = require("./install");
const express_validator_1 = require("express-validator");
const utils_1 = require("./utils");
const validate_1 = require("./validate");
function buildApp(ctx) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.post("/install", (0, express_validator_1.body)("userId")
        .exists()
        .withMessage("No userId specified")
        .isString()
        .withMessage("userId needs to be a string"), (0, express_validator_1.body)("addonId")
        .exists()
        .withMessage("No addonId specified")
        .isString()
        .withMessage("addonId needs to be a string"), validate_1.handleValidationResult, (0, utils_1.asyncCatch)((0, install_1.installRoute)(ctx)));
    app.post("/uninstall", (0, express_validator_1.body)("userId")
        .exists()
        .withMessage("No userId specified")
        .isString()
        .withMessage("userId needs to be a string"), (0, express_validator_1.body)("addonId")
        .exists()
        .withMessage("No addonId specified")
        .isString()
        .withMessage("addonId needs to be a string"), validate_1.handleValidationResult, (0, utils_1.asyncCatch)((0, install_1.uninstallRoute)(ctx)));
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        next();
    });
    return app;
}
exports.buildApp = buildApp;
