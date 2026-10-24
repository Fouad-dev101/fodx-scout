# FODX Scout

AI-assisted business prospecting workspace for web developers.
Discover real businesses from OpenStreetMap, verify their websites
safely, score opportunity, and generate evidence-based outreach drafts.

## What works without an AI provider

- Business discovery via OpenStreetMap/Overpass
- Website existence verification (SSRF-safe HTTP)
- Lightweight website HTML inspection
- Deterministic opportunity scoring
- Lead management, notes, statuses
- Template-based outreach drafts (French / English / Arabic)
- CSV export
- Dashboard metrics from real data

## What requires an AI provider

- The AI agent that runs multi-step investigations and chooses tools
- LLM-generated outreach drafts (a safe template fallback is used when
  no provider is configured)
- The AI-written final investigation summary

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10

## Install & run

```bash
cp .env.example .env
npm install
npm run dev