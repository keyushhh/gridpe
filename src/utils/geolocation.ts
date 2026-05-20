/**
 * Platform-safe geolocation wrapper.
 *
 * Capacitor's Geolocation plugin throws "Not implemented on web" when
 * running in a browser outside a native shell.  This module tries
 * Capacitor first and transparently falls back to the W3C Geolocation API.
 */
import { Geolocation, type PermissionStatus, type Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

/** Check (and optionally request) location permissions. */
export async function checkLocationPermission(): Promise<PermissionStatus> {
  if (Capacitor.isNativePlatform()) {
    return Geolocation.checkPermissions();
  }
  // Web: permissions are managed by the browser prompt — assume 'prompt'
  return { location: 'prompt', coarseLocation: 'prompt' };
}

export async function requestLocationPermission(): Promise<PermissionStatus> {
  if (Capacitor.isNativePlatform()) {
    return Geolocation.requestPermissions();
  }
  // Web: the browser will show its own permission prompt when getCurrentPosition is called
  return { location: 'granted', coarseLocation: 'granted' };
}

/** Get current position — native-first with browser fallback. */
export async function getCurrentPosition(
  opts?: PositionOptions & { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number }
): Promise<Position> {
  // Try Capacitor first (works on iOS/Android)
  if (Capacitor.isNativePlatform()) {
    return Geolocation.getCurrentPosition(opts);
  }

  // Fallback: browser Geolocation API
  return new Promise<Position>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Map the browser GeolocationPosition to Capacitor's Position type
        resolve({
          timestamp: pos.timestamp,
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          },
        });
      },
      (err) => reject(err),
      opts,
    );
  });
}
