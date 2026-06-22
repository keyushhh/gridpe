import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

// Store notification data when app is opened from a tapped notification
// before the router is ready
let pendingNotificationData: Record<string, any> | null = null;

export function getPendingNotificationData() {
  return pendingNotificationData;
}

export function clearPendingNotificationData() {
  pendingNotificationData = null;
}

export const registerPushNotifications = async (navigate?: (path: string) => void) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await PushNotifications.removeAllListeners();
    await PushNotifications.register();

    PushNotifications.addListener('registration', async ({ value: token }) => {
      // Save FCM/APNs token to Supabase profiles table
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from('profiles').update({ push_token: token }).eq('id', user.id);
      }
    });

    PushNotifications.addListener('registrationError', error => {
      if (import.meta.env.DEV) console.error('Push registration error:', error);
    });

    // Notification received while app is in FOREGROUND — show in-app banner (handled separately)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      window.dispatchEvent(new CustomEvent('notification-received', { 
        detail: {
          title: notification.title,
          body: notification.body,
          data: notification.data
        }
      }));
    });

    // Notification tapped while app is OPEN (foreground/background)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const data = action.notification.data;
      
      // Store for router to consume
      pendingNotificationData = data;
      
      // Dispatch custom event so the router hook can react immediately
      window.dispatchEvent(new CustomEvent('notification-tapped', { detail: data }));
    });
  } catch (e) {
    if (import.meta.env.DEV) console.error('Push notification setup failed:', e);
  }
};
