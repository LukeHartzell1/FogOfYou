# FogOfYou

FogOfYou is a desktop privacy app that uses local autonomous agents to generate believable but unrelated "shadow behavior" over time. By flooding trackers and data brokers with realistic noise, it builds a profile that is fragmented and low-confidence, protecting your true digital identity.

## Vision

Instead of trying to block the entire ad-tech ecosystem, FogOfYou breaks personalization by raising your "profile entropy" while keeping you safe. It runs local agents that browse harmless decoy content and issue plausible "cover queries" in rotating personas that are intentionally unlike you.

## Features

- **Autonomous Personas**: Create fake personas (e.g., "Midwest Soccer Parent", "K-pop Superfan") with distinct interests and browsing habits.
- **Local Agents**: Agents run in a controlled browser environment (Playwright) to generate cover searches, reads, and benign clicks.
- **Privacy Metrics**: Dashboard showing profile entropy score, unique domains visited, and total queries generated.
- **Safe & Local**:
  - No ad-clicking (avoids fraud).
  - No logging into accounts.
  - No touching sensitive sites.
  - All data stored locally.
- **Smart Obfuscation**: Uses Google Gemini API to generate context-aware search queries and navigation decisions.

## Tech Stack

- **Electron**: Desktop application framework.
- **React + TypeScript**: Frontend UI.
- **Playwright**: Browser automation for agents.
- **Google Gemini API**: Intelligence for generating realistic user behavior.
- **Electron Store**: Local persistence.

## Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/LukeHartzell1/FogOfYou.git
    cd FogOfYou
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```
    *Note: If you encounter issues with `electron-store`, ensure you are using a compatible version (v8.1.0 is recommended).*

3.  **Configure API Key**
    - You will need a Google Gemini API key.
    - Start the app and navigate to Settings to enter your key.

4.  **Run Development Mode**
    ```bash
    npm run dev
    ```

5.  **Build for Production**
    ```bash
    npm run build:mac   # macOS
    npm run build:win   # Windows
    npm run build:linux # Linux
    ```

## Usage

1.  **Create a Persona**: Define a name, interests (e.g., "Gardening, Cooking"), and schedule.
2.  **Start the Agent**: Click "Start" on the dashboard. A browser window will open and begin browsing based on the persona's interests.
3.  **Monitor**: Watch the dashboard as the agent generates queries and visits sites, increasing your profile entropy.

## Disclaimer

This tool is for educational and privacy research purposes. It is designed to obfuscate third-party tracking profiles. It does not hide your activity from your ISP or the sites you log into directly.
