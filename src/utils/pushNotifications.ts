import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

export const registerPushNotifications = async (navigate?: (path: string) => void) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Skipping push notification registration on non-native platform');
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
        await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
      }
    });

    PushNotifications.addListener('registrationError', error => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      // App is in foreground — show a toast with notification title and body
    });

    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      // User tapped the notification — navigate based on data payload
      const data = action.notification.data;
      if (data?.orderId) {
        const path = `/order-tracking/${data.orderId}`;
        if (Capacitor.isNativePlatform() && navigate) {
          navigate(path);
        } else {
          window.location.href = path;
        }
      }
    });
  } catch (e) {
    console.error('Push notification setup failed:', e);
  }
};
