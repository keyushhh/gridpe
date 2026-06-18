import { posthog } from './providers/posthog';
import type { TrackingEvents } from './types';

type EventsWithProperties = {
  [K in keyof TrackingEvents]: TrackingEvents[K] extends Record<string, never> ? never : K;
}[keyof TrackingEvents];
type EventsWithoutProperties = Exclude<keyof TrackingEvents, EventsWithProperties>;

export function track<K extends EventsWithoutProperties>(eventName: K): void;
export function track<K extends EventsWithProperties>(eventName: K, properties: TrackingEvents[K]): void;
export function track(eventName: string, properties?: Record<string, unknown>): void {
  if (import.meta.env?.DEV) {
    console.debug(`[Analytics] ${eventName}`, properties ?? {});
  }
  // PostHog — only fires in production to keep dev data clean
  if (!import.meta.env.DEV) {
    posthog.capture(eventName, properties ?? {});
  }
}
export const analytics = { track } as const;
