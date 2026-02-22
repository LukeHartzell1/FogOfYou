# FogOfYou

FogOfYou is a desktop privacy app that protects your digital identity by flooding trackers and data brokers with realistic noise — instead of trying to block tracking, it makes your real profile unrecognizable. Local autonomous agents browse harmless decoy content under rotating personas that are intentionally unlike you, raising your "profile entropy" until your data is worthless to advertisers.

## How It Works

1. You create **personas** — fake identities with distinct interests (e.g., "Midwestern Mom" who likes casserole recipes and school fundraisers).
2. Each persona runs an **autonomous browser agent** (Playwright) that navigates real websites — Wikipedia, BBC, YouTube, Amazon, Reddit, and more — using AI-generated topics tailored to that persona's interests.
3. Over time, the noise drowns out your real browsing signal. The dashboard tracks your **entropy score**, unique domains visited, and total queries generated.

## Features

- **8 Built-in Persona Templates** — Midwestern Mom, Tech Bro, Retired Veteran, College Student, Fitness Influencer, Conspiracy Theorist, Suburban Dad, K-Pop Stan — or create your own.
- **AI-Powered Browsing** — Google Gemini generates context-aware topics and navigates sites directly (no search engine CAPTCHAs).
- **Intensity Levels** — Low, Medium, or High controls how aggressively each persona browses.
- **Scheduling** — Set active hours and days per persona; the scheduler auto-starts and stops sessions.
- **Live Activity Feed** — Real-time dashboard showing what each persona is doing.
- **Privacy Metrics** — Total queries, unique domains, and Shannon entropy score.
- **Kill Switch** — Instantly halt all agents from Settings.
- **Safe List** — Optionally restrict browsing to a whitelist of approved domains.
- **Isolated Profiles** — Each persona gets a separate Chromium browser profile (cookies, history, fingerprint).
- **100% Local** — All data stored on your machine via electron-store. No cloud. No accounts.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Browser automation | Playwright (Chromium) |
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Persistence | electron-store |
| Build tooling | electron-vite, electron-builder |

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- A **Google Gemini API key** — get one free at [ai.google.dev](https://ai.google.dev)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/LukeHartzell1/FogOfYou.git
cd FogOfYou
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

Playwright needs to download Chromium the first time:

```bash
npx playwright install chromium
```

### 4. Configure your Gemini API key

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual key. This file is git-ignored.

Alternatively, you can enter the key in the app's **Settings** panel after launching.

### 5. Run in development mode

```bash
npm run dev
```

The Electron window will open automatically. **Do not** open the localhost URL in a regular browser — the app requires Electron's preload script to function.

### 6. Build for production (optional)

```bash
npm run build:win    # Windows (NSIS installer)
npm run build:mac    # macOS (DMG)
npm run build:linux  # Linux (AppImage, snap, deb)
```

## Usage

1. **Create a persona** — Click "New Persona" on the dashboard. Pick a template or fill in your own name, interests, schedule, intensity, and active days.
2. **Start the agent** — Click the green "Start" button on the persona card. A Chromium window opens and begins browsing.
3. **Monitor** — Watch the Live Activity feed and metrics update in real time.
4. **Stop** — Click "Stop" on the card, or use the kill switch in Settings to halt everything at once.

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # Window creation, IPC handlers
│   ├── agentRunner.ts     # Playwright browser automation loop
│   ├── llmService.ts      # Gemini API integration
│   ├── personaManager.ts  # CRUD for personas
│   ├── scheduler.ts       # Time-based auto start/stop
│   ├── store.ts           # electron-store config & defaults
│   └── types.ts           # Shared TypeScript interfaces
├── preload/               # Context bridge (IPC security layer)
│   └── index.ts
└── renderer/              # React frontend
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── Dashboard.tsx
        │   ├── PersonaCreator.tsx
        │   └── Settings.tsx
        ├── personaTemplates.ts
        └── types.ts
```

## Disclaimer

This tool is for educational and privacy research purposes. It generates harmless decoy browsing activity to obfuscate third-party tracking profiles. It does not click ads (no fraud), log into accounts, or visit sensitive sites. It does not hide your activity from your ISP or sites you log into directly.
