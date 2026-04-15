import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

/**
 * Trigger a light impact haptic feedback.
 * Used for minor actions like toggle switches and tab switches.
 */
export const hapticLight = async () => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    console.warn('Haptics not supported on this device', e);
  }
};

/**
 * Trigger a medium impact haptic feedback.
 * Used for primary CTA buttons (Place Order, Confirm, Pay).
 */
export const hapticMedium = async () => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    console.warn('Haptics not supported on this device', e);
  }
};

/**
 * Trigger a heavy impact haptic feedback.
 */
export const hapticHeavy = async () => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (e) {
    console.warn('Haptics not supported on this device', e);
  }
};

/**
 * Trigger a success notification haptic feedback.
 * Used for successful order placement or completed actions.
 */
export const hapticSuccess = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    console.warn('Haptics not supported on this device', e);
  }
};

/**
 * Trigger an error notification haptic feedback.
 * Used for error toasts or failed actions.
 */
export const hapticError = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) {
    console.warn('Haptics not supported on this device', e);
  }
};

/**
 * Trigger a warning notification haptic feedback.
 * Used for destructive actions (Cancel Order, Remove Address).
 */
export const hapticWarning = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (e) {
    console.warn('Haptics not supported on this device', e);
  }
};
