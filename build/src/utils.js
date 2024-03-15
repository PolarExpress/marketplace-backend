"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncCatch = exports.throwFn = void 0;
/**
 * `throw` wrapped in a function, so we can use it in null coalescing statements.
 */
const throwFn = (e) => {
    throw e;
};
exports.throwFn = throwFn;
/**
 * Wraps an asynchronous endpoint function with error handling.
 * Any errors thrown by the endpoint function will be passed to the `next` function.
 *
 * @param fn - The asynchronous endpoint function to wrap.
 * @returns A middleware function that handles errors thrown by the endpoint function.
 */
const asyncCatch = (fn) => (req, res, next) => fn(req, res).catch(next);
exports.asyncCatch = asyncCatch;
