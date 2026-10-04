let workerStarted: Promise<unknown> | null = null;

/**
 * Starts the MSW worker (browser only) and resolves once it intercepts
 * `/mock-api/*`. The start is shared at module level: MSW throws if start()
 * runs on an already-enabled worker, and it is requested from several places
 * (MockProvider's effect, which runs twice under StrictMode and on every
 * remount, and every mock request).
 */
export function mockWorkerReady(): Promise<unknown> {
  workerStarted ??= import("@/mocks/browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass", quiet: true })
  );
  return workerStarted;
}
