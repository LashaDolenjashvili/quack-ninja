export function logClientError(error: unknown, context?: string) {
  if (context) {
    console.error(`[QuackNinja] ${context}`, error);
    return;
  }
  console.error("[QuackNinja] Client error", error);
}
