import { useEffect, useRef, useState } from 'react'
import { Network } from '@capacitor/network'
import { Capacitor } from '@capacitor/core'

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasConnected = useRef(true)

  useEffect(() => {
    let listenerHandle: any

    const handleStatusChange = (connected: boolean) => {

      if (connected) {
        if (!wasConnected.current) {
          // Was offline, now online — debounce before reload
          setIsReconnecting(true)
          reconnectTimer.current = setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
        wasConnected.current = true
        setIsConnected(true)
      } else {
        // Cancel any pending reconnect
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current)
          reconnectTimer.current = null
        }
        setIsReconnecting(false)
        wasConnected.current = false
        setIsConnected(false)
      }
    }

    const init = async () => {
      try {
        const status = await Network.getStatus()
        
        // Set initial state IMMEDIATELY from real device status
        setIsConnected(status.connected)
        wasConnected.current = status.connected

        // Listen for changes
        listenerHandle = await Network.addListener(
          'networkStatusChange',
          (status) => handleStatusChange(status.connected)
        )
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[Network] Failed to initialize:', err)
        }
        // Fail open — assume connected if plugin fails
        setIsConnected(true)
      }
    }

    init()

    return () => {
      listenerHandle?.remove()
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
    }
  }, [])

  return { isConnected, isReconnecting }
}
