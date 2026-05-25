import { useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { ASSETS } from '@/constants/assets'

// IMPORTANT RULES:
// - The overlay must appear INSTANTLY — no animation, no fade, no delay
// - Do not use backdrop-filter: blur() — it's too slow and the screenshot is taken before it renders
// - Do not add any "Your screen is protected" messaging — keep it clean
// - FLAG_SECURE on Android also blocks screenshots within the app — this is intentional and standard for fintech apps (GPay, CRED etc. all do this)
// - If the app already uses FLAG_SECURE or has any window security flags, do not duplicate

export function PrivacyScreen() {
  const [isObscured, setIsObscured] = useState(false)

  useEffect(() => {
    // iOS: native AppDelegate handles it
    // Android: FLAG_SECURE handles it  
    // Web: JS overlay handles it (dev preview only)
    if (Capacitor.getPlatform() !== 'web') return

    let listenerHandle: any

    App.addListener('appStateChange', ({ isActive }) => {
      setIsObscured(!isActive)
    }).then(handle => {
      listenerHandle = handle
    })

    return () => {
      listenerHandle?.remove()
    }
  }, [])

  if (!isObscured) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#0A0A12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img src={ASSETS.GRIDPE_LOGO} alt="Grid.Pe" style={{ width: '32px', height: '32px' }} />
      </div>
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 0.2,
      }}>grid.pe</span>
    </div>
  )
}
