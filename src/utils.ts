/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

/**
 * `throw` wrapped in a function, so we can use it in null coalescing statements.
 *
 * Don't ask me, ask whoever designed typescript this way.
 */
export const throwFn = (e: Error): never => {
  throw e;
};
