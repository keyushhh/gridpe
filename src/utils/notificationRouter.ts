import { NavigateFunction } from 'react-router-dom'
import { ROUTES } from '@/routes'

export type NotificationPayload = {
  type?: string
  id?: string
  orderId?: string
  transactionId?: string
  screen?: string
  [key: string]: unknown
}

// TO TEST: In Supabase dashboard → send a test push with data payload:
// { "type": "transaction", "id": "test-123" }
// Tap the notification → should navigate to /order/test-123
export function routeFromNotification(
  payload: NotificationPayload,
  navigate: NavigateFunction
): void {
  if (!payload || !payload.type) {
    // Default fallback if payload is malformed
    navigate(ROUTES.HOME)
    return
  }

  switch (payload.type) {
    // Transaction & Payments
    case 'transaction':
    case 'payment_received':
    case 'payment_sent':
      navigate(payload.id ? `/order/${payload.id}` : '/orders')
      break

    // Order flow
    case 'order_placed':
    case 'order_confirmed':
    case 'order_update':
      navigate(payload.orderId ? `/order/${payload.orderId}` : '/orders')
      break
    // Tracking
    case 'tracking_update':
      navigate(ROUTES.ORDER_TRACKING)
      break

    // KYC
    case 'kyc_update':
    case 'kyc_verified':
    case 'kyc_rejected':
      navigate(ROUTES.SETTINGS)
      break

    // Promotional
    case 'promo':
    case 'offer':
      navigate(payload.screen || '/home')
      break

    // Generic screen override — backend can pass any route directly
    case 'screen':
      if (payload.screen && payload.screen.startsWith('/')) {
        navigate(payload.screen)
      } else {
        navigate(ROUTES.HOME)
      }
      break

    case 'system_alert':
    default:
      // By default, just go home
      navigate(ROUTES.HOME)
      break
  }
}
