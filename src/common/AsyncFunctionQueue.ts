/**
 * Interface for an item in the queue.
 * @template T The type of the result that the async function resolves to.
 */
interface QueueItem<T> {
  asyncFunc: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * A simple and fast async function queue for web environments, with TypeScript types.
 * It ensures that asynchronous functions are executed one after another in the order they were added.
 */
export class AsyncFunctionQueue {
  /**
   * The array that holds the queue items.
   * Using `unknown` is a type-safe alternative to `any`.
   * Type safety for individual items is handled by the generic `add` method.
   * @private
   */
  private queue: QueueItem<unknown>[] = [];

  /**
   * A flag to indicate whether the queue is currently processing an item.
   * @private
   */
  private isProcessing: boolean = false;

  /**
   * Adds an async function to the queue and returns a promise that resolves with the function's return value
   * or rejects with its error.
   * @template T The type of the result that the async function resolves to.
   * @param {() => Promise<T>} asyncFunc - An async function to be added to the queue. It must be a function that returns a Promise.
   * @returns {Promise<T>} A promise that resolves or rejects when the added function is executed.
   */
  public add<T>(asyncFunc: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Push the function along with its resolve/reject handlers to the queue.
      // We cast here to satisfy TypeScript's strict checks on function parameter contravariance.
      // This is safe because we ensure that the `resolve` function for a given `asyncFunc`
      // is always called with the result of that specific function.
      this.queue.push({
        asyncFunc,
        resolve,
        reject,
      } as QueueItem<unknown>);

      // If not already processing, start processing the queue.
      if (!this.isProcessing) {
        this._processNext();
      }
    });
  }

  /**
   * Processes the next item in the queue.
   * This is a private method and should not be called directly.
   * @private
   */
  private async _processNext(): Promise<void> {
    // If there's nothing in the queue, stop processing.
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    // Set the flag to indicate that processing has started.
    this.isProcessing = true;

    // Get the next item from the front of the queue.
    const item = this.queue.shift();

    if (!item) {
      // This case should not be hit due to the length check, but it's good practice for type safety.
      this.isProcessing = false;
      return;
    }

    try {
      // Execute the async function.
      const result = await item.asyncFunc();
      // Resolve the promise associated with this function.
      item.resolve(result);
    } catch (error: unknown) {
      // Reject the promise if the function throws an error.
      item.reject(error);
      console.error("An error occurred in the async queue:", error);
    } finally {
      // After the function is done (either resolved or rejected),
      // recursively call _processNext to handle the next item in the queue.
      // Using requestAnimationFrame or setTimeout can prevent potential stack overflow with a very long queue of synchronous tasks.
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => this._processNext());
      } else {
        setTimeout(() => this._processNext(), 0);
      }
    }
  }

  /**
   * Gets the current size of the queue.
   * @returns {number} The number of items currently in the queue.
   */
  public get size(): number {
    return this.queue.length;
  }

  /**
   * Checks if the queue is currently processing an item.
   * @returns {boolean} True if processing, false otherwise.
   */
  public get isBusy(): boolean {
    return this.isProcessing;
  }
}
