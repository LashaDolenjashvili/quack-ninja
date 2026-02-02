export function createDuckDBWorker(workerUrl: string) {
  return new Worker(workerUrl, { type: "module" });
}
