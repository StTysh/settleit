# settleit

`settleit` is a frontend prototype for a dispute, bet, and promise resolution platform. The concept combines wallet-connected users, staked agreements, evidence review, and validator decision-making in a single web interface.

## Project status

This repository is a product prototype. It contains a substantial frontend experience and application flow, but blockchain, wallet, agent, and backend integrations are still represented by placeholders or mocked data.

## Product concept

The application is designed around a workflow where users can:

- create disputes, bets, or promises
- define parties and terms
- lock stakes through blockchain-backed flows
- submit evidence for review
- route cases to validators
- resolve outcomes through validator decisions or future agent-assisted workflows

## Current functionality

- landing page and product overview
- dashboard for active disputes and summary data
- multi-step dispute creation flow
- dispute detail pages with evidence-oriented UI
- validator console
- profile and settings views
- local mock-data-driven interaction across the app

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- date-fns

## Repository structure

```text
src/pages/            Application pages including landing, dashboard, dispute detail, and validator console
src/pages/CreateDispute/
                      Multi-step creation workflow
src/components/ui/    Shared UI primitives
src/layouts/          App layout components
src/store/            Zustand state stores
src/mock/             Mock users, disputes, and evidence data
src/hooks/            Placeholder integration hooks for wallet, Neo, and SpoonOS flows
```

## Local development

### Requirements

- Node.js 18+
- npm

### Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Available scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Notes

- Wallet, blockchain, and agent integrations are not wired to live services yet.
- State is driven by mock data, so the application currently serves as a prototype and UX demonstration rather than a production-ready system.
