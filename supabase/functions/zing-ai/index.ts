export const config = { auth: false };
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts" 

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sassy Templates
const INTROS = [
    "Oh, look who's back. ",
    "Let me check my infinite database for that... ",
    "Sigh. Here we go again. ",
    "You know I'm an AI, not a miracle worker, right? ",
    "Asking the tough questions today, are we? ",
    "Hold on, let me put on my thinking cap. ",
];

const OUTROS = [
    " You're welcome.",
    " Any other brain-busters?",
    " Don't spend it all in one place.",
    " Try not to break anything else.",
    " Now, go conquer the world or whatever.",
    " Happy to help (I guess).",
];

const FALLBACKS = [
    "I have absolutely no idea what you're talking about. Is that even English? Try asking about orders, login, or refunds.",
    "404 Error: Zing's brain not found on that topic. Try contacting support for the complex human stuff.",
    "I'm a sassy bot, not a mind reader. Stick to the basics: wallet, orders, or why I'm so cool.",
    "That sounds like a 'you' problem. Maybe check the Help & Support section?",
    "I'm ignoring that request because I didn't understand it. Try asking 'Where is my order?' instead.",
];

// Knowledge Base
const FAQ_DB = [
    // General / App Issues
    {
        keywords: ["crash", "bug", "stopped", "working", "slow", "lag"],
        answer: "If the app is acting up, try the classic 'turn it off and on again'. Clear your cache or check your internet. If it still fails, blame the developers (not me)."
    },
    {
        keywords: ["otp", "code", "sms"],
        answer: "No OTP? Check your network bars. If you're in a bunker, come out. Also, make sure your SIM is active."
    },
    {
        keywords: ["login", "sign in", "log in", "access"],
        answer: "Can't get in? Double-check those digits. If you changed your number, you'll need to contact support to get back in."
    },
    {
        keywords: ["notification", "alert", "message"],
        answer: "Enable notifications in settings if you want to hear from us. If you turned them off, don't complain about missing out!"
    },
    {
        keywords: ["location", "gps", "map"],
        answer: "I need to know where you are to help. Turn on your location services. I promise I'm not stalking you (much)."
    },

    // Orders & Riders
    {
        keywords: ["order", "missing", "late", "food", "delivery", "item"],
        answer: "Missing order? Check your order history first. If it's truly lost in the void, hit the 'Need Help' button on the order page."
    },
    {
        keywords: ["rider", "driver", "delivery partner"],
        answer: "Rider went MIA? They might be stuck in traffic or fighting a dragon. Use the 'Need Help' button on your order to track them down."
    },

    // Wallet & Payments

    {
        keywords: ["refund", "money back", "return"],
        answer: "Refunds usually take 2-5 business days. Your money is safe, it just likes to take the scenic route back to your bank."
    },

    {
        keywords: ["fail", "payment failed", "transaction"],
        answer: "Payment failed? Don't panic. If money was deducted, it'll be auto-refunded in 2-5 days. We aren't thieves!"
    },
    {
        keywords: ["limit", "kyc"],
        answer: "RBI rules, not mine. You have limits on your wallet unless you complete your KYC. Blame the government."
    },

    // Partner
    {
        keywords: ["partner", "join", "drive", "earn"],
        answer: "Wanna join the fleet? Download the Partner app, upload your docs (ID, License), and wait 24-48 hours for approval. Zero joining fees!"
    },

    // Meta / Zing
    {
        keywords: ["zing", "who result", "who are you", "what are you"],
        answer: "I am Zing, the witty, slightly superior AI mascot of Grid.Pe. I'm here to help, roast, and serve."
    },
    {
        keywords: ["hello", "hi", "hey", "greetings"],
        answer: "Hello there, human. Ready to be productive or just here to chat?"
    }
];

const IMAGE_ANSWERS = [
    "I've scanned that document. It looks like... well, something only a human could create. Need a refund or just trying to impress me?",
    "Image received. I see pixels, I see shapes, I see... a potential support ticket. What's the plan?",
    "Nice photo. If I had eyes, I'd probably be impressed. Since I'm just a superior brain, tell me what you need help with regarding this document.",
    "Document analyzed. My circuits suggest you're looking for an update on this. Am I right, or am I right?",
];

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, hasImage } = await req.json();

        if (hasImage) {
            const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
            const analysis = IMAGE_ANSWERS[Math.floor(Math.random() * IMAGE_ANSWERS.length)];
            return new Response(
                JSON.stringify({ reply: `${intro}${analysis}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        if (!message) {
            return new Response(
                JSON.stringify({ reply: "Cat got your tongue? You sent an empty message." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const lowerMsg = message.toLowerCase();
        let matchedAnswer = null;

        // Simple keyword matching
        for (const entry of FAQ_DB) {
            if (entry.keywords.some(keyword => lowerMsg.includes(keyword))) {
                matchedAnswer = entry.answer;
                break; // Stop at first match
            }
        }

        let finalReply = "";

        if (matchedAnswer) {
            const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
            const outro = OUTROS[Math.floor(Math.random() * OUTROS.length)];
            finalReply = `${intro}${matchedAnswer}${outro}`;
        } else {
            finalReply = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
        }

        return new Response(
            JSON.stringify({ reply: finalReply }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (err: any) {
        console.error('Function Error:', err.message);
        return new Response(
            JSON.stringify({
                reply: "Zing's brain actually short-circuited this time.",
                error: err.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
