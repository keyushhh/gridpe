import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { routeFromNotification } from '../utils/notificationRouter'
import { getPendingNotificationData, clearPendingNotificationData } from '../utils/pushNotifications'

export function useNotificationNavigation() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle cold start — app was opened by tapping notification
    const pending = getPendingNotificationData()
    if (pending) {
      clearPendingNotificationData()
      // Small delay to let router finish mounting
      setTimeout(() => routeFromNotification(pending, navigate), 300)
    }

    // Handle warm start — app already open, notification tapped
    const handleTap = (event: Event) => {
      const data = (event as CustomEvent).detail
      routeFromNotification(data, navigate)
    }

    window.addEventListener('notification-tapped', handleTap)
    return () => window.removeEventListener('notification-tapped', handleTap)
  }, [navigate])
}
