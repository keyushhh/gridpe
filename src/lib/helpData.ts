export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  description?: string;
  faqs: FAQItem[];
}

export const helpCategories: Record<string, HelpCategory> = {
  'general-issues': {
    id: 'general-issues',
    title: 'General Issues',
    faqs: [
      {
        id: '1',
        question: 'App won’t open / keeps crashing',
        answer:
          'Give it the ol’ off-and-on trick. If that doesn’t work, update the app. Still dead? Call us before you throw your phone.',
      },
      {
        id: '2',
        question: 'Not getting OTP',
        answer:
          'Network acting sus? Make sure your SIM’s alive and not blocking messages. Try again after a coffee break.',
      },
      {
        id: '3',
        question: 'Order missing from history',
        answer: 'Pull-to-refresh like you mean it. Still gone? Ping us with your order ID.',
      },
      {
        id: '4',
        question: 'Can’t log in',
        answer:
          'Right number, wrong mood? Double-check your digits. Changed your number? You’ll need our help.',
      },
      {
        id: '5',
        question: 'App moving slower than Monday mornings',
        answer: 'Clear the app cache and check your internet speed. Or maybe it’s just you.',
      },
      {
        id: '6',
        question: 'Notifications ghosting you',
        answer:
          'Enable notifications for GridPe in your phone settings. And maybe stop ignoring us.',
      },
      {
        id: '7',
        question: 'Payment gone, order failed',
        answer: 'Don’t panic — your money’s safe. Refunds usually slide back in 2–5 business days.',
      },
      {
        id: '8',
        question: 'KYC keeps failing',
        answer:
          'Blurry pics and mismatched details are KYC’s worst enemies. Shoot in daylight and make sure the info matches.',
      },
      {
        id: '9',
        question: 'Location not showing',
        answer: 'Turn on location services. We can’t read minds (yet).',
      },
      {
        id: '10',
        question: 'Rider MIA',
        answer:
          'If your rider’s gone rogue, hit “Need Help” in the order page. We’ll send in the cavalry.',
      },
    ],
  },
  faqs: {
    id: 'faqs',
    title: 'FAQ’s',
    faqs: [
      { id: '1', question: 'How do I join GridPe?', answer: 'Download. OTP. Boom — you’re in.' },
      {
        id: '2',
        question: 'How do I place an order?',
        answer: 'Pick what you want, enter the details, pay, and we handle the rest.',
      },
      {
        id: '3',
        question: 'What’s a GridPe Wallet?',
        answer: 'Your personal stash for instant payments. Load it, spend it, repeat.',
      },
      {
        id: '4',
        question: 'What time are you open?',
        answer: 'You can order anytime, but riders need their beauty sleep too.',
      },
      {
        id: '5',
        question: 'Any extra charges?',
        answer: 'Sometimes, yes. We’ll show you before you pay so you don’t faint later.',
      },
      { id: '6', question: 'Updating my details?', answer: 'Profile → Edit → Save. Easy.' },
      {
        id: '7',
        question: 'Why do I need KYC?',
        answer: 'Because the RBI says so. And we like keeping things safe.',
      },
      {
        id: '8',
        question: 'How do I withdraw from my wallet?',
        answer: 'Wallet → Withdraw → Bank details → Done.',
      },
      {
        id: '9',
        question: 'How can I reach you?',
        answer:
          'Help & Support → Call us between 9 AM to 9 PM. Chat coming soon for the anti-calling crowd.',
      },
      {
        id: '10',
        question: 'Refunds?',
        answer: 'Failed payment? Expect your money back in 2–5 business days. No chasing needed.',
      },
      {
        id: '11',
        question: 'Can I schedule an order for later?',
        answer: 'Yes. Pick a date, pick a time, and we’ll send a rider like clockwork.',
      },
    ],
  },
  'wallet-faqs': {
    id: 'wallet-faqs',
    title: 'WALLET FAQ’S',
    faqs: [
      {
        id: '1',
        question: 'What’s the GridPe Wallet?',
        answer:
          'Think of it as your personal cash vault — but digital, instant, and impossible to lose under the sofa.',
      },
      {
        id: '2',
        question: 'How do I add money to my wallet?',
        answer:
          'UPI, debit/credit cards, or bank transfer — pick your poison and top it up in seconds.',
      },
      {
        id: '3',
        question: 'Is there a limit to how much I can add?',
        answer:
          'Yep. RBI says no to unlimited money hoarding. Check your app for your current limit.',
      },
      {
        id: '4',
        question: 'Can I send wallet money to my bank?',
        answer: 'Of course. Wallet → Withdraw → Enter bank details → Done. No drama.',
      },
      {
        id: '5',
        question: 'Are there fees for wallet transfers?',
        answer:
          'Adding money is free. Sending out might have a small fee — we’ll tell you upfront so there’s no “surprise!” moment.',
      },
      {
        id: '6',
        question: 'My wallet balance is wrong',
        answer: 'Refresh the page. If it’s still off, we’ll play detective for you.',
      },
      {
        id: '7',
        question: 'How safe is my wallet?',
        answer:
          'Safer than your piggy bank. Every transaction is encrypted and locked with your MPIN/biometric.',
      },
      {
        id: '8',
        question: 'Can I pay directly from my wallet?',
        answer: 'Yes, and it’s faster than digging for your card.',
      },
      {
        id: '9',
        question: 'What happens if I delete my account?',
        answer:
          'Your wallet balance will be refunded to your linked bank account before we say goodbye.',
      },
      {
        id: '10',
        question: 'My wallet top-up failed but money got deducted',
        answer: 'Relax — it’ll bounce back in 2–5 business days.',
      },
    ],
  },
  onboarding: {
    id: 'onboarding',
    title: 'PARTNER ONBOARDING',
    faqs: [
      {
        id: '1',
        question: 'Who can become a GridPe partner?',
        answer: 'If you’ve got a bank account, valid ID, and the hustle — you’re welcome.',
      },
      {
        id: '2',
        question: 'How do I sign up as a partner?',
        answer:
          'Download the GridPe Partner app → Enter details → Upload docs → Wait for our “You’re in!” message.',
      },
      {
        id: '3',
        question: 'What documents do I need?',
        answer:
          'Government ID, address proof, and bank details. Basically, the same stuff your bank loves to bother you for.',
      },
      {
        id: '4',
        question: 'How long does approval take?',
        answer: 'Usually within 24–48 hours. Faster if your photos aren’t blurry.',
      },
      {
        id: '5',
        question: 'Do I need to pay any joining fees?',
        answer: 'Nope. Zero. Nada. Just bring your documents and you’re good.',
      },
      {
        id: '6',
        question: 'How do I get orders after joining?',
        answer:
          'Once approved, you’ll start getting order notifications based on your location and availability.',
      },
      {
        id: '7',
        question: 'Can I choose my working hours?',
        answer: 'Yes — be your own boss. Just remember, no work = no earnings.',
      },
      {
        id: '8',
        question: 'How will I get paid?',
        answer:
          'Earnings are transferred directly to your linked bank account. Weekly or faster, depending on your plan.',
      },
      {
        id: '9',
        question: 'What happens if my KYC fails?',
        answer: 'We’ll tell you why, and you can re-upload the right documents.',
      },
      {
        id: '10',
        question: 'Can I pause receiving orders?',
        answer: 'Yes — toggle your availability in the app whenever you need a break.',
      },
    ],
  },
};
