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
  }
}

let loadPromise: Promise<PaddleInstance> | null = null;
let initializedToken: string | null = null;

async function waitForPaddleGlobal(timeoutMs = 3000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (window.Paddle) {
      return window.Paddle;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
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

async function loadPaddleJs() {
  if (typeof window === "undefined") {
    throw new Error("Paddle checkout is only available in the browser.");
  }
  if (window.Paddle) {
    return window.Paddle;
  }
  if (!loadPromise) {
    loadPromise = new Promise<PaddleInstance>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-paddle-js="true"]'
      );
      if (existing) {
        existing.addEventListener("load", () => {
          void waitForPaddleGlobal().then((paddle) => {
            if (paddle) {
              resolve(paddle);
            } else {
              reject(new Error("Paddle.js loaded but Paddle was unavailable."));
            }
          });
        });
        existing.addEventListener("error", () => {
          reject(new Error("Failed to load Paddle checkout."));
        });
        void waitForPaddleGlobal().then((paddle) => {
          if (paddle) {
            resolve(paddle);
          }
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.dataset.paddleJs = "true";
      script.onload = () => {
        void waitForPaddleGlobal().then((paddle) => {
          if (paddle) {
            resolve(paddle);
          } else {
            reject(new Error("Paddle.js loaded but Paddle was unavailable."));
          }
        });
      };
      script.onerror = () => {
        reject(new Error("Failed to load Paddle checkout."));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

export async function ensurePaddleReady() {
  const clientToken = getClientToken();
  if (!clientToken) {
    throw new Error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.");
  }

  const paddle = await loadPaddleJs();

  if (initializedToken !== clientToken) {
    if (isSandboxToken(clientToken)) {
      paddle.Environment?.set("sandbox");
    }
    paddle.Initialize({ token: clientToken });
    initializedToken = clientToken;
  }

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
