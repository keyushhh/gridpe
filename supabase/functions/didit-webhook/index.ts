export const config = { auth: false };
declare const Deno: any;
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const REPLAY_WINDOW_SECONDS = 300;

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Verify the webhook is genuinely from Didit before trusting anything in the body.
  // Didit signs HMAC-SHA256(rawBody) hex-encoded in X-Signature, plus X-Timestamp for replay protection.
  const signatureHeader = req.headers.get('x-signature');
  const timestampHeader = req.headers.get('x-timestamp');
  const rawBody = await req.text();

  if (!signatureHeader || !timestampHeader) {
    console.warn('Missing Didit webhook signature headers');
    return new Response(JSON.stringify({ error: 'Missing signature headers' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestampHeader, 10)) > REPLAY_WINDOW_SECONDS) {
    console.warn('Didit webhook timestamp outside replay window');
    return new Response(JSON.stringify({ error: 'Stale timestamp' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const diditWebhookSecret = Deno.env.get('DIDIT_WEBHOOK_SECRET_KEY');
  if (!diditWebhookSecret) {
    console.error('DIDIT_WEBHOOK_SECRET_KEY not set');
    return new Response(JSON.stringify({ error: 'Internal configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const expectedSignature = crypto
    .createHmac('sha256', diditWebhookSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const receivedBuf = Buffer.from(signatureHeader, 'utf8');
  const signatureValid =
    expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (!signatureValid) {
    console.warn('Invalid Didit webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);

    // Point 4: Log raw payload to a dedicated table for visibility even if Supabase logs fail
    try {
      await supabase.from('webhook_logs').insert({
        payload: payload,
        event_type: payload.event || 'unknown',
        vendor_data: payload.data?.vendor_data || null
      });
    } catch (logErr: any) {
      console.warn('Failed to log to webhook_logs table (Check if table exists):', logErr?.message || logErr);
    }

    const { event, data } = payload;

    // We only care if the verification is 'completed' or 'approved'
    if (event === 'verification.completed' || event === 'verification.approved') {
      
      // Extract true UUID (removing appended timestamp cache-buster if present e.g., uuid_p_1234567)
      const rawVendorData = data.vendor_data || '';
      const userId = rawVendorData.split('_')[0]; 

      const diditStatus = data.status?.toLowerCase();
      // Being flexible with status strings from Didit
      const isApproved = ['approved', 'completed', 'success', 'verified'].includes(diditStatus);
      const status = isApproved ? 'verified' : 'rejected';
      
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Failed to parse metadata string:', metadata);
        }
      }
      
      const userType = metadata?.user_type || 'customer'; // Default to customer
      const table = userType === 'customer' ? 'profiles' : 'riders';
      

      const updatePayload: any = { kyc_status: status };

      // Updated Passport Detection (Point 2: _p_ and Point 1: Metadata Check)
      const isPassportDetected = 
        rawVendorData.includes('_passport') || 
        rawVendorData.includes('_p_') || 
        ['fx_passport'].includes(metadata?.flow) ||
        data.extraction?.document_type?.toLowerCase() === 'passport' ||
        data.document_type?.toLowerCase() === 'passport';

      if (userType === 'customer' && isPassportDetected && status === 'verified') {
        updatePayload.is_passport_verified = true;
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', userId);

      if (updateError) {
        console.error(`Database Update Error for ${table}:`, updateError);
        throw updateError;
      }

    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error('Webhook Global Handler Error:', err?.message || err);
    
    // Attempt to log error to DB if possible
    try {
      await supabase.from('webhook_logs').insert({
        error: err?.message || String(err),
        payload: payload || null,
        event_type: 'error'
      });
    } catch (dbErr: any) {
       console.error('Critical: Failed to log error to database:', dbErr?.message || dbErr);
    }

    return new Response(JSON.stringify({ error: err?.message || String(err) }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
})