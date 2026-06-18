import posthog from 'posthog-js';

export function initPostHog(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('[PostHog] VITE_POSTHOG_API_KEY is not set — skipping init');
    return;
  }

  posthog.init(apiKey, {
    api_host: host,
    capture_pageview: false,   // We fire page views manually via track()
    capture_pageleave: false,
    autocapture: false,        // WebView autocapture is noisy and unreliable
    persistence: 'localStorage',
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.debug();
      }
    },
  });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  posthog.identify(userId, properties);
}

export function resetPostHogUser(): void {
  posthog.reset();
}

export { posthog };
