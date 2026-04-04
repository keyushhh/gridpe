import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    // We only care if the verification is 'completed' or 'approved'
    if (event === 'verification.completed') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Extract true UUID (removing appended timestamp cache-buster if present e.g., uuid_1234567)
      const rawVendorData = data.vendor_data || '';
      const userId = rawVendorData.split('_')[0]; 

      const diditStatus = data.status?.toLowerCase();
      const status = (diditStatus === 'approved' || diditStatus === 'completed') ? 'verified' : 'rejected';
      
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Failed to parse metadata string:', metadata);
        }
      }
      
      const userType = metadata?.user_type; // 'rider' or 'customer'

      const table = userType === 'customer' ? 'profiles' : 'riders';
      
      console.log(`Updating ${table} for UUID:`, userId);

      const updatePayload: any = { kyc_status: status };

      const isPassportDetected = 
        rawVendorData.includes('_passport') || 
        ['fx_passport', 'fx_upgrade'].includes(metadata?.flow) ||
        data.extraction?.document_type?.toLowerCase() === 'passport' ||
        data.document_type?.toLowerCase() === 'passport';

      if (userType === 'customer' && isPassportDetected && status === 'verified') {
        updatePayload.is_passport_verified = true;
      }

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', userId);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return new Response(err.message, { status: 400 });
  }
})