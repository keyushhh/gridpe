# Grid.Pe
A hybrid modern platform for on-demand cash delivery, digital wallet management, and live FX exchange.

> **Vercel Demo**: To view the Vercel demo, login using phone number `8730889502`, OTP `123456`, and MPIN `8787`.
>
> Alternatively, if you don't want the login experience, simple use this link: https://gridpe-git-demo-keyushhhs-projects.vercel.app/#/home
> This skips the onboarding login flow, and takes you directly to the homepage to preview the app in its demo state.

## Overview
Grid.Pe is a pioneering fintech application designed to bridge the gap between digital finance and physical cash liquidity. Built as a comprehensive hybrid platform, it provides users with a robust digital wallet to store funds, a seamless order system to get cash delivered to their doorstep, and a unified foreign exchange interface for live currency conversion. It is specifically tailored to address the needs of underbanked regions and individuals reliant on secure, immediate, and convenient access to physical currency.

For developers landing on this repository, Grid.Pe is constructed using a React + Vite frontend packaged via Capacitor into native iOS and Android apps, while backed by full Supabase BAAS integration. From deep OS-level biometric security down to complex native haptics, the app implements standard, FAANG-level mobile UI/UX paradigms while handling sensitive financial data natively.

## Features
- **Customer App features**
  - Zing AI Chatbot: Custom-built LLM assistant with image parsing capabilities (`tesseract.js` + cloud AI logic).
  - Rewards workflows with an integrated ticket helpdesk system.
  - Native gesture integrations, customized haptic feedback, and unified dark/light themes.
  - Interactive map integration for accurate real-time address tagging via MapLibre GL and Plus Codes.
  
- **Authentication & Security features**
  - Passkey & Biometric integrations directly hooked via Capacitor standard secure storage plugins.
  - Multi-factor authentication (SMS OTP + MPIN + Biometrics).
  - Advanced multi-stage Identity & KYC verification (Document scanning, Live Selfie, Liveness detection with `react-webcam`).
  - Active lifecycle hooks for secure account retrieval and remote data deletion pipelines.
  
- **Wallet & Payments features**
  - Tiered wallet limits synchronized to KYC levels.
  - In-app integrations to top-up via verified internal bank loops (`AddBank`/`AddCard` integrations).
  - Granular split payout tracking covering bank accounts, wallets, and UPI pipelines.
  - Subscription tier tracking allowing power users lowered service fees.
  
- **Order Management features**
  - Complete On-Demand Cash flow. (Order -> Pending Hub Assignment -> Rider Assignment -> Safe Code OTP -> Dropped).
  - Specialized FX Exchange engine. Tracks and orders live spot currency; requires Passport KYC explicitly modeled out on the UI layer.
  - Deep telemetry across Delivery Hubs and Rider Geolocation paths.
  - Specific post-delivery workflows for viewing/verifying rider's KYC data guaranteeing safety.

## Tech Stack
| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React 18 (TypeScript) | Core UI logic and rendering interface |
| **Build Tool** | Vite | Rapid frontend bundling, optimizing and minifying tree-shakes |
| **Native Runtime** | Capacitor (v8) | Secure bridging to Native OS local APIs (Haptics, Biometrics, Secure Storage) |
| **Backend / DB** | Supabase (PostgreSQL) | Fully handled data/RPC queries and strict Row-Level-Security parameters |
| **Auth** | Supabase Auth + Biometrics | Passwordless OTPs, Session PKCE exchanges, linked internal native biometrics |
| **Storage** | Supabase Storage | Encrypted document parsing pipelines, Avatar uploads |
| **Payments / Logic**| Supabase Edge Functions | Internal handling of FX Live Rates proxying, Zing AI loops, Ledgering |
| **Push Notifications**| Capacitor Push / APNS+FCM | Routing critical order state updates directly to native OS payload handlers |

## Project Structure
- `src/assets` — Static iconography, Lottie assets, global image assets.
- `src/components` — Reusable, atomic UI elements (Sheets, Modals, Forms, Maps).
- `src/contexts` — Global React providers (UserContext, CustomToaster).
- `src/hooks` — Shared logical encapsulations (local haptics, sensitive field inputs).
- `src/lib` — Core integrations communicating to Backend/RPC wrappers (`wallet`, `orders`).
- `src/pages` — Core distinct route-rendered app functional screens (80+ specialized modules).
- `src/types` — Strongly typed entity shapes mapping symmetrically to Postgres structures.
- `src/utils` — Pure utility formatters (Crypto hashes, Bank logic parsing, Badge handlers).
- `supabase` — Local schema setup, Postgres edge functions, and CLI migration flags.

## Getting Started

### Prerequisites
- Node 22 (LTS ecosystem Recommended)
- Native Build Tooling (Xcode 15+ / Android Studio Hedgehog+)
- Active Supabase remote instance + defined Variable configuration.

### Installation
```bash
npm install
```

### Running the dev server
```bash
npm run dev
# Alternatively, to run isolated over the local network (for testing on hardware):
npm run dev:mobile
```

### Building for iOS
```bash
npm run build
npm run dev:ios
# Or manually step-by-step:
npx cap add ios
npx cap sync
npx cap open ios
```
*Requires an active Apple Developer Provisioning Profile for a physical device build.*

### Building for Android
```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

## Environment Variables
| Variable | Description | Required |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Root endpoint targeting the Supabase controller cluster. | Yes |
| `VITE_SUPABASE_ANON_KEY` | Public access key for authenticated limited-scope queries. | Yes |
| `VITE_MAP_API_KEY` | Controls map vector layer mapping (Provider Agnostic). | Yes |
| `VITE_TESSERACT_WORKER_URL` | Target path identifying local OCR extraction configurations. | Optional |

## Contributing
Follow standard fork-and-pull-request workflows. Ensure that strict Typescript interfaces are added to `src/types/database.ts` on schema alterations. Run `npm run lint` and verify build compatibility down to `vite build` prior to marking PRs ready for review.
