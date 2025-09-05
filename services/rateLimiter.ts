/**
 * A simple rate limiter that ensures tasks are executed at a maximum frequency.
 * It queues up tasks and processes them sequentially with a delay between each one.
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval: number;
  private requestQueue: Promise<any> = Promise.resolve();

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  /**
   * Schedules a task to be executed according to the rate limit.
   * @param task A function that returns a Promise to be executed.
   * @returns The Promise returned by the task function.
   */
  public schedule<T>(task: () => Promise<T>): Promise<T> {
    // Chain the new request onto the end of the queue
    const newRequest = this.requestQueue.then(async () => {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;

        // If the time since the last request is less than our minimum interval, wait
        if (timeSinceLast < this.minInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLast));
        }

        // Update the last request time and execute the task
        this.lastRequestTime = Date.now();
        return task();
    });

    // Update the queue to point to the new request's promise
    this.requestQueue = newRequest;
    return newRequest;
  }
}
