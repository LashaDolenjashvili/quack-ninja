const queues = new Map<string, Promise<unknown>>();

export async function enqueueWorkspaceTask<T>(
  workspaceId: string,
  task: () => Promise<T>
) {
  const key = workspaceId || "local";
  const current = queues.get(key) ?? Promise.resolve();
  const next = current.then(task, task);
  queues.set(key, next.finally(() => {
    if (queues.get(key) === next) {
      queues.delete(key);
    }
  }));
  return next;
}
