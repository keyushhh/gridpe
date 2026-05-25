import { useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { compareSemver } from '../utils/semver'

export type UpdateStatus = 'none' | 'soft' | 'force'

export function useAppUpdateCheck(appId: 'customer' | 'rider') {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('none')
  const [storeUrl, setStoreUrl] = useState('')

  useEffect(() => {
    const check = async () => {
      const platform = Capacitor.getPlatform()
      if (platform === 'web') return // skip on web/dev

      try {
        const info = await App.getInfo()
        const currentVersion = info.version // e.g. '1.0.0'
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxvbmvnrggsgetqswmjs.supabase.co';

        const res = await fetch(
          `${supabaseUrl}/functions/v1/app-version?app=${appId}&platform=${platform}`,
          { signal: AbortSignal.timeout(5000) }
        )

        if (!res.ok) return

        const data = await res.json()

        setStoreUrl(data.storeUrl)

        if (compareSemver(currentVersion, data.minimumVersion) < 0) {
          setUpdateStatus('force')
        } else if (compareSemver(currentVersion, data.latestVersion) < 0) {
          setUpdateStatus('soft')
        } else {
          setUpdateStatus('none')
        }
      } catch {
        // Silently fail — never block the app due to update check failure
      }
    }

    check()
  }, [appId])

  return { updateStatus, storeUrl, setUpdateStatus }
}
