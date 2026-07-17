# XuPay Frontend

Next.js 16 (App Router) frontend for the XuPay e-wallet platform.

## Stack

- **Next.js 16 / React 19 / TypeScript 5** — App Router, React Compiler enabled
- **TanStack Query 5** — server state, caching, optimistic updates
- **Zustand** — lightweight client state
- **Tailwind CSS 4 + Radix UI** — styling & accessible primitives
- **Recharts** — dashboard charts
- **Vitest + Testing Library + MSW** — 457 tests

## Architecture (layers)

```
app/            Pages (App Router) — (auth): login/register, (app): dashboard, wallets, ...
components/     Presentational + feature components (tests colocated in __tests__/)
hooks/api/      TanStack Query hooks per domain (useWallets, useTransactions, ...)
lib/            Typed API clients: userServiceClient, paymentServiceClient
                + mock clients (in-memory) and DTO adapters
providers/      AuthProvider (JWT), ReactQueryProvider, ThemeProvider
types/          Shared TypeScript DTO/domain types
```

Data flows one way: **page → hook → client → REST API**. Components never call axios directly.

### Page status

| Page | Data source |
|---|---|
| `/login`, `/register` | **Live API** (User Service) |
| `/wallets` | **Live API** — create wallet, real ledger balance, deposit/withdraw, P2P transfer, live history |
| `/profile` | **Live API** (User Service profile) |
| `/dashboard`, `/transactions`, `/analytics`, `/fraud-*`, `/compliance/*` | UI showcase with mock data (visual demo of the design system) |

## Run

```bash
npm ci

# Against the real backend (start docker compose first)
npm run dev                              # http://localhost:3000

# Without any backend (in-memory mocks)
NEXT_PUBLIC_USE_MOCKS=true npm run dev
```

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USER_SERVICE_URL` | `http://localhost:8081` | User Service base URL |
| `NEXT_PUBLIC_PAYMENT_SERVICE_URL` | `http://localhost:8082` | Payment Service base URL |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | `true` = use in-memory mock clients |

## Test & build

```bash
npm test          # Vitest (watch)
npx vitest run    # single pass
npm run lint
npm run build     # production build (standalone output)
```
