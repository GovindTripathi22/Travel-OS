# 🧭 Sahyatri — Autonomous Multi-Traveler Companion OS

> **The next-generation group travel operating system with 1-click JARVIS Voice Copilot, offline mechanism voting, and automated debt minimization.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Security-orange?logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

Group trips frequently derail due to communication fragmentation, differing circadian rhythms, dietary restrictions, split expenses friction, and itinerary veto paralysis.

**Sahyatri** (सहयात्री — *"Co-Traveler"*) solves this with an intelligent multi-agent travel operating system powered by:
- **1-Click JARVIS Voice OS**: 100% offline, local browser-native voice agent that controls the entire platform hands-free with sub-15ms response latency.
- **Group Mechanism Voting**: Quadratic Voting with voice credit budgets and Borda Count to make collective decisions with zero veto deadlocks.
- **Bipartite Debt Minimizer**: Financial graph optimization engine that collapses complex shared expenses into the minimum possible transactions.
- **Proactive Constraint Sentinel**: Automatic conflict detection for dietary guidelines (e.g. Jain, low-sodium), elder mobility, and pace mismatches.
- **Firebase Authentication & RBAC**: Real authentication with granular companion roles (Trip Admin, Senior Mode, Kid Mode, Companion).

---

## 🎙️ JARVIS Voice Copilot (100% In-House & Offline)

JARVIS operates entirely client-side without relying on third-party cloud LLMs:
- **1-Click Activation**: Click the header `JARVIS` button, banner button, floating Arc Reactor orb, or press `Alt + J` to begin speaking immediately.
- **Acoustic Mutex Engine**: Prevents audio feedback loops by isolating Web Speech recognition while JARVIS is speaking speech synthesis responses.
- **Web Audio Sound Effects**: Code-synthesized Iron Man wake chirps, confirmation triads, and alert chimes synthesized in real-time.
- **Complete Website Control**:
  - *"Jarvis, show expenses"* $\rightarrow$ Navigates to expense ledger.
  - *"Jarvis, add ₹1,200 for lunch paid by Rohan"* $\rightarrow$ Logs expense & rebalances debt graph.
  - *"Jarvis, vote for Puppet Workshop"* $\rightarrow$ Allocates quadratic voting credits.
  - *"Jarvis, finalize the poll"* $\rightarrow$ Resolves consensus and updates the itinerary.
  - *"Jarvis, group is tired, add rest buffer"* $\rightarrow$ Dynamically injects downtime buffer.
  - *"Jarvis, when is Dadaji's medicine?"* $\rightarrow$ Reports BP medication schedule & stairs warning.
  - *"Jarvis, show my boarding pass and ticket QR"* $\rightarrow$ Displays offline pass.
  - *"Jarvis, switch to Dadaji"* $\rightarrow$ Switches UI into high-contrast, large-font Senior Mode.
  - *"Jarvis, emergency SOS"* $\rightarrow$ Triggers offline hospital and police emergency protocols.

---

## 📐 Architecture & Key Algorithms

```
sahyatri-travel-os/
├── src/
│   ├── components/
│   │   ├── jarvis/           # JARVIS Voice Orb, HUD Modal, SOS Emergency Sentinel
│   │   ├── decision/         # Quadratic Voting & Borda Count Polls
│   │   ├── expenses/         # Debt Ledger & Settlement Visualizer
│   │   ├── itinerary/        # Adaptive Timeline with Rest Buffers
│   │   ├── personas/         # Standard Mode, Senior Mode, Kid Mode Views
│   │   ├── status/           # Airport Rendezvous Point & Flight Checkpoints
│   │   └── vault/            # Document Vault with Offline QR Passes
│   ├── lib/
│   │   ├── agents/           # In-House Deterministic JARVIS NLP Brain
│   │   ├── algorithms/       # Debt Minimizer, Conflict Detector, Voting Engines
│   │   ├── audio/            # Web Audio API Acoustic Sound Engine
│   │   ├── auth/             # Firebase Auth Provider & RBAC Context
│   │   └── state/            # Reactive TripContext Global State
└── public/                   # Offline PWA assets & branding
```

### 1. Debt Minimizer Graph Algorithm
Computes net balances across all companions and resolves debts via a greedy bipartite matching algorithm, reducing $O(N^2)$ informal transfers to at most $N-1$ optimal bank transfers.

### 2. Quadratic Voting Mechanism
Each traveler receives 100 Voice Credits. Casting $k$ votes for an option costs $k^2$ credits, allowing intense preferences to be registered without enabling majority-vote tyranny.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/GovindTripathi22/sahyatri-travel-os.git
cd sahyatri-travel-os

# Install dependencies
npm install
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env.local` to enable Firebase Auth:
```bash
cp .env.example .env.local
```
Configure your Firebase project credentials in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security & Privacy
- **Client-Side AI**: Voice recognition and parsing run strictly in the browser. Zero voice data is transmitted to external AI APIs.
- **Secure Credentials**: All Firebase secrets and API keys are protected in `.env.local` and excluded by `.gitignore`.

---

## 📄 License
Released under the [MIT License](LICENSE).
