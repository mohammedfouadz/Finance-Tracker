# Mudabbir (مُدبِّر) - Personal Financial Management System

## Overview

Mudabbir is a comprehensive web-based personal financial management platform that helps users track income, manage expenses, set budgets, define savings goals, track investments, manage debts, monitor bank accounts and assets, and get AI-powered financial coaching. The app follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database. Authentication is handled via Replit Auth (OpenID Connect).

Key features:
- **Multi-Currency Support** — Per-entry currency selection (USD, EUR, OMR, ILS + 17 more), exchange rate to USD stored at entry time, all totals and analytics displayed in USD. Scalable architecture via `shared/currency.ts` module and reusable `CurrencyFields` component
- **Income & Expense Tracking** — Log transactions with categories, tags, currency, and optional receipts
- **Budget Allocation** — Automated budget distribution based on customizable percentage/fixed-amount rules (inspired by 50/30/20 rule)
- **Financial Goals** — Create and track savings/investment goals with contribution tracking, currency support, and progress indicators
- **Investment Tracking** — Dedicated investment management for Gold, Stocks, Crypto, Real Estate, Bonds with buy/sell tracking and multi-currency
- **Asset Management** — Track real estate, vehicles, jewelry, equipment with current valuations in any supported currency
- **Bank Account Management** — Monitor multiple bank accounts with balance history tracking and currency conversion
- **Debt Management** — Track debts with payment recording, remaining balance updates, and per-debt currency
- **Dashboard Analytics** — Total Wealth calculation (all converted to USD), wealth breakdown donut chart, income vs expenses bar chart, recent transactions, goals progress
- **Reports & Charts** — Visual dashboards with Recharts (pie, bar, area charts)
- **AI Financial Coach** — Chat interface powered by OpenAI for personalized financial advice, with voice input/output support
- **Multi-category system** — System-seeded default categories plus user-defined custom categories with subcategory support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Layout
```
client/          → React SPA (Vite, TypeScript)
server/          → Express API server (TypeScript, tsx runner)
shared/          → Shared types, schemas, route definitions (used by both client & server)
migrations/      → Drizzle-generated SQL migrations
script/          → Build scripts (esbuild + vite)
```

### Frontend (`client/src/`)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State/Data**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, custom color palette (primary blue, accent purple, success green, destructive red)
- **Charts**: Recharts for financial data visualization
- **Forms**: React Hook Form + Zod resolvers for validation
- **Auth**: Custom `useAuth` hook that checks `/api/auth/user`; unauthenticated users redirect to `/api/login`
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

### Backend (`server/`)
- **Framework**: Express on Node.js with TypeScript (run via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route definitions shared between client and server via `shared/routes.ts`
- **Auth**: Replit Auth via OpenID Connect (passport strategy). Session stored in PostgreSQL via `connect-pg-simple`. Protected routes use `isAuthenticated` middleware.
- **AI Integration**: OpenAI API (via Replit AI Integrations proxy) for chat, voice, and image features
- **Replit Integrations** (`server/replit_integrations/`):
  - `auth/` — Replit Auth setup, session management, user storage
  - `chat/` — Conversation & message CRUD, streaming chat completions
  - `audio/` — Voice recording transcription (speech-to-text), text-to-speech, voice chat
  - `image/` — Image generation via gpt-image-1
  - `batch/` — Batch processing utility with rate limiting and retries

### Database
- **Engine**: PostgreSQL (required, provisioned via Replit)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema** (`shared/schema.ts`): 
  - `users` — User profiles (Replit Auth managed)
  - `sessions` — Express sessions (required for auth)
  - `categories` — Income/expense categories with allocation percentages, colors, icons, parent-child hierarchy
  - `transactions` — Financial transactions linked to categories, with recurring support and tags
  - `goals` — Savings/investment goals with target amounts, deadlines, and progress
  - `budgets` — Monthly budget limits per category
  - `conversations` / `messages` — AI chat history
- **Migrations**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### Build & Deploy
- **Dev**: `npm run dev` — runs tsx with Vite dev server middleware (HMR)
- **Build**: `npm run build` — Vite builds client to `dist/public/`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` — runs the bundled server which serves static files

### Key Design Decisions
1. **Shared route definitions** — `shared/routes.ts` defines API paths, input schemas, and response schemas used by both frontend hooks and backend handlers, ensuring type safety across the stack
2. **Drizzle + Zod** — Schema defined once in Drizzle, insert/update schemas auto-generated via `drizzle-zod`, eliminating duplication
3. **Component library** — Full shadcn/ui component set pre-installed for rapid UI development
4. **Storage abstraction** — `IStorage` interface in `server/storage.ts` combines auth, chat, and domain storage; currently backed by `DatabaseStorage` class using Drizzle queries

## External Dependencies

### Required Services
- **PostgreSQL** — Primary database. Connection via `DATABASE_URL` environment variable. Required for all data storage and session management.
- **Replit Auth** — OpenID Connect authentication. Requires `REPL_ID` and `ISSUER_URL` environment variables. Session secret via `SESSION_SECRET`.
- **OpenAI API** (via Replit AI Integrations) — Powers the AI financial coach chat, voice features, and image generation. Uses `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables.

### Key npm Packages
- `drizzle-orm` / `drizzle-kit` — Database ORM and migration tooling
- `express` / `express-session` — HTTP server and session management
- `connect-pg-simple` — PostgreSQL session store
- `passport` / `openid-client` — Authentication strategy
- `openai` — AI API client
- `@tanstack/react-query` — Client-side data fetching and caching
- `recharts` — Chart/graph rendering
- `react-hook-form` / `@hookform/resolvers` — Form management
- `zod` / `drizzle-zod` — Runtime validation
- `wouter` — Client-side routing
- `date-fns` — Date manipulation
- `tailwindcss` — Utility-first CSS framework
- Radix UI primitives — Accessible UI component foundations (via shadcn/ui)