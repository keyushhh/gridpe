import type { KnowledgeModule } from "./types.ts";

export const kycKnowledge: KnowledgeModule = {
  title: "KYC & Verification Knowledge",
  version: 1,
  sourceFiles: [
    "src/pages/KYCIntro.tsx",
    "src/pages/KYCForm.tsx",
    "supabase/functions/didit-webhook/index.ts",
    "src/lib/helpData.ts",
  ],
  lastValidated: "repository",
  content: `
- KYC Overview:
  * Customer KYC identity verification is required per RBI guidelines to unlock higher daily/monthly transaction limits.
  * Verified KYC boosts daily delivery limits.
- Identity Documents:
  * Standard KYC accepts: Aadhar Card, PAN Card, Driving License, Voter ID, Passport.
  * Specialized FX flow strictly requires Passport verification.
  * Automated document verification is handled securely via Didit SDK integration.
- Document Requirements:
  * Submissions must be original, unedited, full-size, readable, colored photos taken against a single-colored background.
  * Blurry photos or mismatched details lead to KYC failure.
- Status Lifecycle:
  * KYC statuses: 'unverified' / 'not_started', 'pending', 'verified', 'failed' / 'rejected'.
  * If KYC fails, users can re-upload corrected documents.
`,
};
