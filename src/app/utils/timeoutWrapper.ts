/**
 * Utility to wrap operations with timeout handling
 */

export const withTimeout = <T>(
  operation: () => Promise<T> | T,
  timeoutMs: number = 5000,
  timeoutMessage?: string
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = operation();
      
      if (result instanceof Promise) {
        result
          .then((value) => {
            clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      } else {
        clearTimeout(timeoutId);
        resolve(result);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

export const createTimeoutWrapper = (defaultTimeout: number = 5000) => {
  return <T>(operation: () => Promise<T> | T, timeoutMs?: number, timeoutMessage?: string) => {
    return withTimeout(operation, timeoutMs || defaultTimeout, timeoutMessage);
  };
};

export default withTimeout;