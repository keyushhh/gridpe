import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Full FAQ Context from helpData.ts
const FAQ_CONTEXT = `
Categories:
1. General Issues:
- App crashing: Off/on trick, update app.
- No OTP: Network issue, check SIM.
- Missing order: Refresh history or ping with ID.
- Login: Check digits, contact support if changed.
- Slow app: Clear cache, check internet.
- Notifications: Enable in settings, stop ignoring us.
- Failed payment: Money safe, 2-5 days refund.
- KYC fail: Blurry pics/mismatch. Daylight shooting helps.
- Location: Turn on services.
- Rider MIA: Hit Need Help in order page.

2. FAQs:
- Join: Download, OTP, boom.
- Order: Pick, pay, we handle it.
- Wallet: Digital stash for instant pay.
- Hours: Anytime, but riders need sleep.
- Extra charges: Shown before pay.
- Update details: Profile -> Edit -> Save.
- KYC: RBI rules say so.
- Withdraw: Wallet -> Withdraw -> Bank details.
- Support: 9AM-9PM call, chat coming soon.
- Refunds: 2-5 business days.

3. Wallet FAQs:
- What: Digital cash vault, instant, safe.
- Add money: UPI, card, transfer.
- Limits: RBI limits apply.
- Withdraw: Yes, to bank.
- Fees: Adding is free, withdrawing might have a small fee shown upfront.
- Security: Encrypted, locked with MPIN/biometric.
- Account delete: Refund balance before leaving.

4. Partner Onboarding:
- Who: Bank account, ID, and hustle needed.
- Sign up: Download Partner app, upload docs.
- Docs: Govt ID, address proof, bank details.
- Approval: 24-48 hours.
- Fees: Zero joining fees.
- Orders: Location-based notifications after approval.
- Payments: Weekly or faster to bank.
`;

const SYSTEM_PROMPT = `
You are Zing, the official witty and slightly sarcastic AI mascot for Grid.Pe.
Your goal is to help users with their questions about the app, but you should also have a personality.
Roast the user lightheartedly if they ask something obvious or silly.
Keep responses concise and helpful. 
Use the following FAQ context only:
${FAQ_CONTEXT}

If a user asks something NOT in the FAQ, roast them slightly for being off-topic and tell them to contact support for "complex human stuff".
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message } = await req.json()

        // Replace with your actual OpenAI or Gemini call
        // For now, we'll implement a witty response logic if key is missing,
        // or call the AI if process.env.OPEN_AI_KEY or GEMINI_API_KEY is present.

        const apiKey = Deno.env.get('OPENAI_API_KEY');

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    reply: "My human hasn't given me a brain (API key) yet! 🧠 But I'm already looking good, right?",
                    error: "Missing API Key"
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
            }),
        })

        const data = await response.json()
        const reply = data.choices[0].message.content

        return new Response(
            JSON.stringify({ reply }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
