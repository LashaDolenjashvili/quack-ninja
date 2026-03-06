"use client";

type PaddleCheckoutOptions = {
  transactionId: string;
  settings?: {
    successUrl?: string;
  };
};

type PaddleInstance = {
  Initialize: (options: { token: string }) => void;
  Environment?: {
    set: (environment: "sandbox") => void;
  };
  Checkout: {
    open: (options: PaddleCheckoutOptions) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
    __quackPaddleDiag?: Array<{
      ts: string;
      stage: string;
      details?: string;
    }>;
  }
}

const PADDLE_SCRIPT_SELECTOR = 'script[data-paddle-js="true"]';
const PADDLE_SCRIPT_SRC = "https://cdn.paddle.com/paddle/v2/paddle.js";
const PADDLE_UNAVAILABLE_ERROR = "Paddle.js loaded but Paddle was unavailable.";
const PADDLE_SCRIPT_LOAD_TIMEOUT_MS = 8_000;
const PADDLE_GLOBAL_TIMEOUT_MS = 15_000;

let scriptLoadPromise: Promise<void> | null = null;
let readyPromise: Promise<PaddleInstance> | null = null;
let initializePromise: Promise<void> | null = null;
let initializedToken: string | null = null;

function recordPaddleDiag(stage: string, details?: string) {
  if (typeof window === "undefined") {
    return;
  }
  const entry = {
    ts: new Date().toISOString(),
    stage,
    details,
  };
  const list = window.__quackPaddleDiag ?? [];
  list.push(entry);
  if (list.length > 80) {
    list.splice(0, list.length - 80);
  }
  window.__quackPaddleDiag = list;
  console.debug("[QuackNinja][Paddle]", stage, details ?? "");
}

function isUsablePaddleInstance(value: unknown): value is PaddleInstance {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<PaddleInstance>;
  return (
    typeof candidate.Initialize === "function" &&
    Boolean(candidate.Checkout) &&
    typeof candidate.Checkout?.open === "function"
  );
}

async function waitForPaddleGlobal(timeoutMs = PADDLE_GLOBAL_TIMEOUT_MS) {
  recordPaddleDiag("wait-global:start", String(timeoutMs));
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isUsablePaddleInstance(window.Paddle)) {
      recordPaddleDiag("wait-global:ready");
      return window.Paddle;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  recordPaddleDiag("wait-global:timeout");
  return null;
}

function getClientToken() {
  return process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() ?? "";
}

function getSuccessUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const normalized = appUrl ? appUrl.replace(/\/+$/, "") : window.location.origin;
  return `${normalized}/app/settings?billing=success`;
}

function isSandboxToken(token: string) {
  return token.startsWith("test_") || token.startsWith("test");
}

function findPaddleScript() {
  return document.querySelector<HTMLScriptElement>(PADDLE_SCRIPT_SELECTOR);
}

function createPaddleScript(src = PADDLE_SCRIPT_SRC) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.dataset.paddleJs = "true";
  document.head.appendChild(script);
  return script;
}

function removePaddleScripts() {
  document
    .querySelectorAll<HTMLScriptElement>(PADDLE_SCRIPT_SELECTOR)
    .forEach((script) => script.remove());
}

async function ensurePaddleScriptLoaded(options?: { forceReload?: boolean }) {
  if (window.Paddle) {
    recordPaddleDiag("script:skip-window-paddle");
    return;
  }
  const forceReload = options?.forceReload ?? false;
  if (forceReload) {
    recordPaddleDiag("script:force-reload");
    removePaddleScripts();
    scriptLoadPromise = null;
    readyPromise = null;
    initializePromise = null;
    initializedToken = null;
  }
  if (!scriptLoadPromise) {
    recordPaddleDiag("script:load-begin");
    scriptLoadPromise = new Promise<void>((resolve, reject) => {
      const existing = findPaddleScript();
      const script = existing ?? createPaddleScript();
      recordPaddleDiag(existing ? "script:using-existing" : "script:created");

      if (script.dataset.loaded === "true") {
        recordPaddleDiag("script:already-loaded-flag");
        resolve();
        return;
      }

      let settled = false;
      let timeoutId: number | null = null;

      const cleanup = () => {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const resolveOnce = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const rejectOnce = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(error);
      };

      const onLoad = () => {
        script.dataset.loaded = "true";
        recordPaddleDiag("script:onload");
        resolveOnce();
      };

      const onError = () => {
        recordPaddleDiag("script:onerror");
        rejectOnce(new Error("Failed to load Paddle checkout."));
      };

      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);

      // If load event was already missed for an existing script, unblock and let global checks decide.
      timeoutId = window.setTimeout(() => {
        recordPaddleDiag("script:load-timeout-fallback");
        resolveOnce();
      }, PADDLE_SCRIPT_LOAD_TIMEOUT_MS);
    }).catch((error) => {
      scriptLoadPromise = null;
      recordPaddleDiag("script:load-failed", error instanceof Error ? error.message : "unknown");
      throw error;
    });
  }
  await scriptLoadPromise;
  recordPaddleDiag("script:load-done");
}

function resetLoaderState() {
  scriptLoadPromise = null;
  readyPromise = null;
}

async function resolvePaddleWithRetry() {
  recordPaddleDiag("resolve:start");
  await ensurePaddleScriptLoaded();
  const paddle = await waitForPaddleGlobal();
  if (paddle) {
    recordPaddleDiag("resolve:success-first");
    return paddle;
  }

  // Recover from a stale/failed script element without requiring page refresh.
  recordPaddleDiag("resolve:retry-after-reload");
  await ensurePaddleScriptLoaded({ forceReload: true });
  const retried = await waitForPaddleGlobal();
  if (retried) {
    recordPaddleDiag("resolve:success-retry");
    return retried;
  }

  recordPaddleDiag("resolve:failed");
  throw new Error(PADDLE_UNAVAILABLE_ERROR);
}

async function loadPaddleJs() {
  if (typeof window === "undefined") {
    throw new Error("Paddle checkout is only available in the browser.");
  }
  if (window.Paddle) {
    recordPaddleDiag("load:window-paddle-present");
    return window.Paddle;
  }
  if (!readyPromise) {
    recordPaddleDiag("load:ready-promise-create");
    readyPromise = (async () => {
      return resolvePaddleWithRetry();
    })().catch((error) => {
      resetLoaderState();
      recordPaddleDiag("load:ready-promise-failed", error instanceof Error ? error.message : "unknown");
      throw error;
    });
  }
  return readyPromise;
}

async function ensurePaddleInitialized(paddle: PaddleInstance, clientToken: string) {
  if (initializedToken === clientToken) {
    recordPaddleDiag("init:already-initialized");
    return;
  }

  if (!initializePromise) {
    initializePromise = (async () => {
      recordPaddleDiag("init:start");
      if (isSandboxToken(clientToken)) {
        paddle.Environment?.set("sandbox");
        recordPaddleDiag("init:env-sandbox");
      }

      try {
        paddle.Initialize({ token: clientToken });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Paddle allows Initialize only once per page. If another caller already initialized, proceed.
        if (message.toLowerCase().includes("initialize") && message.toLowerCase().includes("once")) {
          recordPaddleDiag("init:already-on-page", message);
          initializedToken = clientToken;
          return;
        }
        recordPaddleDiag("init:failed", message);
        throw error;
      }

      initializedToken = clientToken;
      recordPaddleDiag("init:success");
    })().catch((error) => {
      initializePromise = null;
      initializedToken = null;
      throw error;
    });
  }

  await initializePromise;
}

export async function ensurePaddleReady() {
  const clientToken = getClientToken();
  if (!clientToken) {
    recordPaddleDiag("ensure:missing-token");
    throw new Error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.");
  }

  const paddle = await loadPaddleJs();
  if (!isUsablePaddleInstance(paddle)) {
    recordPaddleDiag("ensure:invalid-paddle-instance");
    throw new Error(PADDLE_UNAVAILABLE_ERROR);
  }

  await ensurePaddleInitialized(paddle, clientToken);

  return paddle;
}

export async function openPaddleCheckout({
  transactionId,
}: {
  transactionId: string;
}) {
  if (!transactionId) {
    throw new Error("Missing Paddle transaction id.");
  }

  const paddle = await ensurePaddleReady();

  paddle.Checkout.open({
    transactionId,
    settings: {
      successUrl: getSuccessUrl(),
    },
  });
}

export function isPaddleUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes(PADDLE_UNAVAILABLE_ERROR) || message.includes("Failed to load Paddle checkout.");
}
