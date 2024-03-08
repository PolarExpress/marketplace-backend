/**
 * `throw` wrapped in a function, so we can use it in null coalescing statements.
 *
 * Don't ask me, ask whoever designed typescript this way.
 */
export const throwFn = (e: Error): never => {
  throw e;
};
