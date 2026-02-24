# Grid.Pe 🚀

> A modern, feature-rich customer application offering a digital wallet, cash delivery, foreign exchange (FX), and an AI-powered assistant.

Grid.Pe is a comprehensive financial and utility platform built for seamless user experiences across web and mobile. Whether managing a digital wallet, ordering cash for direct delivery, performing currency exchange, or verifying identity through robust KYC, Grid.Pe offers a state-of-the-art solution. 

## 🌟 Key Features

### 💰 Digital Wallet & Finance
- **Wallet Management**: Top up, withdraw, and track balances effortlessly.
- **Transaction History**: Detailed view of all incoming and outgoing funds.
- **Bank & Card Linking**: Securely add and manage payment methods via Stripe/other APIs.
- **Subscriptions**: Tiered wallet and subscription management for power users.

### 💵 Cash Delivery & FX (Foreign Exchange)
- **Order Cash**: Schedule and track physical cash deliveries directly to saved addresses.
- **Live FX Rates & Exchange**: View live foreign exchange rates and execute currency conversions.
- **Order Tracking**: Real-time status updates and geolocation from order placement to delivery.

### 🛡️ Security & KYC
- **Comprehensive KYC**: Multi-step identity verification including document upload and live selfies.
- **Secure Authentication**: MPIN login, and secure session management.
- **Account Control**: Advanced settings for profile management, data privacy, and secure account deletion.

### 🤖 Zing Chatbot & Support
- **AI Assistant (Zing)**: Interactive chatbot capable of handling user queries and analyzing image attachments.
- **Help & Support Ticket System**: For seamless user assistance and issue reporting.

### 📱 Cross-Platform Ready
- **PWA & Mobile Ready**: Built as a responsive web app and fully packaged for iOS and Android using Capacitor.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn-ui, class-variance-authority, clsx
- **Backend & Auth**: Supabase (Database, Storage, Auth), Clerk
- **Mobile Environment**: Capacitor (Native implementations for iOS & Android)
- **Maps & Location**: MapLibre GL, React Map GL, open-location-code
- **State & Data Fetching**: React Query
- **Form Management**: React Hook Form, Zod validation
- **Animations/UI Enhancements**: Lottie, Framer Motion (via shadcn), Embla Carousel, Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites

- Node.js & npm (v18+ recommended)
- A Supabase project for backend services & database

### Installation

1. **Clone the repository and install dependencies:**
   ```sh
   # Install dependencies
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and add your necessary environment variables (e.g., Supabase URL, API keys, Map API keys). 

3. **Start the development server:**
   ```sh
   # Auto-reloading development server
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or the port specified by Vite).

---

## 📱 Mobile Development (iOS & Android)

This project uses [Capacitor](https://capacitorjs.com/) to wrap the web app into native iOS and Android applications. Make sure you have Xcode/Android Studio installed depending on your target OS.

### Build the Web Assets
```sh
# Generate the production bundle in the 'dist' directory
npm run build
```

### iOS Setup
```sh
npm run dev:ios
# Or manually:
npx cap add ios
npx cap sync ios
npx cap open ios
```

### Android Setup
```sh
npx cap add android
npx cap sync android
npx cap open android
```

---

## 📸 App Walkthrough & User Flows

> **Note**: Add your own high-fidelity screenshots to the placeholders below to showcase the beautiful UI of the app.

### Core User Journey

1. **Onboarding & KYC**: New users register, verify their mobile via OTP, and complete the comprehensive KYC process (uploading passport/ID and completing a liveness selfie check) to unlock financial features.
2. **Funding the Wallet**: Users link their bank account or credit card securely to seamlessly top up their Grid.Pe wallet.
3. **Placing an Order**: From the dashboard, users can select `Order Cash` or `Exchange FX`, securely process the payment, and schedule a delivery window to their preferred address.
4. **Order Tracking**: After an order is placed, users have access to real-time maps and statuses to track the assigned rider securely until delivery.
5. **Getting Support**: Users can interact with the **Zing AI Chatbot** (which supports image analysis) or submit a conventional help ticket if any trouble arises.

### App Screenshots

| Home Dashboard | Wallet Overview | Zing Chatbot | Cash Delivery |
| :---: | :---: | :---: | :---: |
| ![Home](https://via.placeholder.com/250x500?text=Home+Screen) | ![Wallet](https://via.placeholder.com/250x500?text=Wallet+Screen) | ![Zing Chat](https://via.placeholder.com/250x500?text=Zing+Chat) | ![Cash](https://via.placeholder.com/250x500?text=Cash+Delivery) |

---

## 📝 License

*(Insert your proprietary or open-source license information here).*

---
