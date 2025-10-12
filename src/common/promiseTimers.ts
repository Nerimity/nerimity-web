export const promiseTimers = {
  setTimeout: (ms: number) => new Promise((res) => setTimeout(res, ms)),
};
