import { NavigateFunction } from 'react-router-dom'

export type NotificationPayload = {
  type?: string
  id?: string
  orderId?: string
  transactionId?: string
  screen?: string
  [key: string]: any
}

// TO TEST: In Supabase dashboard → send a test push with data payload:
// { "type": "transaction", "id": "test-123" }
// Tap the notification → should navigate to /order/test-123
export function routeFromNotification(
  data: NotificationPayload,
  navigate: NavigateFunction
): void {
  if (!data || !data.type) {
    // No type — go to home
    navigate('/home')
    return
  }

  switch (data.type) {
    // Transaction & Payments
    case 'transaction':
    case 'payment_received':
    case 'payment_sent':
      navigate(data.id ? `/order/${data.id}` : '/orders')
      break

    // Order flow
    case 'order_placed':
    case 'order_confirmed':
    case 'order_update':
      navigate(data.orderId ? `/order/${data.orderId}` : '/orders')
      break

    case 'order_tracking':
      navigate('/tracking')
      break

    // Wallet
    case 'wallet_credit':
    case 'wallet_debit':
    case 'withdrawal':
      navigate('/wallet')
      break

    // KYC
    case 'kyc_approved':
    case 'kyc_rejected':
    case 'kyc_pending':
      navigate('/settings')
      break

    // Promotional
    case 'promo':
    case 'offer':
      navigate(data.screen || '/home')
      break

    // Generic screen override — backend can pass any route directly
    case 'screen':
      if (data.screen && data.screen.startsWith('/')) {
        navigate(data.screen)
      } else {
        navigate('/home')
      }
      break

    default:
      navigate('/home')
      break
  }
}
