# PR 6: PHASE 2 - Page Grid Specifications & Architecture
**Date:** December 23, 2025  
**Status:** 🚀 PHASE 2 IN PROGRESS  
**Scope:** 10 pages with responsive grids, breakpoints, and data dependencies

---

## 📋 PHASE 2 OVERVIEW

### What We're Building:
Complete responsive layout specifications for all 10 XuPay pages with:
- ASCII diagrams (mobile/tablet/desktop)
- Responsive breakpoint mappings
- Data dependencies (hooks + APIs)
- Component requirements
- Loading/Error states

### Pages to Specify (Priority Order):
1. **Dashboard** - Main dashboard with KPIs + charts
2. **Transactions** - List with filters + table/card view
3. **Wallets** - Card grid with pagination
4. **Analytics** - ✅ Created (audit reference)
5. **Audit** - ✅ Created (reference)
6. **Auth Pages** - Login/Register split-screen
7. **Profile** - User profile form
8. **Settings** - Settings tabs/form
9. **Users** - Admin table (similar to Audit)
10. **Wallet Detail** - Single wallet view with transaction history

---

## 🎯 PAGE 1: DASHBOARD (`/app/dashboard`)

### Purpose
Main financial dashboard showing KPIs, balance history, recent transactions, and wallet overview.

### Grid Structure

#### Mobile (<640px)
```
┌─────────────────────────────┐
│ [Topbar]                    │
├─────────────────────────────┤
│ [Sidebar - Hidden/Overlay]  │
├─────────────────────────────┤
│ Container (px-4 py-4)       │
├─────────────────────────────┤
│                             │
│  KPI Card 1 (100%)          │
│  [Balance]                  │
│                             │
├─────────────────────────────┤
│                             │
│  KPI Card 2 (100%)          │
│  [Spending]                 │
│                             │
├─────────────────────────────┤
│                             │
│  KPI Card 3 (100%)          │
│  [Active Users]             │
│                             │
├─────────────────────────────┤
│                             │
│  KPI Card 4 (100%)          │
│  [Yield]                    │
│                             │
├─────────────────────────────┤
│ Chart Container (100%)      │
│ [Balance History Chart]     │
│ (Simple bar chart, CSS)     │
├─────────────────────────────┤
│ Recent Transactions         │
│ [Card Stack - space-y-4]    │
│ - Transaction 1             │
│ - Transaction 2             │
│ - Transaction 3             │
│ (Show 3 items, scroll for   │
│  more)                      │
└─────────────────────────────┘
```

#### Tablet (640-1024px)
```
┌────────────────────────────────────┐
│ [Topbar]                           │
├─────────────┬──────────────────────┤
│ [Sidebar]   │ Container (px-6 py-6)│
│             │                      │
│ Navigation  │  KPI Card 1  KPI 2   │
│             │  [2 columns]         │
│             ├──────────────────────┤
│             │  KPI Card 3  KPI 4   │
│             │  [2 columns]         │
│             ├──────────────────────┤
│             │ Chart Container      │
│             │ (100% width)         │
│             │ [Balance History]    │
│             ├──────────────────────┤
│             │ Recent Transactions  │
│             │ [Card Stack]         │
│             │ - Transaction 1      │
│             │ - Transaction 2      │
│             │ - Transaction 3      │
│             │                      │
└─────────────┴──────────────────────┘
```

#### Desktop (≥1024px)
```
┌────────────────────────────────────────────────────────┐
│ [Topbar]                                               │
├─────────────┬──────────────────────────────────────────┤
│ [Sidebar]   │ Container (max-w-7xl, px-6 py-8)         │
│             │                                          │
│             │  KPI 1   KPI 2   KPI 3   KPI 4          │
│             │  [4 columns, gap-6]                      │
│             │                                          │
│             ├────────────────────┬────────────────────┤
│             │ Chart Container    │ Sidebar Cards      │
│             │ (2/3 width)        │ (1/3 width)        │
│             │                    │                    │
│             │ Balance History    │ Top Wallets        │
│             │ [Line Chart]       │ [Card Stack]       │
│             │                    │ - Wallet 1         │
│             │ (height: 300px)    │ - Wallet 2         │
│             │                    │                    │
│             ├────────────────────┤                    │
│             │ Recent Transactions│ Quick Actions      │
│             │ [Table - 12 cols]  │ [Button Stack]     │
│             │                    │                    │
│             │ - Row 1            │                    │
│             │ - Row 2            │                    │
│             │ - Row 3            │                    │
│             │                    │                    │
└─────────────┴────────────────────┴────────────────────┘
```

### Responsive Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| KPI Grid | 1 col | 2 cols | **4 cols** |
| Main Grid | 1 col | 1 col | **2/3 + 1/3** |
| Chart Height | 250px | 280px | 300px |
| Sidebar Cards | Stack | Stack | Stack (4 items) |
| Transaction View | Card | Card | Table |

### CSS Classes

```tailwind
/* KPI Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-default

/* Main Content Grid */
grid grid-cols-1 lg:grid-cols-3 gap-grid-default

/* Chart Container */
lg:col-span-2

/* Sidebar Container */
lg:col-span-1 space-y-6

/* Recent Transactions */
lg:col-span-3 (if using grid)
OR
block (if in flow)
```

### Data Dependencies

**Hooks Required:**
- `useDashboardOverview()` ✅ Already created
  - Returns: { kpis, chartData, recentTransactions }
  - Data: { label, value, change, trend }

**API Endpoints:**
- `dashboardApi.getOverview()` (5-min cache)
- `walletsApi.getTopWallets()` (for sidebar)

**Alternative Data Sources:**
- `useTransactionStats()` (if not using dashboard hook)
- `useWallets()` (top 4 wallets)

**Mock Data File:**
- `src/lib/mock-data.ts` → `MOCK_DASHBOARD_OVERVIEW`

### Loading State

```
KPI Cards:      Skeleton (height: 120px, width: 100%)
Chart:          Skeleton (height: 300px, full-width)
Transactions:   Skeleton (3 rows, height: 50px each)
Sidebar Cards:  Skeleton (4 items, height: 100px)
```

### Error State

```
Card-based error display:
┌────────────────────────────────────┐
│ ⚠️ Error Loading Data              │
│ Failed to fetch dashboard data.    │
│ [Retry Button]                     │
└────────────────────────────────────┘
```

---

## 🎯 PAGE 2: TRANSACTIONS (`/app/transactions`)

### Purpose
Complete transaction history with filtering, search, and responsive table/card view.

### Grid Structure

#### Mobile (<640px)
```
┌─────────────────────────────┐
│ [Topbar]                    │
├─────────────────────────────┤
│ Container (px-4 py-4)       │
├─────────────────────────────┤
│                             │
│ SUMMARY SECTION             │
│                             │
│ Summary Card 1 (100%)       │
│ [Total Spent]               │
├─────────────────────────────┤
│ Summary Card 2 (100%)       │
│ [Total Received]            │
├─────────────────────────────┤
│ Summary Card 3 (100%)       │
│ [Transaction Count]         │
├─────────────────────────────┤
│                             │
│ FILTERS SECTION             │
│ [Stacked vertically]        │
│                             │
│ [Date Range Picker]         │
│ [Type Filter Dropdown]      │
│ [Status Filter Dropdown]    │
│ [Search Input]              │
├─────────────────────────────┤
│                             │
│ TRANSACTIONS SECTION        │
│ [Card View - Mobile Only]   │
│                             │
│ Transaction Card 1          │
│ ├─ Date: 12/23/2025         │
│ ├─ Amount: $500             │
│ ├─ Type: Transfer           │
│ ├─ Status: Success (badge)  │
│ └─ [View Details Button]    │
│                             │
│ Transaction Card 2          │
│ Transaction Card 3          │
│ [Pagination - Next/Prev]    │
│                             │
└─────────────────────────────┘
```

#### Tablet (640-1024px)
```
┌────────────────────────────────────┐
│ [Topbar]                           │
├─────────────┬──────────────────────┤
│ [Sidebar]   │ Container (px-6 py-6)│
│             │                      │
│             │ SUMMARY (3 cols)     │
│             │ Card 1  Card 2  Card3│
│             ├──────────────────────┤
│             │                      │
│             │ FILTERS (flex wrap)  │
│             │ [Date] [Type]        │
│             │ [Status] [Search]    │
│             ├──────────────────────┤
│             │                      │
│             │ TRANSACTIONS         │
│             │ [Card View]          │
│             │ - Card 1             │
│             │ - Card 2             │
│             │ - Card 3             │
│             │ - Card 4             │
│             │ [Pagination]         │
│             │                      │
└─────────────┴──────────────────────┘
```

#### Desktop (≥1024px)
```
┌────────────────────────────────────────────────────────┐
│ [Topbar]                                               │
├─────────────┬──────────────────────────────────────────┤
│ [Sidebar]   │ Container (max-w-7xl, px-6 py-8)         │
│             │                                          │
│             │ SUMMARY CARDS (3 columns)                │
│             │ Card 1 (33%)   Card 2 (33%)   Card 3     │
│             │                                          │
│             ├──────────────────────────────────────────┤
│             │                                          │
│             │ FILTERS (inline, horizontal)             │
│             │ [Date Range] [Type▼] [Status▼] [Search]  │
│             │                                          │
│             ├──────────────────────────────────────────┤
│             │                                          │
│             │ TABLE VIEW (12 columns)                  │
│             │                                          │
│             │ ┌─────────────────────────────────────┐  │
│             │ │ Date│Type│From│To│Amount│Fee│Status│  │
│             │ ├─────────────────────────────────────┤  │
│             │ │ Row 1 (hover: gray bg)              │  │
│             │ │ Row 2                               │  │
│             │ │ Row 3                               │  │
│             │ │ Row 4                               │  │
│             │ │ Row 5 (scrollable)                  │  │
│             │ └─────────────────────────────────────┘  │
│             │                                          │
│             │ Pagination: [Prev] Page 1 of 10 [Next]   │
│             │                                          │
└─────────────┴──────────────────────────────────────────┘
```

### Responsive Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Summary Grid | 1 col | 3 cols | **3 cols** |
| Filter Layout | Stack | Wrap | **Inline** |
| Transaction View | Cards | Cards | **Table** |
| Table Columns | N/A | N/A | 7 visible |
| Card Width | 100% | 100% | N/A |

### CSS Classes

```tailwind
/* Summary Grid */
grid grid-cols-1 md:grid-cols-3 gap-grid-default

/* Filters Container */
flex flex-col md:flex-wrap lg:flex-row gap-4 items-end

/* Transactions Section */
hidden lg:block (for table)
lg:hidden (for cards)

/* Table */
class="w-full"
thead: sticky top-0 table-sticky-header
tbody: divide-y

/* Card View */
space-y-4 card-interactive
```

### Data Dependencies

**Hooks Required:**
- `useTransactionStats()` → Summary KPIs
  - Returns: { totalSpent, totalReceived, count, totalFees }

- `useTransactions(params)` → Transaction list
  - Params: { limit, offset, dateRange, type, status, search }
  - Returns: { data: Transaction[], total, limit, offset }

**API Endpoints:**
- `transactionsApi.getStats({ dateRange })`
- `transactionsApi.getList({ limit: 50, offset, ...filters })`

**Mock Data File:**
- `src/lib/mock-data.ts` → `MOCK_TRANSACTIONS`

### Loading State

```
Summary Cards:    3x Skeleton (height: 120px)
Filters:          Placeholder grayed-out
Table:            Skeleton rows (10x height: 50px)
Cards:            Skeleton (10x height: 140px)
```

### Error State

```
Card with error icon:
┌──────────────────────────────┐
│ ⚠️ Failed to load            │
│ transactions. [Retry]        │
└──────────────────────────────┘
```

---

## 🎯 PAGE 3: WALLETS (`/app/wallets`)

### Purpose
User's wallet collection displayed as a card grid with balance, transactions, and actions.

### Grid Structure

#### Mobile (<640px)
```
┌─────────────────────────────┐
│ [Topbar]                    │
├─────────────────────────────┤
│ Container (px-4 py-4)       │
├─────────────────────────────┤
│                             │
│ [Add Wallet Button]         │
│ (Full width, mb-6)          │
├─────────────────────────────┤
│                             │
│ Wallet Card 1 (100%)        │
│ ┌──────────────────────────┐│
│ │ 💳 Wallet Name           ││
│ │ Balance: $1,234.56       ││
│ │ Type: Savings            ││
│ │ Status: Active (badge)   ││
│ │ [View Details] [Actions] ││
│ └──────────────────────────┘│
├─────────────────────────────┤
│                             │
│ Wallet Card 2 (100%)        │
│                             │
├─────────────────────────────┤
│                             │
│ Wallet Card 3 (100%)        │
│                             │
├─────────────────────────────┤
│ [Load More] button          │
│ (if more wallets exist)     │
│                             │
└─────────────────────────────┘
```

#### Tablet (640-1024px)
```
┌────────────────────────────────────┐
│ [Topbar]                           │
├─────────────┬──────────────────────┤
│ [Sidebar]   │ Container (px-6 py-6)│
│             │                      │
│             │ [Add Wallet Button]  │
│             │ (Inline, float-right)│
│             │                      │
│             │ Wallet Cards (2 cols)│
│             │                      │
│             │ Card 1     Card 2    │
│             │                      │
│             │ Card 3     Card 4    │
│             │                      │
│             │ Card 5               │
│             │ (50% width, float)   │
│             │                      │
│             │ [Load More]          │
│             │                      │
└─────────────┴──────────────────────┘
```

#### Desktop (≥1024px)
```
┌────────────────────────────────────────────────────────┐
│ [Topbar]                                               │
├─────────────┬──────────────────────────────────────────┤
│ [Sidebar]   │ Container (max-w-7xl, px-6 py-8)         │
│             │                                          │
│             │ [Add Wallet Button] [Filter/Sort ▼]      │
│             │                                          │
│             │ Wallet Cards (3 columns, gap-6)          │
│             │                                          │
│             │ ┌──────────────┐ ┌──────────────┐        │
│             │ │ Card 1       │ │ Card 2       │ Card 3 │
│             │ │ Balance      │ │ Balance      │        │
│             │ │ Status       │ │ Status       │        │
│             │ │ Actions      │ │ Actions      │        │
│             │ └──────────────┘ └──────────────┘        │
│             │                                          │
│             │ ┌──────────────┐ ┌──────────────┐        │
│             │ │ Card 4       │ │ Card 5       │ Card 6 │
│             │ │              │ │              │        │
│             │ └──────────────┘ └──────────────┘        │
│             │                                          │
│             │ ┌──────────────┐                         │
│             │ │ Card 7       │                         │
│             │ │ (33% width)  │                         │
│             │ └──────────────┘                         │
│             │                                          │
│             │ [Load More] or Pagination                │
│             │                                          │
└─────────────┴──────────────────────────────────────────┘
```

### Responsive Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Card Grid | 1 col | 2 cols | **3 cols** |
| Button Position | Full-width | Inline | Inline |
| Card Height | 180px | 190px | 200px |
| Gap | gap-4 | gap-6 | **gap-6** |

### CSS Classes

```tailwind
/* Card Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-default

/* Individual Card */
card-interactive h-auto

/* Button Container */
flex justify-between items-center mb-6
```

### Data Dependencies

**Hooks Required:**
- `useWallets(params)` → Wallet list with pagination
  - Params: { limit: 12, offset, filters: { type, status } }
  - Returns: { data: Wallet[], total, limit, offset }

**API Endpoints:**
- `walletsApi.getWallets({ limit: 12, offset, ...filters })`

**Wallet Card Data:**
```typescript
interface WalletCard {
  id: string
  name: string
  type: 'savings' | 'checking' | 'investment'
  balance: number
  currency: string
  status: 'active' | 'inactive' | 'frozen'
  lastTransaction?: Date
  transactionCount: number
}
```

**Mock Data File:**
- `src/lib/mock-data.ts` → `MOCK_WALLETS`

### Loading State

```
Skeleton Cards: 6 cards (height: 200px, full-width on mobile)
Animation: pulse with fade-in
```

### Error State

```
┌──────────────────────────────┐
│ ⚠️ Failed to load wallets     │
│ [Retry] [Go to Dashboard]    │
└──────────────────────────────┘
```

---

## 🎯 PAGE 4: ANALYTICS (`/app/analytics`)

### Purpose
✅ **ALREADY CREATED** - Advanced analytics with KPIs, user growth, transaction volume, and conversion metrics.

**Location:** `src/app/(app)/analytics/page.tsx` (165 lines)  
**Status:** ✅ Production ready  
**Data Hook:** `useAnalyticsOverview(period)`

### Quick Reference
- **KPI Grid:** 1→2→4 cols
- **Chart Grid:** 1→2 cols
- **Responsive:** Mobile/Tablet cards, Desktop charts

---

## 🎯 PAGE 5: AUDIT (`/app/audit`)

### Purpose
✅ **ALREADY CREATED** - Compliance audit log with filters, desktop table, mobile cards, and pagination.

**Location:** `src/app/(app)/audit/page.tsx` (228 lines)  
**Status:** ✅ Production ready  
**Data Hook:** `useAuditLog(params)`

### Quick Reference
- **Filters:** 3-column grid (action, actor, status)
- **Desktop:** Sticky-header table (12 cols)
- **Mobile:** Card stack (hidden on desktop)
- **Pagination:** Offset-based (limit: 50)

---

## 🎯 PAGE 6: AUTH PAGES (`/auth/login` & `/auth/register`)

### Purpose
Authentication pages with split-screen layout: form on left, hero/branding on right.

### Grid Structure

#### Mobile (<640px)
```
┌─────────────────────────────┐
│ [Logo - Minimal]            │
├─────────────────────────────┤
│                             │
│ LOGIN / REGISTER FORM       │
│                             │
│ [Heading]                   │
│ "Welcome Back"              │
│ or "Create Account"         │
│                             │
│ [Form Fields - Full Width]  │
│                             │
│ [Email Input]               │
│ [Password Input]            │
│ [Confirm Password]*         │
│ (for register only)         │
│                             │
│ [Agree to Terms]*           │
│ (for register only)         │
│                             │
│ [Submit Button]             │
│ (Full width, primary)       │
│                             │
│ [Switch Page Link]          │
│ "Don't have account?"       │
│ "Already have account?"     │
│                             │
│ [Social Login Buttons]      │
│ (Optional)                  │
│                             │
└─────────────────────────────┘
```

#### Tablet (640-1024px)
```
┌────────────────────────────────────┐
│ [Logo - Top Left]                  │
├────────────────────────────────────┤
│                                    │
│ [Hero Section - Simplified]        │
│ or [Form - Expanded]               │
│                                    │
│ LOGIN / REGISTER FORM              │
│                                    │
│ [Centered, max-w-md]               │
│ [All form fields]                  │
│ [Submit Button]                    │
│ [Switch Page Link]                 │
│                                    │
└────────────────────────────────────┘
```

#### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────────────┐
│ [Navigation - Top]                                      │
├─────────────────────┬─────────────────────────────────┤
│                     │                                 │
│ LEFT SECTION (50%)  │ RIGHT SECTION (50%)             │
│ [Form Container]    │ [Hero Container - Gradient BG] │
│                     │                                 │
│ [Logo - Large]      │ [Large Icon/Illustration]       │
│ [Heading]           │                                 │
│ "Welcome Back"      │ [Heading - Dark/White]          │
│                     │ "Secure Payments"               │
│ [Form Fields]       │                                 │
│ - Email             │ [Description Text]              │
│ - Password          │                                 │
│ - Confirm*          │ [Feature List - Bullets]        │
│ - Terms*            │                                 │
│                     │ [Gradient overlay effect]       │
│ [Submit Button]     │                                 │
│ [Switch Link]       │                                 │
│ [Social Buttons]    │                                 │
│                     │                                 │
└─────────────────────┴─────────────────────────────────┘
```

### Responsive Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Layout | Single col | Single col | **Split 50/50** |
| Form Width | 100% | max-w-md | 50% (flex) |
| Hero Visible | No | No | **Yes** |
| Logo Size | sm | md | lg |
| Heading | h4 | h3 | h2 |

### CSS Classes

```tailwind
/* Main Container */
flex flex-col md:flex-col lg:flex-row min-h-screen

/* Left Form Section */
w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12

/* Right Hero Section */
hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-900

/* Form Container */
w-full max-w-md space-y-6

/* Form Group */
space-y-2

/* Input */
w-full px-4 py-2 border border-gray-300 rounded-lg

/* Submit Button */
w-full py-3 bg-blue-600 text-white rounded-lg
```

### Data Dependencies

**Hooks Required:**
- `useLogin(email, password)` → Authentication
  - Returns: { success, token, user, error }

- `useRegister(email, password, terms)` → Registration
  - Returns: { success, token, user, error }

- `useAuth()` → Check logged-in status
  - Returns: { isAuthenticated, user, logout }

**API Endpoints:**
- `authApi.login({ email, password })`
- `authApi.register({ email, password, ...profile })`
- `authApi.refresh()` (token refresh)

**Form Validation:**
- Email: valid email format
- Password: min 8 chars, 1 uppercase, 1 number
- Confirm Password: must match password
- Terms: must be accepted (register)

### Loading State

```
Button during submission:
[Authenticating...] (disabled, loading spinner)
```

### Error State

```
Error message card above form:
┌──────────────────────────────┐
│ ❌ Invalid email or password  │
│ Please try again             │
└──────────────────────────────┘
```

---

## 🎯 PAGE 7: PROFILE (`/app/profile`)

### Purpose
User profile management with editable form, avatar, and account settings.

### Grid Structure

#### Mobile (<640px)
```
┌─────────────────────────────┐
│ [Topbar]                    │
├─────────────────────────────┤
│ Container (px-4 py-4)       │
├─────────────────────────────┤
│                             │
│ [Profile Header Section]    │
│                             │
│ [Avatar - Centered]         │
│ (w-20 h-20, rounded-full)   │
│                             │
│ [Upload Button]             │
│ (Below avatar)              │
├─────────────────────────────┤
│                             │
│ [Profile Form - Stacked]    │
│                             │
│ [First Name]                │
│ [Input field]               │
│                             │
│ [Last Name]                 │
│ [Input field]               │
│                             │
│ [Email]                     │
│ [Input field - Disabled]    │
│                             │
│ [Phone]                     │
│ [Input field]               │
│                             │
│ [Bio/Description]           │
│ [Textarea field]            │
│                             │
├─────────────────────────────┤
│ [Save Button] - Full width  │
│ [Cancel Button] - Full width│
├─────────────────────────────┤
│                             │
│ [Danger Zone Section]       │
│ [Delete Account Button]     │
│                             │
└─────────────────────────────┘
```

#### Tablet (640-1024px)
```
┌────────────────────────────────────┐
│ [Topbar]                           │
├─────────────┬──────────────────────┤
│ [Sidebar]   │ Container (px-6 py-6)│
│             │                      │
│             │ [Profile Header]     │
│             │ [Avatar] [Upload Btn]│
│             │                      │
│             │ [Form - max-w-2xl]   │
│             │                      │
│             │ [First Name] [Last]  │
│             │ [2 columns]          │
│             │                      │
│             │ [Email] [Phone]      │
│             │ [2 columns - read]   │
│             │                      │
│             │ [Bio/Description]    │
│             │ [Full width]         │
│             │                      │
│             │ [Save] [Cancel]      │
│             │                      │
│             │ [Danger Zone]        │
│             │ [Delete Account]     │
│             │                      │
└─────────────┴──────────────────────┘
```

#### Desktop (≥1024px)
```
┌────────────────────────────────────────────────────────┐
│ [Topbar]                                               │
├─────────────┬──────────────────────────────────────────┤
│ [Sidebar]   │ Container (max-w-7xl centered)           │
│             │                                          │
│             │ [Max-width: 48rem (md)]                  │
│             │                                          │
│             │ [Profile Header]                         │
│             │ [Avatar lg] [Upload]                     │
│             │                                          │
│             │ [Profile Form Grid]                      │
│             │                                          │
│             │ [First Name]        [Last Name]          │
│             │ [input]             [input]              │
│             │                                          │
│             │ [Email]             [Phone]              │
│             │ [input disabled]    [input]              │
│             │                                          │
│             │ [Bio/Description] (full)                 │
│             │ [textarea]                               │
│             │                                          │
│             │ [Button Group - Inline]                  │
│             │ [Save] [Cancel] [Reset]                  │
│             │                                          │
│             │ ─────────────────────────────            │
│             │ [Danger Zone]                            │
│             │ [Delete Account Button - Red]            │
│             │                                          │
└─────────────┴──────────────────────────────────────────┘
```

### Responsive Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Max Width | 100% | auto | max-w-2xl |
| Form Grid | 1 col | 2 cols | **2 cols** |
| Avatar Size | w-20 | w-24 | w-32 |
| Buttons | Stack | Inline | Inline |

### CSS Classes

```tailwind
/* Container */
max-w-2xl mx-auto px-6 py-8

/* Avatar */
w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full

/* Form Grid */
grid grid-cols-1 md:grid-cols-2 gap-6

/* Input Group */
space-y-2

/* Button Group */
flex gap-4 justify-end
```

### Data Dependencies

**Hooks Required:**
- `useCurrentUser()` → Get user profile
  - Returns: { user: User profile data }

- `useUpdateUser(updates)` → Update profile
  - Params: { firstName, lastName, phone, bio, avatar }
  - Returns: { success, updatedUser, error }

- `useUploadAvatar(file)` → Upload avatar
  - Params: { file: File }
  - Returns: { success, imageUrl, error }

**API Endpoints:**
- `userApi.getCurrentUser()`
- `userApi.updateProfile({ ...updates })`
- `userApi.uploadAvatar(formData)`

### Loading State

```
Form fields during load:
[Skeleton loaders]

Submit button during save:
[Saving...] (disabled)
```

### Error State

```
Field-level errors:
┌──────────────────────────────┐
│ Input field with red border  │
│ Error message below field    │
└──────────────────────────────┘
```

---

## 🎯 PAGE 8: SETTINGS (`/app/settings`)

### Purpose
User settings and preferences with multiple sections: account, security, notifications, preferences.

### Grid Structure

#### Mobile (<640px)
```
┌─────────────────────────────┐
│ [Topbar]                    │
├─────────────────────────────┤
│ Container (px-4 py-4)       │
├─────────────────────────────┤
│                             │
│ [SETTINGS TABS/ACCORDION]   │
│ (Stacked vertically)        │
│                             │
│ ▼ Account Settings          │
│ [Content visible]           │
│                             │
│ [Two-Factor Auth]           │
│ [Toggle switch]             │
│                             │
│ [Email Notifications]       │
│ [Toggle switch]             │
│                             │
│ ▶ Security Settings         │
│ [Content hidden]            │
│                             │
│ ▶ Notification Preferences  │
│ [Content hidden]            │
│                             │
│ ▶ Display Settings          │
│ [Content hidden]            │
│                             │
│ ▶ API Keys                  │
│ [Content hidden]            │
│                             │
│ [Save Settings Button]      │
│ (Full width)                │
│                             │
└─────────────────────────────┘
```

#### Tablet (640-1024px)
```
┌────────────────────────────────────┐
│ [Topbar]                           │
├─────────────┬──────────────────────┤
│ [Sidebar]   │ Container (px-6 py-6)│
│             │                      │
│             │ [SETTINGS LAYOUT]    │
│             │                      │
│             │ [Tab Navigation]     │
│             │ [Account]            │
│             │ [Security]           │
│             │ [Notifications]      │
│             │                      │
│             │ [Content Area]       │
│             │                      │
│             │ [Account Tab]        │
│             │ [2FA Toggle]         │
│             │ [Email Notif Toggle] │
│             │ [Password Change Btn]│
│             │                      │
│             │ [Save Button]        │
│             │                      │
└─────────────┴──────────────────────┘
```

#### Desktop (≥1024px)
```
┌────────────────────────────────────────────────────────┐
│ [Topbar]                                               │
├─────────────┬──────────────────────────────────────────┤
│ [Sidebar]   │ Container (max-w-7xl)                    │
│             │                                          │
│             │ [SETTINGS - 2 COL LAYOUT]                │
│             │                                          │
│             │ LEFT (25%)      │ RIGHT (75%)            │
│             │ Tab Nav         │ Content Area           │
│             │ [Account]       │ [Account Section]      │
│             │ [Security]      │ [Form fields]          │
│             │ [Notifications] │ [Toggles]              │
│             │ [Display]       │ [Buttons]              │
│             │ [API Keys]      │                        │
│             │ [Danger Zone]   │ [Save] [Cancel]        │
│             │                 │                        │
│             │                 │ Or on tab change:      │
│             │                 │ [Security Section]     │
│             │                 │ [2FA Setup]            │
│             │                 │ [Sessions]             │
│             │                 │ [Change Password]      │
│             │                 │                        │
└─────────────┴────────────────┴────────────────────────┘
```

### Responsive Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Layout | 1 col (accordion) | 1 col (tabs top) | **2 col (tabs left)** |
| Nav Position | Hidden/Accordion | Top (horizontal) | **Left (vertical)** |
| Content Width | 100% | 100% | **75%** |
| Toggles | Full stack | Stack | Inline |

### CSS Classes

```tailwind
/* Main Layout */
grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-6

/* Tab Navigation */
flex flex-col gap-2 lg:border-r lg:pr-6

/* Content Area */
lg:col-span-3

/* Setting Item */
flex justify-between items-center py-4 border-b
```

### Data Dependencies

**Hooks Required:**
- `useSettings()` → Get user settings
  - Returns: { settings: Settings object }

- `useUpdateSettings(updates)` → Update settings
  - Params: { twoFactor, emailNotifications, theme, language }
  - Returns: { success, settings, error }

- `useChangePassword(oldPwd, newPwd)` → Password change
  - Returns: { success, error }

**API Endpoints:**
- `settingsApi.getSettings()`
- `settingsApi.updateSettings({ ...updates })`
- `settingsApi.changePassword({ oldPassword, newPassword })`

### Loading State

```
Section content during load:
[Skeleton loaders for toggle items]

Save button:
[Saving...] (disabled)
```

### Error State

```
Toast notification (top-right):
❌ Failed to save settings. Please try again.
```

---

## 🎯 PAGE 9: USERS (`/app/users`) - ADMIN PAGE

### Purpose
Admin panel for user management with table view, filters, and bulk actions.

**Similar structure to Audit page** (`src/app/(app)/audit/page.tsx`)

### Grid Structure

#### Desktop Table View
```
┌────────────────────────────────────┐
│ FILTERS (3-column grid)            │
│ [Search] [Status ▼] [Role ▼]       │
├────────────────────────────────────┤
│ TABLE (12 columns, sticky header)  │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Checkbox│Name│Email│Status│  │   │
│ ├──────────────────────────────┤   │
│ │ ☐ | Row1 | data | Badge   │   │   │
│ │ ☐ | Row2 | data | Badge   │   │   │
│ │ ☐ | Row3 | data | Badge   │   │   │
│ │ ... (sticky scroll)         │   │
│ └──────────────────────────────┘   │
│                                    │
│ [Pagination]                       │
│ Showing 1-50 of 1,234              │
│ [Prev] [Next]                      │
└────────────────────────────────────┘
```

#### Mobile Card View
```
User Card 1:
┌──────────────────────┐
│ Name: John Doe       │
│ Email: john@...      │
│ Role: User           │
│ Status: Active       │
│ [Edit] [Disable]     │
└──────────────────────┘
```

### Data Dependencies

**Hooks Required:**
- `useUsers(params)` → User list with filtering
  - Params: { limit, offset, search, status, role }
  - Returns: { data: User[], total, limit, offset }

**API Endpoints:**
- `usersApi.getList({ limit: 50, offset, ...filters })`
- `usersApi.updateUser(id, { ...updates })`

---

## 🎯 PAGE 10: WALLET DETAIL (`/app/wallets/[id]`)

### Purpose
Detailed wallet view with balance, transaction history, and actions.

### Grid Structure

#### Desktop
```
┌────────────────────────────────────────────────────────┐
│ [Topbar] - Breadcrumb: Wallets > Wallet Name          │
├─────────────┬──────────────────────────────────────────┤
│ [Sidebar]   │ Container (max-w-7xl)                    │
│             │                                          │
│             │ [WALLET INFO GRID] (2/3 + 1/3)           │
│             │                                          │
│             │ LEFT (2/3)          │ RIGHT (1/3)        │
│             │ [Wallet Header]     │ [Quick Stats]      │
│             │ - Name              │ - Balance          │
│             │ - Type              │ - Interest Earned  │
│             │ - Created Date      │ - Transactions     │
│             │                     │ - Last Updated     │
│             │ [Balance Card]      │                    │
│             │ - Large, centered   │ [Action Buttons]   │
│             │ - $X,XXX.XX         │ - Transfer         │
│             │                     │ - Deposit          │
│             │ [Transaction Hist]  │ - Withdraw         │
│             │ [Table - 12 cols]   │                    │
│             │ - Date              │                    │
│             │ - Type              │                    │
│             │ - Amount            │                    │
│             │ - Balance           │                    │
│             │ - 10 rows, paginated│                    │
│             │                     │                    │
└─────────────┴─────────────────────┴────────────────────┘
```

---

## 📊 RESPONSIVE GRID MATRIX (ALL PAGES)

```
┌──────────────┬──────────┬──────────┬──────────┐
│ Page         │ Mobile   │ Tablet   │ Desktop  │
├──────────────┼──────────┼──────────┼──────────┤
│ Dashboard    │ 1        │ 2        │ 4 (KPI)  │
│              │          │          │ 2/1 (main)
├──────────────┼──────────┼──────────┼──────────┤
│ Transactions │ 1 (card) │ 1 (card) │ Table    │
│              │ Summary: │ Summary: │ Summary: │
│              │ 1        │ 3        │ 3        │
├──────────────┼──────────┼──────────┼──────────┤
│ Wallets      │ 1        │ 2        │ 3        │
├──────────────┼──────────┼──────────┼──────────┤
│ Analytics    │ 1        │ 2        │ 4 (KPI)  │
│              │          │          │ 2 (chart)
├──────────────┼──────────┼──────────┼──────────┤
│ Audit        │ 1 (card) │ 1 (card) │ Table    │
│              │ Filters: │ Filters: │ Filters: │
│              │ Stack    │ Wrap     │ Inline   │
├──────────────┼──────────┼──────────┼──────────┤
│ Auth         │ 1        │ 1        │ 2 (50/50)│
├──────────────┼──────────┼──────────┼──────────┤
│ Profile      │ 1        │ 2        │ 2        │
├──────────────┼──────────┼──────────┼──────────┤
│ Settings     │ Accd.    │ Tabs     │ 2 (nav)  │
├──────────────┼──────────┼──────────┼──────────┤
│ Users        │ 1 (card) │ 1 (card) │ Table    │
├──────────────┼──────────┼──────────┼──────────┤
│ Wallet Detail│ 1        │ 1        │ 2/1      │
└──────────────┴──────────┴──────────┴──────────┘
```

---

## 🔄 RESPONSIVE CSS CLASS PATTERNS

**All pages follow these patterns:**

### Grid Columns
```tailwind
grid-cols-1           /* Mobile */
md:grid-cols-2        /* Tablet */
lg:grid-cols-3        /* Desktop */
lg:grid-cols-4        /* For KPI cards specifically */
```

### Padding & Gaps
```tailwind
px-4 py-4             /* Mobile */
md:px-6 md:py-6       /* Tablet */
lg:px-6 lg:py-8       /* Desktop */

gap-4                 /* Mobile gap */
md:gap-6 lg:gap-6     /* Desktop gap */
```

### Sidebar & Main
```tailwind
flex flex-col md:flex-row
/* Sidebar: width-full on mobile, fixed width on tablet+ */
/* Main: flex-1 to fill remaining space */
```

### Table → Cards
```tailwind
hidden lg:block        /* Table - visible on desktop only */
lg:hidden              /* Cards - hidden on desktop */
```

---

## 📋 NEXT STEPS (PHASE 2 CONTINUATION)

- [ ] Create ASCII diagrams for all 10 pages ✅ (This document)
- [ ] Document responsive breakpoints ✅ (Above)
- [ ] List data dependencies for each page ✅ (Above)
- [ ] Create Page Grid Specification Document ✅ (THIS FILE)

**After completion:**
- Move to PHASE 3: Create missing hooks (useWallet, useSettings, etc.)
- Move to PHASE 4: Refactor existing pages with new grids
- Move to PHASE 5: Testing & validation

---

## ✨ KEY DESIGN PRINCIPLES (Reference)

1. **Mobile-First:** Design for 1 column, then expand at breakpoints
2. **Responsive Grids:** Use Tailwind's `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` pattern
3. **Consistent Spacing:** All pages use `px-6 py-8` on desktop, `px-4 py-4` on mobile
4. **Table → Cards:** Desktop tables hidden on mobile, cards shown instead
5. **Loading States:** Skeleton components matching content height
6. **Error Handling:** Card-based error messages with retry option
7. **Accessibility:** Semantic HTML, ARIA labels, keyboard navigation

---

## 📁 Files to Update (Ordered)

### PHASE 2 Implementation Order:

1. **Dashboard** - Refactor existing page (HIGH PRIORITY)
2. **Transactions** - Refactor existing page
3. **Wallets** - Refactor existing page
4. **Profile** - Refactor existing page
5. **Settings** - Refactor existing page
6. **Auth Pages** - Refactor login/register
7. **Users** - Create new admin page
8. **Wallet Detail** - Create dynamic route
9. **Analytics** - ✅ Already created
10. **Audit** - ✅ Already created

---

**Status:** 🟡 PHASE 2 SPECIFICATIONS COMPLETE  
**Ready for:** PHASE 3 (Hook creation) and PHASE 4 (Page refactoring)
