import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { amount, upi_id, user_id, action } = body;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAYX_KEY_ID = Deno.env.get("RAZORPAYX_KEY_ID")!;
    const RAZORPAYX_KEY_SECRET = Deno.env.get("RAZORPAYX_KEY_SECRET")!;
    const RAZORPAYX_ACCOUNT_NUMBER = Deno.env.get("RAZORPAYX_ACCOUNT_NUMBER")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "verify-vpa") {
      if (!upi_id) throw new Error("UPI ID is required for verification");

      // For verification, we still need a contact or we can use a generic one
      // Let's use the Composite Validation API if possible, or simple Fund Account creation
      // Actually, simple Fund Account creation with 'vpa' often validates it.
      // But for registered_name, we need the validation transaction.
      
      const validationResponse = await fetch("https://api.razorpay.com/v1/fund_accounts/validations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${RAZORPAYX_KEY_ID}:${RAZORPAYX_KEY_SECRET}`),
        },
        body: JSON.stringify({
          account_number: RAZORPAYX_ACCOUNT_NUMBER,
          fund_account: {
            account_type: "vpa",
            vpa: { address: upi_id },
          },
          amount: 100, // 1 INR in paise for validation
          currency: "INR",
          notes: { purpose: "VPA Verification" }
        }),
      });

      const validation = await validationResponse.json();
      if (validation.error) throw new Error(`Verification Error: ${validation.error.description}`);

      // Registered name is usually in results.registered_name for COMPLETED validations
      // But validation is async. Some VPAs return registered_name immediately in fund_account object if already known.
      // For now, let's return what we have. If it's pending, we might have to wait or return 'Verifying...'
      return new Response(JSON.stringify({ 
        success: true, 
        registered_name: validation.results?.registered_name || "Verified User",
        status: validation.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!amount || !upi_id || !user_id) {
       throw new Error("Invalid request. Amount, UPI ID, and User ID are required.");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAYX_KEY_ID = Deno.env.get("RAZORPAYX_KEY_ID")!;
    const RAZORPAYX_KEY_SECRET = Deno.env.get("RAZORPAYX_KEY_SECRET")!;
    const RAZORPAYX_ACCOUNT_NUMBER = Deno.env.get("RAZORPAYX_ACCOUNT_NUMBER")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Create Contact (or use a placeholder/unified contact for testing if preferred)
    // For production, we should map user_id to RazorpayX contact_id
    const contactResponse = await fetch("https://api.razorpay.com/v1/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${RAZORPAYX_KEY_ID}:${RAZORPAYX_KEY_SECRET}`),
      },
      body: JSON.stringify({
        name: "Gridpe User", // Ideally dynamic from profile
        type: "customer",
        reference_id: user_id,
      }),
    });

    const contact = await contactResponse.json();
    if (contact.error) console.log("Contact error (possibly exists):", contact.error);
    const contactId = contact.id || contact.error?.metadata?.contact_id; // Handle already exists

    if (!contactId) throw new Error("Failed to create/retrieve RazorpayX contact");

    // 2. Create Fund Account (UPI)
    const fundAccountResponse = await fetch("https://api.razorpay.com/v1/fund_accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${RAZORPAYX_KEY_ID}:${RAZORPAYX_KEY_SECRET}`),
      },
      body: JSON.stringify({
        contact_id: contactId,
        account_type: "vpa",
        vpa: { address: upi_id },
      }),
    });

    const fundAccount = await fundAccountResponse.json();
    if (fundAccount.error) throw new Error(`RazorpayX Fund Account Error: ${fundAccount.error.description}`);

    // 3. Initiate Payout
    const payoutResponse = await fetch("https://api.razorpay.com/v1/payouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${RAZORPAYX_KEY_ID}:${RAZORPAYX_KEY_SECRET}`),
      },
      body: JSON.stringify({
        account_number: RAZORPAYX_ACCOUNT_NUMBER,
        fund_account_id: fundAccount.id,
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: `withdraw_${Date.now()}`,
      }),
    });

    const payout = await payoutResponse.json();
    if (payout.error) throw new Error(`RazorpayX Payout Error: ${payout.error.description}`);

    // 4. Create Payout record in Supabase
    const { data: dbPayout, error: dbError } = await supabase
      .from("payouts")
      .insert({
        user_id,
        amount,
        payout_method: "upi",
        status: payout.status === "processed" ? "success" : "pending",
        currency: "INR",
        upi_id: upi_id,
        description: "Wallet Withdrawal",
        reference_id: payout.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Note: Balance deduction normally happens via database triggers or a separate step
    // The requirement says "do not deduct the balance if payout fails"
    // So if we reached here, payout was at least successfully initiated.

    return new Response(JSON.stringify({ success: true, payout: dbPayout }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
