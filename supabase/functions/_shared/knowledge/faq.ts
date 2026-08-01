import type { KnowledgeModule } from "./types.ts";

export const faqKnowledge: KnowledgeModule = {
  title: "Frequently Asked Questions (FAQ)",
  version: 1,
  sourceFiles: [
    "src/lib/helpData.ts",
    "supabase/functions/zing-ai/index.ts",
  ],
  lastValidated: "repository",
  content: `
- Operating & Support Timings:
  * Customer phone support: 9:00 AM to 9:00 PM via Help & Support.
- Driver / Partner Onboarding:
  * To become a delivery partner: Download Partner app, submit valid ID, address proof, and bank details.
  * Partner approval takes 24–48 hours; zero joining fee.
`,
};
