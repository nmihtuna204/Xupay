# PR 6: Page Refactors & Layout Implementation

**Status:** Ready for Review  
**Based on:** spec.md (Parts 1-3 + Implementation Checklist)  
**Scope:** Pages refactoring with spec-compliant layouts & grids  
**Estimated Duration:** 5-7 days (PHASE 1-4)

---

## EXECUTIVE SUMMARY

**Current State (PR 5 Complete):**
- ✅ Global layouts implemented (PublicLayout, AuthLayout, DashboardLayout)
- ✅ Layout components complete (Sidebar, Topbar, Container, Grid)
- ✅ All 31 components with tests & Storybook stories
- ✅ CSS variables & Tailwind config aligned with neon theme
- ❌ Pages NOT refactored to use new layout system
- ❌ Pages NOT aligned with spec grid structure
- ❌ Missing responsive breakpoints implementation

**PR 6 Objective:**
Refactor 7 existing pages + 3 new pages to comply with spec-defined layouts and responsive grids.

**Why This PR:**
- Current pages use ad-hoc layouts (no consistency)
- Need alignment with spec's responsive grid (mobile/tablet/desktop)
- Must implement proper data hooks (useWallets, useTransactions, etc.)
- Tests & Storybook stories require proper page structure

---

## PHASE 1: GLOBAL SETUP (Days 1-2)

### 1.1 CSS Variables Audit & Extension

**Current State:**
- `src/styles/global.css` has color, background, text tokens
- `src/styles/variables.css` has animation tokens
- Missing: layout-specific dimensions, breakpoint helpers

**REQUIRED CHANGES:**

```css
/* src/styles/global.css - ADD AFTER LINE ~100 */

/* ========================================
   LAYOUT DIMENSIONS (NEW)
   ======================================== */

:root {
  /* Container System */
  --container-max-width: 1280px;     /* max-w-7xl */
  --container-padding-x: 1.5rem;     /* px-6 */
  --container-padding-y: 2rem;       /* py-8 */
  
  /* Sidebar Dimensions */
  --sidebar-width: 16rem;            /* w-64 */
  --sidebar-width-sm: 0;             /* hidden on mobile */
  --sidebar-transition: 300ms;       /* smooth toggle */
  
  /* Topbar Dimensions */
  --topbar-height: 4rem;             /* h-16 */
  
  /* Grid Gaps */
  --grid-gap-default: 1.5rem;        /* gap-6 */
  --grid-gap-compact: 1rem;          /* gap-4 */
  --grid-gap-loose: 2rem;            /* gap-8 */
  
  /* Responsive Breakpoints (Tailwind standard) */
  --bp-mobile: 0;                    /* <640px */
  --bp-tablet: 640px;                /* 640-1024px */
  --bp-desktop: 1024px;              /* ≥1024px */
}

/* ========================================
   CARD DESIGN SYSTEM (NEW)
   ======================================== */

.card-base {
  @apply bg-white border border-gray-200 rounded-xl p-6 
         dark:bg-slate-900 dark:border-slate-700 
         transition-all duration-200;
}

.card-hover {
  @apply hover:shadow-lg hover:border-gray-300 
         dark:hover:border-slate-600 cursor-pointer;
}

.card-interactive {
  @apply card-base card-hover;
}

/* ========================================
   TABLE DESIGN SYSTEM (NEW)
   ======================================== */

.table-sticky-header {
  @apply sticky top-0 bg-gray-50 dark:bg-slate-800 
         z-10 border-b border-gray-200 dark:border-slate-700;
}

.table-cell-base {
  @apply px-4 py-3 text-sm text-gray-900 dark:text-slate-100;
}

/* ========================================
   BADGE DESIGN SYSTEM (NEW)
   ======================================== */

.badge-base {
  @apply inline-flex items-center rounded-full px-3 py-1 
         text-xs font-semibold uppercase;
}

.badge-success {
  @apply badge-base bg-green-100 text-green-800 
         dark:bg-green-900/30 dark:text-green-200;
}

.badge-warning {
  @apply badge-base bg-yellow-100 text-yellow-800 
         dark:bg-yellow-900/30 dark:text-yellow-200;
}

.badge-danger {
  @apply badge-base bg-red-100 text-red-800 
         dark:bg-red-900/30 dark:text-red-200;
}

.badge-info {
  @apply badge-base bg-blue-100 text-blue-800 
         dark:bg-blue-900/30 dark:text-blue-200;
}
```

**Files to Update:**
1. `src/styles/global.css` → Add layout dimensions, card/table/badge design systems
2. `src/styles/variables.css` → Verify animation tokens (already complete)

**Checklist:**
- [ ] Add container dimensions (--container-max-width, --sidebar-width, etc.)
- [ ] Add grid gap variables (--grid-gap-default, --grid-gap-compact, --grid-gap-loose)
- [ ] Add card design system (.card-base, .card-hover, .card-interactive)
- [ ] Add table design system (.table-sticky-header, .table-cell-base)
- [ ] Add badge design system (.badge-success, .badge-warning, .badge-danger, .badge-info)

---

### 1.2 Tailwind Config Extensions

**Current State:**
- Config has color mappings from CSS variables
- Missing: container, gap, custom grid utilities

**REQUIRED CHANGES:**

```typescript
/* src/tailwind.config.ts - EXTEND theme section */

const config: Config = {
  // ... existing config ...
  theme: {
    extend: {
      // ... existing colors ...
      
      /* Container System */
      container: {
        center: true,
        padding: {
          DEFAULT: 'var(--container-padding-x)',
          sm: '1rem',
          md: '1.5rem',
          lg: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
      },
      
      /* Custom Widths */
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-sm': 'var(--sidebar-width-sm)',
      },
      
      /* Custom Heights */
      height: {
        topbar: 'var(--topbar-height)',
      },
      
      /* Grid Gaps */
      gap: {
        'grid-default': 'var(--grid-gap-default)',
        'grid-compact': 'var(--grid-gap-compact)',
        'grid-loose': 'var(--grid-gap-loose)',
      },
      
      /* Custom Grid Columns */
      gridTemplateColumns: {
        'dashboard': '1fr 2fr 1fr',  /* 3-column dashboard */
        'wallets': 'repeat(auto-fill, minmax(300px, 1fr))',
        'kpi-mobile': '1fr',
        'kpi-tablet': 'repeat(2, 1fr)',
        'kpi-desktop': 'repeat(4, 1fr)',
        'transaction-summary': 'repeat(auto-fit, minmax(200px, 1fr))',
      },
      
      /* Animations (should already exist from PR 5) */
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
}
```

**Files to Update:**
1. `tailwind.config.ts` → Add container, width, height, gap, gridTemplateColumns, animations

**Checklist:**
- [ ] Extend container configuration
- [ ] Add custom width utilities (sidebar, sidebar-sm)
- [ ] Add custom height utilities (topbar)
- [ ] Add grid gap utilities
- [ ] Add custom grid column templates
- [ ] Verify animations/keyframes match animations.css

---

### 1.3 Container Component Enhancement

**Current State:**
- `src/components/layout/Container.tsx` exists and is simple
- Has tests and Storybook story

**REQUIRED CHANGES:**

```typescript
/* src/components/layout/Container.tsx - ENHANCE */

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'  // responsive sizing
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: boolean  // apply max-w-7xl
}

export const Container = ({
  children,
  className,
  size = 'md',
  padding = 'md',
  maxWidth = true,
}: ContainerProps) => {
  const sizeClasses = {
    sm: 'max-w-4xl',
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    full: 'w-full',
  }

  const paddingClasses = {
    none: 'p-0',
    sm: 'px-4 py-4',
    md: 'px-6 py-8',
    lg: 'px-8 py-12',
  }

  return (
    <div
      className={cn(
        'mx-auto',
        maxWidth && sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
```

**Files to Update:**
1. `src/components/layout/Container.tsx` → Add size, padding, maxWidth props

**Checklist:**
- [ ] Add size prop (sm|md|lg|full)
- [ ] Add padding prop (none|sm|md|lg)
- [ ] Add maxWidth boolean prop
- [ ] Update tests to verify all props
- [ ] Update Storybook story with prop variations

---

## PHASE 2: PAGE GRID SPECIFICATIONS (Day 2-3)

### 2.1 Current Pages Analysis

**Existing Pages (7):**

| Page | Route | Layout Type | Status | Grid |
|------|-------|------------|--------|------|
| Dashboard | /dashboard | Dashboard | Exists | Custom grid-cols-4 + grid-cols-12 |
| Wallets | /wallets | Dashboard | Exists | Basic grid |
| Transactions | /transactions | Dashboard | Exists | Basic layout |
| Profile | /profile | Dashboard | Exists | Simple form |
| Settings | /settings | Dashboard | Exists | Simple form |
| Compliance | /compliance | Dashboard | Exists | Simple layout |
| Login | /auth/login | Auth | Exists | Not split-screen |
| Register | /auth/register | Auth | Exists | Not split-screen |

**Missing Pages (3):**
- Analytics → /analytics (Dashboard)
- Users → /users (Dashboard) 
- Audit → /audit (Dashboard)

---

### 2.2 Page Grid Specifications

#### **DASHBOARD PAGE**

**Current:** Grid is ad-hoc, uses grid-cols-4 + grid-cols-12
**Target:** Spec-compliant with proper responsive breakpoints

```
Mobile (<640px):
┌─────────────────────┐
│  KPI Card 1        │  (grid-cols-1)
├─────────────────────┤
│  KPI Card 2        │
├─────────────────────┤
│  KPI Card 3        │
├─────────────────────┤
│  KPI Card 4        │
├─────────────────────┤
│  Chart (full-width)│  (col-span-1)
├─────────────────────┤
│  Recent Txns Card  │  (col-span-1)
└─────────────────────┘

Tablet (640-1024px):
┌─────────────────────────────────┐
│  KPI 1      │  KPI 2           │  (grid-cols-2)
├─────────────────────────────────┤
│  KPI 3      │  KPI 4           │
├──────────────────┬──────────────┤
│  Chart           │  My Cards    │  (grid-cols-2)
│  (2/3)           │  (1/3)       │
├──────────────────┴──────────────┤
│  Recent Transactions             │  (col-span-2)
└──────────────────────────────────┘

Desktop (≥1024px):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  KPI 1       │  KPI 2       │  KPI 3       │  KPI 4       │  (grid-cols-4)
├──────────────┴──────────────┴──────────────┴──────────────┤
│                           MAIN GRID                        │  (grid-cols-12)
├──────────────────────────────┬──────────────────────────┤
│  Chart                       │  My Cards                │  (col-span-8/col-span-4)
│  (8/12)                      │  (4/12)                  │
├──────────────────────────────┼──────────────────────────┤
│  Recent Transactions          │  Quick Actions           │  (col-span-8/col-span-4)
│  (col-span-8)                │  (col-span-4)           │
└──────────────────────────────┴──────────────────────────┘
```

**Data Dependencies:**
- `useDashboardOverview()` → KPI cards, chart data
- `useRecentTransactions()` → Recent transactions list
- `useWallets()` → My cards preview

**Component Structure:**
- KPI Cards: `StatCard` (4 cards)
- Chart: `BalanceHistoryChart` (custom)
- Transactions: `TransactionList` or cards
- Cards Preview: `CardPreview` component

**Responsive Rules:**
- Mobile: Stack KPI cards (1 column), hide chart
- Tablet: KPI grid-cols-2, chart visible, 2-column main grid
- Desktop: KPI grid-cols-4, 12-column main grid (8/4 split)

---

#### **WALLETS PAGE**

**Current:** Basic grid, no pagination
**Target:** Responsive grid with proper spacing

```
Mobile (<640px):
┌─────────────────────┐
│  Wallet Card 1     │  (grid-cols-1)
├─────────────────────┤
│  Wallet Card 2     │
├─────────────────────┤
│  Wallet Card 3     │
└─────────────────────┘

Tablet (640-1024px):
┌─────────────────────┬─────────────────────┐
│  Wallet Card 1      │  Wallet Card 2      │  (grid-cols-2)
├─────────────────────┼─────────────────────┤
│  Wallet Card 3      │  Wallet Card 4      │
└─────────────────────┴─────────────────────┘

Desktop (≥1024px):
┌──────────────┬──────────────┬──────────────┐
│  Wallet 1    │  Wallet 2    │  Wallet 3    │  (grid-cols-3)
├──────────────┼──────────────┼──────────────┤
│  Wallet 4    │  Wallet 5    │  Wallet 6    │
└──────────────┴──────────────┴──────────────┘
```

**Data Dependencies:**
- `useWallets()` → Wallet cards
- Pagination: offset, limit

**Component Structure:**
- Each wallet: `WalletCard` component
- Actions: View, Transfer, Add funds

**Responsive Rules:**
- Mobile: grid-cols-1
- Tablet: grid-cols-2
- Desktop: grid-cols-3

---

#### **TRANSACTIONS PAGE**

**Current:** Mixed layout, table + cards
**Target:** Desktop table + mobile cards (responsive toggle)

```
Mobile (<640px):
┌─────────────────────┐
│  Summary Card 1     │  (grid-cols-1)
│  Amount: $5000      │  (space-y-4 stack)
├─────────────────────┤
│  Summary Card 2     │
│  Count: 125         │
├─────────────────────┤
│  Summary Card 3     │
│  Avg: $500          │
├─────────────────────┤
│  Transaction 1      │
│  [Expense] -$100    │
├─────────────────────┤
│  Transaction 2      │
│  [Income] +$250     │
└─────────────────────┘

Tablet (640-1024px):
┌──────────────┬──────────────┬──────────────┐
│  Summary 1   │  Summary 2   │  Summary 3   │  (grid-cols-3)
├──────────────┴──────────────┴──────────────┤
│  Transaction Cards (space-y-4)              │  (hidden table)
├─────────────────────────────────────────────┤
│  Transaction 1 [Expense] -$100              │
├─────────────────────────────────────────────┤
│  Transaction 2 [Income] +$250               │
└─────────────────────────────────────────────┘

Desktop (≥1024px):
┌──────────────┬──────────────┬──────────────┐
│  Summary 1   │  Summary 2   │  Summary 3   │  (grid-cols-3)
├──────────────┴──────────────┴──────────────┤
│  Transaction Table (hidden cards)           │
├──────┬──────┬──────────┬──────┬──────────┬─┤
│ ID   │ Type │ Amount   │ Date │ Status   │ │
├──────┼──────┼──────────┼──────┼──────────┼─┤
│ #001 │ Exp  │ -$100    │ Oct  │ Complete │ │
├──────┼──────┼──────────┼──────┼──────────┼─┤
│ #002 │ Inc  │ +$250    │ Oct  │ Complete │ │
└──────┴──────┴──────────┴──────┴──────────┴─┘
```

**Data Dependencies:**
- `useTransactions()` → Transaction list, pagination
- `useTransactionStats()` → Summary cards

**Component Structure:**
- Summary: 3 cards in grid (total, count, avg)
- Desktop view: `TransactionTable` (sticky header, 12-column grid)
- Mobile view: `TransactionCard` list (stack with space-y-4)

**Responsive Rules:**
- Mobile: Show summary (grid-cols-1), show cards, hide table
- Tablet: Show summary (grid-cols-3), show cards, hide table
- Desktop: Show summary (grid-cols-3), show table, hide cards

---

#### **AUTH PAGES (Login/Register)**

**Current:** Not split-screen, basic layout
**Target:** Split-screen layout (form 50% | hero 50% on desktop)

```
Mobile (<640px):
┌─────────────────────┐
│  Header             │  (flex-col)
│  (Logo)             │
├─────────────────────┤
│  Form               │
│  (Email)            │
│  (Password)         │
│  (Button)           │
├─────────────────────┤
│  Hero Image/Text    │  (hidden)
│  (visible on tablet)│
└─────────────────────┘

Tablet (640-1024px):
┌─────────────────────┐
│  Header (full)      │
├──────────────┬──────┤
│  Form        │ Hero │  (flex-row, 50/50)
│  (Left)      │(Right)│ 
│  max-w-md    │      │
└──────────────┴──────┘

Desktop (≥1024px):
┌──────────────┬──────────────┐
│  Form        │  Hero        │  (flex-row)
│  (Left)      │  (Right)     │  (w-1/2 each)
│  max-w-md    │  gradient    │
│  centered    │  bg          │
└──────────────┴──────────────┘
```

**Component Structure:**
- Left (form): AuthContainer, email input, password input, submit button
- Right (hero): AuthMarketingPanel with gradient background

**Responsive Rules:**
- Mobile: Single column (flex-col), hero hidden
- Tablet: flex-row, both visible, 50/50 split
- Desktop: flex-row, 50/50 split, max-w-md form container

---

#### **PROFILE PAGE**

**Current:** Simple form layout
**Target:** Card-based layout with sections

```
Mobile (<640px):
┌─────────────────────┐
│  Profile Header     │  (centered)
│  Avatar             │
│  Name               │
├─────────────────────┤
│  Personal Info Card │
├─────────────────────┤
│  Contact Card       │
├─────────────────────┤
│  Settings Card      │
└─────────────────────┘

Tablet/Desktop:
┌──────────────┬──────────────┐
│ Profile      │ Settings     │  (grid-cols-2 or 3)
│ Header       │ Card         │
├──────────────┼──────────────┤
│ Personal     │ Security     │
│ Info Card    │ Card         │
├──────────────┼──────────────┤
│ Contact Card │ Notifications│
│              │ Card         │
└──────────────┴──────────────┘
```

**Responsive Rules:**
- Mobile: grid-cols-1 (stack cards)
- Tablet: grid-cols-2
- Desktop: grid-cols-3 (with sidebar still visible)

---

#### **SETTINGS PAGE**

**Current:** Simple form
**Target:** Tabs + form sections

```
Mobile:
┌──────────────────┐
│ Tab: Account     │  (scroll horizontally)
├──────────────────┤
│ Form             │
│ (Account fields) │
├──────────────────┤
│ Tab: Preferences │
├──────────────────┤
│ Form             │
│ (Preference      │
│  fields)         │
└──────────────────┘

Desktop:
┌─────────────────┬──────────────────────┐
│ Tab List        │ Form Section         │
│ (Account)       │ (Account fields)     │
│ (Preferences)   │                      │
│ (Security)      │ (sticky sidebar      │
│ (Billing)       │  or sticky nav)      │
└─────────────────┴──────────────────────┘
```

**Component Structure:**
- Tabs: Account, Preferences, Security, Billing
- Each tab: form with fields

**Responsive Rules:**
- Mobile: Tabs scroll horizontally, form full-width
- Desktop: Sidebar or sticky nav with tabs, form alongside

---

#### **COMPLIANCE PAGE (SAR)**

**Current:** Simple layout
**Target:** Data-driven with filters

```
Mobile:
┌──────────────────┐
│ Filters          │
│ (Dropdown)       │
├──────────────────┤
│ SAR Card 1       │  (space-y-4)
├──────────────────┤
│ SAR Card 2       │
└──────────────────┘

Desktop:
┌──────────────────┬──────────────────────┐
│ Filters          │ SAR Table            │
│ (Sidebar)        │ (sticky header)      │
│                  │                      │
│ - Status         │ 12-column grid       │
│ - Type           │                      │
│ - Date Range     │                      │
└──────────────────┴──────────────────────┘
```

---

#### **NEW: ANALYTICS PAGE**

**Route:** `/analytics`  
**Layout Type:** Dashboard

```
Desktop:
┌────────────────────────────────────────┐
│  Period Selector (Date Range)          │  (flex, justify-between)
├────────────────────────────────────────┤
│  KPI Metrics (grid-cols-4)             │
│  Users | Transactions | Volume | Growth│
├────────────────────────────────────────┤
│  Charts Grid (grid-cols-2)             │
│  Chart 1          │  Chart 2           │
├───────────────────┼────────────────────┤
│  Chart 3          │  Chart 4           │
├────────────────────────────────────────┤
│  Data Table (12-column, sticky header) │
│  Detailed analytics data               │
└────────────────────────────────────────┘
```

**Data Dependencies:**
- `useAnalytics()` → KPI metrics, chart data
- Filters: Date range, user segment, transaction type

---

#### **NEW: USERS PAGE**

**Route:** `/users`  
**Layout Type:** Dashboard

```
Desktop:
┌────────────────────────────────────────┐
│  Filters | Search | Export             │
├────────────────────────────────────────┤
│  Users Table (12-column, sticky header)│
│  ID | Name | Email | Status | Actions  │
├────────────────────────────────────────┤
│  Pagination controls                   │
└────────────────────────────────────────┘
```

**Data Dependencies:**
- `useUsers()` → User list, pagination, filters
- Filters: Status, role, registration date

---

#### **NEW: AUDIT PAGE**

**Route:** `/audit`  
**Layout Type:** Dashboard

```
Desktop:
┌────────────────────────────────────────┐
│  Filters | Search                      │
├────────────────────────────────────────┤
│  Audit Log Table (12-column)           │
│  ID | Action | User | Timestamp | Detail│
├────────────────────────────────────────┤
│  Pagination controls                   │
└────────────────────────────────────────┘
```

**Data Dependencies:**
- `useAuditLog()` → Audit events, filters, pagination

---

### 2.3 Responsive Breakpoint Table

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| KPI Grid | grid-cols-1 | grid-cols-2 | grid-cols-4 |
| Wallets Grid | grid-cols-1 | grid-cols-2 | grid-cols-3 |
| Txn Summary | grid-cols-1 | grid-cols-3 | grid-cols-3 |
| Main Content | col-span-1 | col-span-2 | col-span-8 (left), col-span-4 (right) |
| Sidebar | hidden | visible | visible |
| Table | hidden cards | hidden cards | sticky header table |
| Auth Form | flex-col | flex-row (50/50) | flex-row (50/50) |

---

## PHASE 3: DATA HOOKS IMPLEMENTATION (Day 3-4)

### 3.1 Required Hooks (to create or verify)

All hooks should be in `src/hooks/` with tests and Storybook stories.

**CRITICAL HOOKS:**

```typescript
/* Dashboard */
useDashboardOverview()     // → KPI cards, chart data
useRecentTransactions()    // → Last 5-10 transactions

/* Wallets */
useWallets()              // → List of wallets, pagination
useWalletDetail()         // → Single wallet with history

/* Transactions */
useTransactions()         // → Transaction list, pagination, filters
useTransactionStats()     // → Summary stats (total, count, avg)
useTransactionDetail()    // → Single transaction

/* Analytics (NEW) */
useAnalytics()            // → KPI metrics, chart data
useAnalyticsPeriod()      // → Period selection logic

/* Users (NEW) */
useUsers()                // → User list, pagination, filters
useUserDetail()           // → Single user profile

/* Audit (NEW) */
useAuditLog()             // → Audit events, pagination, filters

/* Profile */
useProfile()              // → Current user profile
useProfileUpdate()        // → Update profile logic

/* Settings */
useSettings()             // → User settings
useSettingsUpdate()       // → Update settings logic
```

**Hook Template:**

```typescript
/* Example: src/hooks/useDashboardOverview.ts */

'use client'

import { useState, useEffect } from 'react'
import { DashboardOverviewDTO } from '@/types/api'
import { DashboardOverviewModel } from '@/types/ui'
import { dashboardApi } from '@/lib/api/clients/dashboard'
import { dashboardAdapter } from '@/lib/adapters/dashboard'

export function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverviewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const dto = await dashboardApi.getOverview()
        const model = dashboardAdapter.toDashboardOverview(dto)
        setData(model)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
```

**Checklist:**
- [ ] Create/verify all 12 hooks
- [ ] Add TypeScript types for each
- [ ] Add unit tests (mocking API)
- [ ] Add Storybook stories
- [ ] Verify adapters map DTO → UI Model correctly

---

## PHASE 4: PAGE REFACTORING (Days 4-7)

### 4.1 Refactoring Order (By Priority & Dependencies)

**Week 1:**
1. **Day 1-2: Auth Pages (Login/Register)**
   - No data dependencies
   - Uses AuthLayout (already done)
   - Simplest refactor

2. **Day 2-3: Dashboard (Main)**
   - Depends on: useDashboardOverview, useRecentTransactions, useWallets
   - Most complex, highest value
   - Reference for other pages

3. **Day 3-4: Wallets & Transactions**
   - Depends on: useWallets, useTransactions, useTransactionStats
   - Medium complexity
   - High business value

4. **Day 4-5: Profile & Settings**
   - Depends on: useProfile, useSettings
   - Low complexity
   - Secondary priority

**Week 2:**
5. **Day 1: Compliance (SAR)**
   - Depends on: useComplianceSARs (existing)
   - Medium complexity

6. **Day 2-3: Analytics (NEW)**
   - Depends on: useAnalytics, useAnalyticsPeriod (to create)
   - Medium complexity
   - New feature

7. **Day 3-4: Users (NEW)**
   - Depends on: useUsers, useUserDetail (to create)
   - Medium complexity
   - Admin feature

8. **Day 4-5: Audit (NEW)**
   - Depends on: useAuditLog (to create)
   - Low complexity
   - Admin feature

### 4.2 Refactoring Template

**Example: Dashboard Page**

```typescript
/* src/app/(app)/dashboard/page.tsx - REFACTORED */

'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Container } from '@/components/layout/Container'
import { StatCard } from '@/components/dashboard/StatCard'
import { BalanceHistoryChart } from '@/components/dashboard/BalanceHistoryChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { useDashboardOverview } from '@/hooks/useDashboardOverview'
import { useRecentTransactions } from '@/hooks/useRecentTransactions'
import { useWallets } from '@/hooks/useWallets'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardPage() {
  const { data: overview, loading: overviewLoading } = useDashboardOverview()
  const { data: transactions, loading: txnLoading } = useRecentTransactions()
  const { data: wallets, loading: walletsLoading } = useWallets()

  return (
    <DashboardLayout>
      <Container maxWidth size="lg">
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's your financial overview.
              </p>
            </div>
            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* KPI Cards Grid: mobile 1 | tablet 2 | desktop 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-default">
            {overviewLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : overview?.kpis ? (
              overview.kpis.map((kpi) => (
                <StatCard key={kpi.id} {...kpi} />
              ))
            ) : null}
          </div>

          {/* Main Content Grid: mobile 1 | tablet 2 | desktop 12 (8/4 split) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-default">
            
            {/* Left Column (8/12 on desktop, 1/1 on mobile/tablet) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Chart */}
              {overviewLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <BalanceHistoryChart data={overview?.chart} />
              )}

              {/* Transactions */}
              {txnLoading ? (
                <Skeleton className="h-96" />
              ) : (
                <RecentTransactions data={transactions} />
              )}
            </div>

            {/* Right Column (4/12 on desktop, 1/1 on mobile/tablet) */}
            <div className="lg:col-span-4 space-y-8">
              {walletsLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="card-base">
                  <h3 className="font-semibold text-lg mb-4">My Cards</h3>
                  {/* Wallet cards preview */}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </DashboardLayout>
  )
}
```

**Checklist for Each Page:**
- [ ] Import DashboardLayout (or AuthLayout/PublicLayout)
- [ ] Import Container with proper maxWidth
- [ ] Import required hooks
- [ ] Implement responsive grid (mobile/tablet/desktop breakpoints)
- [ ] Add loading skeletons
- [ ] Add error handling
- [ ] Add animation classes (animate-in fade-in)
- [ ] Update tests to verify grid structure
- [ ] Update Storybook story with responsive variants

---

## PHASE 5: TESTING & VALIDATION (Days 5-7)

### 5.1 Testing Strategy

**Unit Tests (Per Page):**
- [ ] Grid renders correct column count at each breakpoint
- [ ] Hooks are called with correct parameters
- [ ] Loading states show skeletons
- [ ] Error states show error message
- [ ] Data is mapped correctly to components

**Responsive Tests:**
- [ ] Mobile breakpoint (<640px): single column, sidebar hidden
- [ ] Tablet breakpoint (640-1024px): 2 columns, sidebar visible
- [ ] Desktop breakpoint (≥1024px): 3+ columns, full layout

**Visual Regression:**
- [ ] Snapshot tests for each page at each breakpoint
- [ ] CSS class application verified (via DOM inspection)
- [ ] No layout shift on data load (skeleton sizing)

**Integration Tests:**
- [ ] Hook → API call → Adapter → Component rendering
- [ ] User can navigate between pages
- [ ] Sidebar navigation works on all breakpoints

### 5.2 Test Template

```typescript
/* Example: src/app/(app)/dashboard/__tests__/page.test.tsx */

import { render, screen } from '@testing-library/react'
import DashboardPage from '../page'
import { useDashboardOverview } from '@/hooks/useDashboardOverview'

jest.mock('@/hooks/useDashboardOverview')
jest.mock('@/hooks/useRecentTransactions')
jest.mock('@/hooks/useWallets')

describe('DashboardPage', () => {
  it('renders KPI cards grid with correct columns on desktop', () => {
    // Mock hooks with data
    (useDashboardOverview as jest.Mock).mockReturnValue({
      data: mockOverviewData,
      loading: false,
      error: null,
    })

    render(<DashboardPage />)
    
    // Verify grid has correct Tailwind classes
    const kpiGrid = screen.getByTestId('kpi-grid')
    expect(kpiGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('shows loading skeletons while fetching', () => {
    (useDashboardOverview as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    })

    render(<DashboardPage />)
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
  })

  it('shows error message on API failure', () => {
    (useDashboardOverview as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to fetch',
    })

    render(<DashboardPage />)
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument()
  })
})
```

---

## SUMMARY: WORK ITEMS CHECKLIST

### PHASE 1: Global Setup (Days 1-2)
- [ ] 1.1 Update CSS variables (layout dimensions, card/table/badge systems)
- [ ] 1.2 Extend Tailwind config (container, widths, heights, gaps, grids)
- [ ] 1.3 Enhance Container component (size, padding, maxWidth props)

### PHASE 2: Page Specs (Days 2-3)
- [ ] 2.1 Analyze current pages (7 existing, 3 missing)
- [ ] 2.2 Define grid specs for each page (ASCII diagrams)
- [ ] 2.3 Document responsive breakpoints (mobile/tablet/desktop)

### PHASE 3: Data Hooks (Days 3-4)
- [ ] 3.1 Create/verify 12 required hooks
- [ ] Add TypeScript types
- [ ] Add unit tests & Storybook stories
- [ ] Verify adapters

### PHASE 4: Page Refactoring (Days 4-7)
- [ ] 4.1 Auth Pages (Login/Register) → 2 days
- [ ] Dashboard (Main) → 2 days
- [ ] Wallets & Transactions → 2 days
- [ ] Profile & Settings → 1 day
- [ ] Compliance → 1 day
- [ ] Analytics (NEW) → 2 days
- [ ] Users (NEW) → 1 day
- [ ] Audit (NEW) → 1 day

### PHASE 5: Testing & Validation (Days 5-7)
- [ ] 5.1 Unit tests for each page
- [ ] Responsive tests for grid structure
- [ ] Visual regression tests (snapshots)
- [ ] Integration tests (hook → API → component)

---

## DELIVERABLES

**By End of PR 6:**

1. ✅ All 7 existing pages refactored with spec-compliant layouts
2. ✅ 3 new pages created (Analytics, Users, Audit)
3. ✅ 12 data hooks implemented and tested
4. ✅ Global CSS variables and Tailwind extensions complete
5. ✅ All pages responsive (mobile/tablet/desktop breakpoints)
6. ✅ All pages have unit tests + Storybook stories
7. ✅ No breaking changes to existing components
8. ✅ Build success + all tests passing

**Estimated Time:** 5-7 days (full-time development)

---

## NEXT STEPS

1. **Review this plan** → Confirm understanding, ask clarifying questions
2. **Start PHASE 1** → Update CSS, Tailwind, Container component
3. **Verify tests pass** → Ensure no regressions
4. **Create PHASE 2 details** → Define each page's exact grid structure
5. **Implement in order** → Follow refactoring order strictly

---

**Questions?** Ask me to clarify any part of this plan before we start implementing.
