<div align="center">

# 🛰️ FODX Scout

### Find better prospects. Understand their needs. Build smarter outreach.

An AI-powered business intelligence and prospect discovery platform built for independent developers, freelancers, and digital agencies.

Discover real businesses, identify digital opportunities, investigate potential clients, and generate personalized outreach backed by evidence.

<br />

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![AI Powered](https://img.shields.io/badge/AI-Tool--Calling-8A63D2?style=flat-square)](#-ai-powered-investigations)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

<br />

**Real businesses. Verifiable evidence. Actionable opportunities.**

</div>

---

## The Idea

Finding clients is one of the biggest challenges for freelance developers.

There are businesses that need better websites, stronger online visibility, or improved digital experiences. The challenge is identifying them, understanding their needs, and reaching out with something genuinely useful to offer.

**FODX Scout helps turn that process into a structured, evidence-driven workflow.**

Instead of generating fictional leads or producing generic sales messages, it discovers real businesses, examines their publicly accessible online presence, evaluates potential opportunities, and helps you decide who to contact first.

The project started with a simple goal: **help developers find their next client, starting with local businesses in Al Hoceima, Morocco.**

It is designed to support searches in other cities and countries, too.

## ✨ What You Can Do

| Capability | Description |
| --- | --- |
| 🔎 Business Discovery | Find real businesses using OpenStreetMap data and the Overpass API. |
| 🧠 AI Investigations | Let a tool-calling AI agent investigate prospects using a controlled set of backend tools. |
| 🌐 Website Inspection | Examine public websites for common technical and SEO issues. |
| 📊 Opportunity Scoring | Rank prospects using a transparent, deterministic scoring system. |
| ✍️ Personalized Outreach | Generate evidence-based outreach drafts in French, English, or Arabic. |
| 📋 Lead Management | Import businesses, qualify prospects, and manage lead information. |
| 📈 CSV Reports | Export lead data for spreadsheets and external CRM workflows. |
| ⚡ Live Investigations | Follow investigation progress through a real-time Server-Sent Events stream. |

---

## 🔄 How It Works

FODX Scout brings prospect research into one workflow.

**01 — Discover**

Search for businesses by location and category. Retrieve real-world business data from OpenStreetMap through the Overpass API.

**02 — Qualify**

Import relevant businesses into your workspace and turn promising candidates into leads.

**03 — Investigate**

Inspect available websites and collect evidence about potential digital improvements, such as missing SEO metadata or contact information.

**04 — Prioritize**

Calculate an opportunity score using explicit rules. Understand why a prospect may be worth contacting instead of relying on an unexplained AI-generated rating.

**05 — Prepare Outreach**

Generate a personalized message based on verified information and identified opportunities.

**06 — Export**

Download your lead data as a CSV file for reporting, spreadsheet analysis, or further CRM processing.

> FODX Scout supports research and decision-making. It does not automatically contact businesses or send unsolicited messages.

---

## 🧠 AI-Powered Investigations

The AI agent is designed to do more than generate text.

It can work through a bounded tool-calling loop, using registered backend tools to investigate prospects, gather available evidence, and organize findings into a useful workflow.

### What makes it different?

- **Tool-based investigation:** The model can request supported operations instead of relying entirely on its existing knowledge.
- **Evidence-first reasoning:** Investigations use information gathered from the application rather than treating assumptions as facts.
- **Controlled execution:** The agent operates through a predefined tool registry instead of having unrestricted access to the server.
- **Provider flexibility:** Use a compatible hosted AI API or a locally running Ollama model.
- **Resilient requests:** The agent loop can pause and retry when supported AI providers return rate-limit responses.
- **Human oversight:** Generated recommendations and outreach drafts remain under the developer's control.

### Supported AI Providers

FODX Scout supports an OpenAI-compatible API configuration, including Groq, as well as local Ollama deployments.

This keeps the AI integration flexible without tying the application to a single provider.

---

## 🛠️ Technology Stack

FODX Scout is organized as a TypeScript monorepo using npm workspaces.

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Styling | Tailwind CSS |
| Data Fetching | TanStack Query |
| Navigation | React Router |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite, better-sqlite3 |
| Validation | Zod |
| Real-Time Updates | Server-Sent Events (SSE) |
| AI Integration | OpenAI-compatible APIs, Groq, Ollama |
| Business Data | OpenStreetMap, Overpass API |
| Geocoding | Nominatim |

### Architecture

The application separates the user interface, backend services, and shared types into independent workspace packages.

```text
fodx-scout/
│
├── apps/
│   ├── api/                 # Express API and backend services
│   │   ├── Agent logic      # AI investigation workflow
│   │   ├── Database         # SQLite persistence and migrations
│   │   └── Routes           # Application API endpoints
│   │
│   └── web/                 # React + Vite frontend
│
├── packages/
│   └── shared/              # Shared schemas and TypeScript types
│
├── .env.example             # Environment configuration template
├── package.json             # Workspace scripts and dependencies
└── README.md
```

*The directory names above illustrate the architecture. Consult the repository for the exact current file structure.*

---

## 🚀 Getting Started

Run FODX Scout locally in a few steps.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) — version 20 or newer
- npm — version 10 or newer
- An internet connection for business discovery and external services

An AI provider is optional. Without one, the core application can still be used, but AI-powered investigations and generation features will be unavailable.

### 1. Clone the Repository

```bash
git clone https://github.com/Fouad-dev101/fodx-scout.git

cd fodx-scout
```

### 2. Install Dependencies

Run the following command from the project root:

```bash
npm install
```

### 3. Configure Environment Variables

Create your local environment file from the provided template.

On macOS or Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure the settings required by your installation.

#### Option A — Groq

Create an API key through the [Groq Console](https://console.groq.com/keys).

Example configuration:

```env
AI_PROVIDER=openai
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=your_api_key_here
AI_MODEL=openai/gpt-oss-120b
```

**Important:** Model availability can change. Check the provider's current model catalog if the configured model is unavailable.

Never commit your actual API key to GitHub.

#### Option B — Local Ollama

Install [Ollama](https://ollama.com/) and download a compatible model.

For example:

```bash
ollama pull llama3.1
```

Example configuration:

```env
AI_PROVIDER=ollama
AI_BASE_URL=http://127.0.0.1:11434
AI_MODEL=llama3.1
```

Make sure Ollama is running and that your application supports the configured model and provider settings.

> Environment variable names and values must match the implementation in `.env.example`. Treat that file as the source of truth if your local version differs from these examples.

### 4. Initialize the Database

From the project root:

```bash
npm run migrate
```

This runs the project's database migration script.

### 5. Start the Application

```bash
npm run dev
```

When both development servers are running, open:

| Service | Local Address |
| --- | --- |
| Web Application | http://localhost:5173 |
| Backend API | http://localhost:4000 |

If a command fails, check the terminal output, environment configuration, and the scripts defined in the root `package.json`.

---

## 🖥️ Using the Application

### Discover Businesses

Open the **Discover** section and search for a category in your target location.

For example:

- Category: Restaurants
- Location: Al Hoceima, Morocco

Review the results and import businesses that are relevant to your work.

### Create Leads

Open the **Businesses** section and promote a suitable business to a lead using the available lead-management actions.

### Inspect a Website

Open a lead's details and verify its website URL before running an inspection.

The inspector can identify selected issues in publicly accessible HTML, helping you find potential improvements to discuss with a business owner.

### Run an Investigation

Open **Investigations** and start an investigation using a prompt such as:

> Review my restaurant leads in Al Hoceima. Evaluate the available website evidence, calculate their opportunity scores, and identify which prospects are worth prioritizing. Explain the evidence behind each recommendation and suggest an appropriate service.

Follow the investigation timeline as the agent calls its registered tools.

### Generate Outreach

Return to a lead's details, choose the desired language and writing style, and generate a draft.

The goal is to produce a message that connects a real business need with a relevant service you can offer.

### Export Your Leads

Open **Reports** and export the available lead data to CSV.

Use the resulting file in Excel or another compatible spreadsheet application.

---

## 🔐 Security & Responsible Design

AI agents that inspect external websites introduce security risks that ordinary text-generation applications do not face.

FODX Scout is designed with several defensive measures to reduce those risks.

### Server-Side Request Forgery Protection

The website inspector uses URL and network validation to restrict requests to public destinations.

Its intended protections include:

- **DNS validation:** Resolve hostnames and reject addresses that point to loopback, private, link-local, or other prohibited network ranges.
- **Redirect validation:** Limit redirect depth and revalidate destinations at each redirect.
- **Response-size limits:** Limit the amount of HTML processed during an inspection.
- **Restricted AI tools:** Expose a defined set of backend operations rather than unrestricted shell or filesystem access.
- **Manual outreach:** Generate drafts without automatically sending messages to prospects.

### Security Is an Ongoing Process

These controls reduce risk, but they should not be treated as a guarantee that the application is immune to SSRF or other vulnerabilities.

Production deployments should also consider DNS rebinding, IPv4-mapped IPv6 addresses, connection-time IP validation, redirect edge cases, request timeouts, decompression limits, and provider-specific API security.

External services may also return incomplete, outdated, or incorrect information.

**Always verify important findings before using them to make business decisions or contacting a prospect.**

---

## 🗺️ Roadmap

FODX Scout is an evolving project. Potential improvements include:

- [ ] Add browser-based website inspection with Playwright.
- [ ] Improve detection of mobile usability and responsive design issues.
- [ ] Introduce additional business-data providers.
- [ ] Expand prospect qualification and filtering.
- [ ] Add bulk lead-status updates.
- [ ] Introduce follow-up reminders and scheduling.
- [ ] Add automated frontend tests with React Testing Library.
- [ ] Improve investigation history and reporting.
- [ ] Expand integration tests for website-inspection security controls.

The roadmap may change as the project develops.

---

## 🤝 Contributing

Contributions, bug reports, and thoughtful suggestions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a branch for your changes.
3. Implement and test your changes.
4. Open a pull request explaining what you changed and why.

For security-sensitive issues, avoid publishing exploit details that could put users at risk. Report them privately when an appropriate contact channel is available.

---

## 📄 License

FODX Scout is distributed under the MIT License.

See the [`LICENSE`](LICENSE) file for the full license text.

---

<div align="center">

### Built to help developers find their next opportunity.

**FODX Scout**

*Discover. Investigate. Prioritize. Connect.*

<br />

Created by [Fouad](https://github.com/Fouad-dev101)

</div>