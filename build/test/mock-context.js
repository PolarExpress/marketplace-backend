"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockContext = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
const createMockContext = () => {
    const context = {
        prisma: (0, jest_mock_extended_1.mockDeep)()
    };
    return [context, context];
};
exports.createMockContext = createMockContext;
