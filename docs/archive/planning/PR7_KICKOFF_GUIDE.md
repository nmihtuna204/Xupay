# **PR7 KICKOFF: BACKEND INTEGRATION POINTS & IMPLEMENTATION GUIDE**

**Created:** December 23, 2025  
**Status:** 🚀 Phase 1 Ready (Fraud Detection Focus)

---

## 📋 EXECUTIVE SUMMARY

PR6 completed 12 pages with **desktop-first responsive design**, **zero build errors**, and **consistent grid patterns**. PR7 builds on this foundation by adding:

1. **Fraud Detection & Risk Management** ← **STARTING HERE** (Phase 1)
2. KYC & Compliance Integration (Phase 2)
3. Advanced Analytics & Reporting (Phase 3)
4. Performance & Testing (Phase 4+)

**This document covers:**
- Frontend structure & what needs to be built
- Backend API contracts (what's available, what's needed)
- Data models & types
- Integration strategy

---

## 🏗️ FRONTEND STRUCTURE (What We Build in PR7)

### Current State (PR6 Complete):
```
src/
├── app/(app)/
│   ├── dashboard/                    ✅ Complete
│   ├── transactions/[id]/            ✅ Complete (has fraud section)
│   ├── wallets/[id]/                 ✅ Complete
│   └── (other 9 pages)               ✅ Complete
├── components/
│   ├── dashboard/                    ✅ (KPI cards, charts, etc.)
│   └── layout/                       ✅ (Sidebar, Topbar, Layout)
├── hooks/
│   └── api/                          ✅ (useTransactions, useWallets, etc.)
├── lib/
│   ├── adapters/                     ✅ (DTO mappers)
│   └── api/                          ✅ (API clients)
└── mocks/                            ✅ (Development data)
```

### New in PR7 (Phase 1 - Fraud Detection):
```
src/
├── app/(app)/
│   ├── fraud-dashboard/              🆕 NEW
│   │   └── page.tsx
│   └── fraud/
│       └── rules/
│           └── page.tsx              🆕 NEW
├── components/
│   └── fraud/                        🆕 NEW
│       ├── FraudMetricsCard.tsx
│       ├── FraudHeatmap.tsx
│       ├── FlaggedTransactionsTable.tsx
│       ├── FlaggedTransactionCard.tsx
│       ├── FraudTrendChart.tsx
│       ├── RiskBreakdownCard.tsx
│       ├── RiskTimeline.tsx
│       └── RiskActionButtons.tsx
├── hooks/
│   └── api/
│       └── useFraud.ts               🆕 NEW (multiple hooks)
│           ├── useFraudMetrics()
│           ├── useFlaggedTransactions()
│           ├── useFraudTrends()
│           └── useFraudRules()
├── lib/
│   ├── api/
│   │   └── fraudApi.ts               🆕 NEW
│   └── adapters/
│       └── fraudAdapters.ts          🆕 NEW
└── mocks/
    └── fraud.ts                      🆕 NEW
```

---

## 🔗 BACKEND INTEGRATION POINTS

### Current Backend Structure:
```
Backend (Java Spring Boot):
├── payment-service/
│   ├── TransactionController        ✅ GET /transactions, POST /transfer
│   ├── WalletController             ✅ GET /wallets, POST /create
│   └── FraudService (?)             ❓ May exist, need to check
└── user-service/
    ├── UserController               ✅ Probably has user endpoints
    └── KYCService (?)               ❓ May exist for KYC

Database:
├── Payment/Transaction table        ✅ Has fraud_score, risk_level fields
├── Wallet table                     ✅ Exists
└── KYC table (?)                    ❓ Needs verification
```

### Phase 1: Fraud Detection API Requirements

**What We Need from Backend (Fraud Endpoints):**

```
1. GET /api/fraud/metrics
   Response: {
     totalFlagged: number,
     flaggedAmount: number,
     flaggedPercent: number,
     riskDistribution: {
       LOW: number,
       MEDIUM: number,
       HIGH: number,
       CRITICAL: number
     },
     timestamp: ISO8601
   }

2. GET /api/fraud/transactions?offset=0&limit=50&status=flagged&dateRange=7d
   Response: {
     data: [
       {
         id: string,
         transactionId: string,
         amount: number,
         type: string,
         fraudScore: number,
         riskLevel: string,
         flagged: boolean,
         reason: string,
         createdAt: ISO8601,
         status: 'pending'|'reviewed'|'approved'|'blocked'
       },
       ...
     ],
     total: number,
     offset: number,
     limit: number
   }

3. GET /api/fraud/trends?dateRange=30d&granularity=day
   Response: {
     data: [
       {
         date: string (YYYY-MM-DD),
         count: number,
         amount: number,
         severity: 'LOW'|'MEDIUM'|'HIGH'
       },
       ...
     ]
   }

4. GET /api/fraud/heatmap?dimension=transactionType|walletType|userSegment
   Response: {
     data: [
       {
         category: string,
         flaggedCount: number,
         totalCount: number,
         flagRate: number (0-1)
       },
       ...
     ]
   }

5. GET /api/fraud/rules
   Response: {
     data: [
       {
         id: string,
         name: string,
         description: string,
         condition: string,
         threshold: number,
         action: string,
         enabled: boolean,
         accuracy: number,
         falsePositiveRate: number,
         createdAt: ISO8601
       },
       ...
     ]
   }

6. POST /api/fraud/transactions/{id}/action
   Body: { action: 'approve'|'block'|'review', reason: string }
   Response: { success: boolean, message: string }
```

**Fallback Strategy (If Backend Endpoints Don't Exist):**
- Use mock data in `src/mocks/fraud.ts`
- Create placeholder API client that returns mocks
- Document expected format for future backend integration
- Mark TODO comments for real API integration

---

## 📊 DATA MODELS & TYPES

### Frontend Types (TypeScript):

```typescript
// src/types/fraud.ts

export interface FraudMetrics {
  totalFlagged: number;
  flaggedAmount: number;
  flaggedPercent: number;
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  timestamp: Date;
}

export interface FlaggedTransaction {
  id: string;
  transactionId: string;
  amount: number;
  type: 'P2P' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
  fraudScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flagged: boolean;
  reason?: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'approved' | 'blocked';
}

export interface FraudTrend {
  date: string; // YYYY-MM-DD
  count: number;
  amount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FraudHeatmapData {
  category: string;
  flaggedCount: number;
  totalCount: number;
  flagRate: number;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  action: string;
  enabled: boolean;
  accuracy: number;
  falsePositiveRate: number;
  createdAt: Date;
}

export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudAction = 'approve' | 'block' | 'review';
```

### API Response Wrappers:

```typescript
// src/types/api.ts (extend existing)

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface MetricsResponse {
  data: T;
  timestamp: Date;
}
```

---

## 🎣 HOOKS & API CLIENTS

### Hooks to Create:

```typescript
// src/hooks/api/useFraud.ts

export function useFraudMetrics() {
  // Calls: fraudApi.getMetrics()
  // Returns: { data, loading, error, refetch }
  // Caches for 5 minutes
}

export function useFlaggedTransactions(filters: {
  offset?: number;
  limit?: number;
  status?: string;
  dateRange?: string;
}) {
  // Calls: fraudApi.getTransactions(filters)
  // Returns: { data, loading, error, hasMore, refetch }
  // Paginated, not cached (allows real-time updates)
}

export function useFraudTrends(dateRange: string) {
  // Calls: fraudApi.getTrends(dateRange)
  // Returns: { data, loading, error, refetch }
  // Caches for 10 minutes
}

export function useFraudRules() {
  // Calls: fraudApi.getRules()
  // Returns: { data, loading, error, refetch }
  // Caches for 30 minutes
}

export function useFraudHeatmap(dimension: string) {
  // Calls: fraudApi.getHeatmap(dimension)
  // Returns: { data, loading, error, refetch }
}
```

### API Client:

```typescript
// src/lib/api/fraudApi.ts

export const fraudApi = {
  async getMetrics(): Promise<FraudMetrics> {
    // GET /api/fraud/metrics
    // Error handling: try-catch + custom error messages
    // Timeout: 30s
  },

  async getTransactions(filters: FraudFilters): Promise<PaginatedResponse<FlaggedTransaction>> {
    // GET /api/fraud/transactions?...
  },

  async getTrends(dateRange: string): Promise<FraudTrend[]> {
    // GET /api/fraud/trends?dateRange=${dateRange}
  },

  async getRules(): Promise<FraudRule[]> {
    // GET /api/fraud/rules
  },

  async getHeatmap(dimension: string): Promise<FraudHeatmapData[]> {
    // GET /api/fraud/heatmap?dimension=${dimension}
  },

  async actionOnTransaction(
    transactionId: string,
    action: FraudAction,
    reason: string
  ): Promise<ApiResponse<void>> {
    // POST /api/fraud/transactions/{id}/action
    // Body: { action, reason }
  },
};
```

---

## 🛠️ IMPLEMENTATION CHECKLIST (Phase 1)

### Step 1: Setup (30 minutes)
- [ ] Create types file (`src/types/fraud.ts`)
- [ ] Create API client (`src/lib/api/fraudApi.ts`)
- [ ] Create adapters (`src/lib/adapters/fraudAdapters.ts`)
- [ ] Create hooks (`src/hooks/api/useFraud.ts`)
- [ ] Create mocks (`src/mocks/fraud.ts`)

### Step 2: Components (2-3 hours)
- [ ] `FraudMetricsCard` (KPI display)
- [ ] `FlaggedTransactionsTable` (desktop view)
- [ ] `FlaggedTransactionCard` (mobile view)
- [ ] `FraudTrendChart` (chart component)
- [ ] `FraudHeatmap` (heatmap/grid visualization)
- [ ] `FraudRulesList` (for rules page)

### Step 3: Pages (1-2 hours)
- [ ] `/app/fraud-dashboard/page.tsx`
- [ ] `/app/fraud/rules/page.tsx`

### Step 4: Enhancement (1 hour)
- [ ] Update `transactions/[id]/page.tsx` (add risk details)
- [ ] Create `RiskBreakdownCard`, `RiskTimeline`, `RiskActionButtons`

### Step 5: Testing & Build (1 hour)
- [ ] Fix TypeScript errors
- [ ] Run build: `npm run build`
- [ ] Add unit tests for hooks
- [ ] Verify responsive design (mobile/tablet/desktop)

**Total Estimated Time: 1 day** ⏱️

---

## 🌐 MOCK DATA STRATEGY

### Why Mocks Matter:
- Backend APIs may not be ready
- Allows frontend to develop independently
- Provides realistic test data
- Easy to iterate on UI without backend changes

### Mock Data File:

```typescript
// src/mocks/fraud.ts

export const MOCK_FRAUD_METRICS: FraudMetrics = {
  totalFlagged: 47,
  flaggedAmount: 28500.50,
  flaggedPercent: 2.3,
  riskDistribution: {
    LOW: 20,
    MEDIUM: 15,
    HIGH: 10,
    CRITICAL: 2,
  },
  timestamp: new Date(),
};

export const MOCK_FLAGGED_TRANSACTIONS: FlaggedTransaction[] = [
  {
    id: 'fraud_001',
    transactionId: 'txn_abc123',
    amount: 5000,
    type: 'TRANSFER',
    fraudScore: 85,
    riskLevel: 'HIGH',
    flagged: true,
    reason: 'Unusual time + high amount + new wallet',
    createdAt: new Date('2025-12-22'),
    status: 'pending',
  },
  // ... 10-20 more examples
];

export const MOCK_FRAUD_TRENDS: FraudTrend[] = [
  { date: '2025-12-01', count: 5, amount: 3000, severity: 'LOW' },
  { date: '2025-12-02', count: 8, amount: 5200, severity: 'MEDIUM' },
  // ... 30 days of data
];

export const MOCK_FRAUD_RULES: FraudRule[] = [
  {
    id: 'rule_1',
    name: 'High Amount Transfer',
    description: 'Flags transfers over $10,000',
    condition: 'amount > 10000 AND type = TRANSFER',
    threshold: 10000,
    action: 'FLAG',
    enabled: true,
    accuracy: 0.87,
    falsePositiveRate: 0.12,
    createdAt: new Date('2025-01-01'),
  },
  // ... 5-10 more rules
];
```

---

## 📋 BACKEND INTEGRATION STEPS (When Backend Is Ready)

1. **API Endpoint Verification:**
   - Confirm fraud endpoints exist
   - Verify response format matches types
   - Check authentication requirements

2. **Environment Configuration:**
   - Add `REACT_APP_FRAUD_API_BASE_URL` to `.env`
   - Update API client with real endpoint URLs

3. **Remove Mocks (or Keep as Fallback):**
   - Option A: Delete mock files once APIs work
   - Option B: Keep mocks as fallback for offline/demo mode
   - Add feature flag: `USE_MOCK_DATA=false` in production

4. **Error Handling:**
   - Implement retry logic (exponential backoff)
   - Add user-facing error messages
   - Log errors to Sentry

5. **Testing:**
   - Update hook tests to use real API
   - Add integration tests
   - Run E2E tests with live backend

---

## 🎨 GRID LAYOUT REFERENCE (From PR6)

All new components follow these proven patterns:

```typescript
// Desktop-first responsive grids:

// 4-column grid (KPI cards)
"grid grid-cols-4 max-lg:grid-cols-2 max-md:grid-cols-1 gap-4"

// 3-column grid (card layouts)
"grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6"

// 2-column grid (form fields, comparisons)
"grid grid-cols-2 max-md:grid-cols-1 gap-4"

// Table (desktop only, hidden on mobile)
"hidden lg:block"

// Mobile cards (shown only on mobile)
"lg:hidden space-y-4"

// Main container
"mx-auto max-w-7xl px-6 py-8"
```

---

## 🚀 NEXT STEPS (Action Items)

### Immediate (Next 2 hours):
1. ✅ Create PR7 plan document (this file)
2. [ ] Check backend for existing fraud endpoints
3. [ ] Create types & adapters (setup step 1)
4. [ ] Create mock data file (setup step 1)

### Today (Phase 1 Start):
1. [ ] Create API client + hooks
2. [ ] Build fraud dashboard page
3. [ ] Build fraud rules page
4. [ ] Component implementation
5. [ ] Build & test

### This Week:
1. [ ] Phase 1 complete & tested
2. [ ] Begin Phase 2 (KYC integration)
3. [ ] Code review & documentation

---

## 📚 REFERENCE FILES

**PR6 Spec:** `/spec.md` (architecture patterns)  
**PR6 Desktop-First Doc:** `/PR6_DESKTOP_FIRST_APPROACH.md` (grid patterns)  
**PR7 Plan:** `/PR7_ADVANCED_FEATURES_PLAN.md` (full roadmap)

---

## ✅ COMPLETION CHECKLIST

- [x] PR7 plan created
- [x] Backend integration points identified
- [x] Data models defined
- [x] Mock strategy established
- [ ] Backend endpoints verified (next)
- [ ] Phase 1 implementation begins (next)

---

**Ready to start? Let's begin with backend verification! 🚀**
