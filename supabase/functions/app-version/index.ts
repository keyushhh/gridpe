export const config = { auth: false };

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const VERSION_CONFIG: Record<string, any> = {
  customer: {
    ios: {
      minimumVersion: '1.0.0',
      latestVersion: '1.0.0',
      storeUrl: 'https://apps.apple.com/app/idYOUR_APP_ID',
    },
    android: {
      minimumVersion: '1.0.0',
      latestVersion: '1.0.0',
      storeUrl: 'https://play.google.com/store/apps/details?id=com.gridpe.customer',
    }
  },
  rider: {
    ios: {
      minimumVersion: '1.0.0',
      latestVersion: '1.0.0',
      storeUrl: 'https://apps.apple.com/app/idYOUR_RIDER_APP_ID',
    },
    android: {
      minimumVersion: '1.0.0',
      latestVersion: '1.0.0',
      storeUrl: 'https://play.google.com/store/apps/details?id=com.gridpe.rider',
    }
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  const app = url.searchParams.get('app') // 'customer' or 'rider'
  const platform = url.searchParams.get('platform') // 'ios' or 'android'

  if (!app || !platform) {
    return new Response(JSON.stringify({ error: 'Missing app or platform param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const config = VERSION_CONFIG[app]?.[platform]

  if (!config) {
    return new Response(JSON.stringify({ error: 'Invalid app or platform' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  })
})
