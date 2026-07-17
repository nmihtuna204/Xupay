# 📊 XUPay System - Optimized Diagrams (ONE Screenshot Each)

All diagrams fitted to single screen - NO SCROLLING NEEDED! ✅

> **💡 TIP**: Use https://mermaid.live to view each diagram as ONE complete image.

---


## 🎯 QUICK START

1. Copy diagram code
2. Go to https://mermaid.live
3. Paste in left editor
4. RIGHT SIDE = Complete diagram (no scroll!)
5. Screenshot!

---

## 📊 DIAGRAM 1: System Architecture

```mermaid
graph TB
    Client["🖥️ Client"]
    Gateway["🔐 Gateway"]
    UserService["👤 User"]
    PaymentService["💳 Payment"]
    WalletService["💰 Wallet"]
    Notification["📧 Notify"]
    UserDB["🗄️ User DB"]
    PaymentDB["🗄️ Pay DB"]
    WalletDB["🗄️ Wal DB"]
    Cache["⚡ Cache"]
    Queue["📨 Queue"]
    
    Client -->|HTTP| Gateway
    Gateway -->|Route| UserService
    Gateway -->|Route| PaymentService
    Gateway -->|Route| WalletService
    UserService -->|R/W| UserDB
    PaymentService -->|R/W| PaymentDB
    WalletService -->|R/W| WalletDB
    UserService -->|Cache| Cache
    PaymentService -->|Cache| Cache
    WalletService -->|Cache| Cache
    PaymentService -->|Event| Queue
    WalletService -->|Event| Queue
    Queue -->|Consume| Notification
    Notification -->|Send| Client

    style Client fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style Gateway fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style UserService fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style PaymentService fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style WalletService fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style Notification fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff
    style Cache fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style Queue fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style UserDB fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style PaymentDB fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style WalletDB fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
```

---

## 📱 DIAGRAM 2: User Login Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant API as Service
    participant DB as DB
    participant C as Cache
    
    U->>FE: Email & Pass
    FE->>API: POST /login
    API->>C: Check Cache
    C-->>API: Miss
    API->>DB: Query User
    DB-->>API: Data
    API->>C: Store
    API-->>FE: JWT Token
    FE-->>U: ✅ Logged In
```

---

## 💳 DIAGRAM 3: Payment Processing

```mermaid
graph LR
    A["💳 Initiate"] --> B["✓ Validate"]
    B --> C["🔐 Auth"]
    C --> D["💰 Check Balance"]
    D --> E{"Funds?"}
    E -->|NO| F["❌ REJECT"]
    E -->|YES| G["💸 Deduct"]
    G --> H["📝 Record"]
    H --> I["📧 Confirm"]
    F --> J["✅ Done"]
    I --> J
    
    style A fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style E fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style F fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style G fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style J fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 💰 DIAGRAM 4: Wallet States

```mermaid
erDiagram
    USERS {
        UUID id PK
        string email
        string phone
        string first_name
        string last_name
        date date_of_birth
        string nationality
        string password_hash
        string kyc_status
        string kyc_tier
        timestamptz kyc_verified_at
        UUID kyc_verified_by
        boolean is_active
        boolean is_suspended
        text suspension_reason
        int fraud_score
        inet ip_address_registration
        text user_agent_registration
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_login_at
    }

    USER_PREFERENCES {
        UUID id PK
        UUID user_id FK UNIQUE
        string language
        string timezone
        string currency
        boolean notification_email
        boolean notification_sms
        boolean notification_push
        boolean two_factor_enabled
        string two_factor_method
        boolean biometric_enabled
        boolean auto_topup_enabled
        long auto_topup_threshold_cents
        long auto_topup_amount_cents
        string theme
        timestamptz created_at
        timestamptz updated_at
    }

    USER_CONTACTS {
        UUID id PK
        UUID user_id FK
        UUID contact_user_id FK
        string nickname
        int total_transactions
        timestamptz last_transaction_at
        boolean is_favorite
        timestamptz created_at
        timestamptz updated_at
    }

    KYC_DOCUMENTS {
        UUID id PK
        UUID user_id FK
        string document_type
        string document_number
        string document_country
        text file_url
        long file_size_bytes
        string mime_type
        string verification_status
        text verification_notes
        UUID verified_by
        timestamptz verified_at
        timestamptz expires_at
        jsonb extracted_data
        timestamptz created_at
        timestamptz updated_at
    }

    DAILY_USAGE {
        UUID id PK
        UUID user_id FK
        date usage_date
        long total_sent_cents
        int total_sent_count
        long total_received_cents
        int total_received_count
        jsonb hourly_sent_counts
        timestamptz created_at
        timestamptz updated_at
    }

    TRANSACTION_LIMITS {
        UUID id PK
        string tier_name UNIQUE
        long daily_send_limit_cents
        long daily_receive_limit_cents
        long single_transaction_max_cents
        long monthly_volume_limit_cents
        int max_transactions_per_day
        int max_transactions_per_hour
        boolean can_send_international
        boolean can_receive_merchant_payments
        timestamptz created_at
        timestamptz updated_at
    }

    WALLETS {
        UUID id PK
        UUID user_id          "user service (external) -- no DB FK"
        string gl_account_code FK
        string wallet_type
        string currency
        boolean is_active
        boolean is_frozen
        text freeze_reason
        datetime created_at
        datetime updated_at
    }

    TRANSACTIONS {
        UUID id PK
        UUID idempotency_key UNIQUE
        UUID from_wallet_id FK
        UUID to_wallet_id FK
        UUID from_user_id      "user service (external)"
        UUID to_user_id        "user service (external)"
        long amount_cents
        string currency
        string type
        string status
        text description
        string reference_number
        boolean is_flagged
        int fraud_score
        text fraud_reason
        string ip_address
        text user_agent
        boolean is_reversed
        UUID reversed_by_transaction_id
        text reversal_reason
        datetime created_at
        datetime completed_at
    }

    LEDGER_ENTRIES {
        UUID id PK
        UUID transaction_id FK
        string gl_account_code FK
        UUID wallet_id FK
        string entry_type
        long amount_cents
        text description
        boolean is_reversed
        UUID reversed_by_entry_id
        datetime created_at
    }

    CHART_OF_ACCOUNTS {
        UUID id PK
        string account_code UNIQUE
        string account_name
        string account_type
        string normal_balance
        string parent_account_code
        boolean is_active
        text description
        datetime created_at
        datetime updated_at
    }

    MERCHANTS {
        UUID id PK
        UUID user_id           "user service (external)"
        UUID wallet_id FK
        string business_name
        string business_registration_number
        string business_type
        decimal merchant_fee_percentage
        string settlement_frequency
        boolean is_active
        boolean is_verified
        datetime created_at
        datetime updated_at
    }

    IDEMPOTENCY_CACHE {
        UUID idempotency_key PK
        jsonb response_data
        UUID transaction_id
        datetime expires_at
        datetime created_at
    }

    FRAUD_RULES {
        UUID id PK
        string rule_name UNIQUE
        string rule_type
        jsonb parameters
        int risk_score_penalty
        string action
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% Relationships
    USERS ||--|| USER_PREFERENCES : "has"
    USERS ||--o{ USER_CONTACTS : "owner"
    USER_CONTACTS }o--|| USERS : "contact_user"
    USERS ||--o{ KYC_DOCUMENTS : "uploads"
    USERS ||--o{ DAILY_USAGE : "daily_records"

    TRANSACTION_LIMITS ||--|| TRANSACTION_LIMITS : "config"  %% standalone config table (no FK relations)

    WALLETS }o--|| CHART_OF_ACCOUNTS : "gl_account ->"
    TRANSACTIONS ||--o{ LEDGER_ENTRIES : "creates"
    LEDGER_ENTRIES }o--|| CHART_OF_ACCOUNTS : "posts_to"
    WALLETS ||--o{ TRANSACTIONS : "from/to"
    MERCHANTS }o--|| WALLETS : "uses_wallet"
    MERCHANTS }o--|| USERS : "owner (external)"
    WALLETS }o..|| USERS : "owner (external, no FK)"
    TRANSACTIONS }o..|| USERS : "from/to (external)"
    IDEMPOTENCY_CACHE ||--|| TRANSACTIONS : "may reference"
    FRAUD_RULES ||--|| TRANSACTIONS : "applied_by (logical)"
    CHART_OF_ACCOUNTS }o--|| CHART_OF_ACCOUNTS : "parent_account"
```

---

## 🔐 DIAGRAM 6: Authentication Flow

```mermaid
graph LR
    A["🔓 LOGIN"] --> B["Verify"]
    B --> C{"Valid?"}
    C -->|NO| D["❌ 401"]
    C -->|YES| E["🔑 JWT Token"]
    E --> F["API Request"]
    F --> G["Validate"]
    G --> H{"Valid?"}
    H -->|NO| I["❌ 403"]
    H -->|YES| J["✅ Access"]
    
    style C fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style H fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style J fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 📝 DIAGRAM 7: Transaction Lifecycle

```mermaid
graph LR
    A["📝 Created"] --> B["⏳ Pending"]
    B --> C["🔄 Process"]
    C --> D{"Result?"}
    D -->|Success| E["✅ Done"]
    D -->|Error| F["❌ Failed"]
    E --> G["📧 Confirm"]
    F --> H["📧 Notify"]
    G --> I["✓ Closed"]
    H --> I
    
    style D fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
```

---

## 📊 DIAGRAM 8: KYC Tiers

```mermaid
graph LR
    A["🔓 Tier 0<br/>$0"] --> B["📱 Tier 1<br/>$1K"]
    B --> C["📄 Tier 2<br/>$10K"]
    C --> D["✅ Tier 3<br/>∞"]
    
    style A fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style B fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style C fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style D fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 🌐 DIAGRAM 9: API Request/Response

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Service
    participant D as DB
    
    C->>A: HTTP Req
    A->>A: Parse/Validate/Auth
    A->>S: Route
    S->>D: Query
    D-->>S: Data
    S->>S: Process
    S-->>A: Result
    A->>A: Format
    A-->>C: JSON Response
```

---

## 📧 DIAGRAM 10: Notification System

```mermaid
graph LR
    Event["🔔 Event"] --> Queue["📨 Queue"]
    Queue --> Email["📧 Email"]
    Queue --> SMS["📱 SMS"]
    Queue --> Push["🔔 Push"]
    Email --> User["👤 User"]
    SMS --> User
    Push --> User
    
    style Event fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style Queue fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style User fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## ⚠️ DIAGRAM 11: Error Handling

```mermaid
graph LR
    A["⚠️ ERROR"] --> B{"Type?"}
    B -->|Auth| C["🔐 401/403<br/>Redirect"]
    B -->|Request| D["❌ 400<br/>Error Msg"]
    B -->|Server| E["❌ 500<br/>Log"]
    B -->|Timeout| F["⏱️ 408<br/>Retry 3x"]
    C --> G["📝 LOG"]
    D --> G
    E --> G
    F --> G
    G --> H["✓ Response"]
    
    style B fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style H fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 🛡️ DIAGRAM 12: Security Layers

```mermaid
graph TB
    A["🌐 Request"]
    B["🔐 HTTPS/SSL"]
    C["🔓 JWT Auth"]
    D["🛡️ RBAC"]
    E["✓ Validate Input"]
    F["🔒 DB Encrypt"]
    G["✅ SECURE"]
    
    A --> B --> C --> D --> E --> F --> G
    
    style B fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style C fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style D fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style F fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style G fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 🚀 DIAGRAM 13: Deployment Architecture

```mermaid
graph TB
    A["💻 Dev"] --> B["📦 Build"] --> C["🐳 Docker"]
    C --> D["📋 Registry"]
    D --> E["☁️ Cloud"]
    E --> F["🔄 LB"]
    F --> G["📱 API-1"]
    F --> H["📱 API-2"]
    F --> I["📱 API-3"]
    G --> J["🗄️ DB"]
    H --> J
    I --> J
    G --> K["⚡ Cache"]
    H --> K
    I --> K
    
    style J fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style K fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
```

---

## 📈 DIAGRAM 14: Complete Data Flow

```mermaid
graph LR
    A["👤 User"] --> B["📱 FE"]
    B --> C["🔐 Gateway"]
    C --> D["💳 Payment"]
    D --> E["💰 Wallet"]
    E --> F["🗄️ DB"]
    D --> G["📨 Queue"]
    G --> H["🔔 Notify"]
    H --> I["👤 Confirmed"]
    
    style A fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style B fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style C fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style D fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style E fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style F fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style H fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style I fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
```

---

## 🧪 DIAGRAM 15: Testing Strategy

```mermaid
graph LR
    A["🧪 Testing"] --> B["✅ Unit"]
    A --> C["✅ Integration"]
    A --> D["✅ E2E"]
    A --> E["✅ Security"]
    B --> F["📊 Coverage<br/>>80%"]
    C --> F
    D --> F
    E --> F
    
    style A fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style B fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style C fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style D fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style F fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
```

---

## 🎯 DIAGRAM 16: Agile Sprint Workflow

```mermaid
graph LR
    A["📋 Backlog"] --> B["🔄 Planning"]
    B --> C["📝 Sprint"]
    C --> D["🏃 Execute<br/>2w"]
    D --> E["👨‍💻 Standup"]
    E --> F["💻 Dev+Test"]
    F --> G["📊 Review"]
    G --> H["🔍 Retro"]
    H --> I{"More?"}
    I -->|YES| A
    I -->|NO| J["🎉 Release"]
    
    style I fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style J fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 📅 DIAGRAM 17: Sprint Timeline

```mermaid
gantt
    title 🎯 XUPay Sprints - Jan to Mar 2025
    dateFormat YYYY-MM-DD
    
    Sprint 1 Auth :s1, 2025-01-06, 9d
    Sprint 2 Wallet :s2, 2025-01-20, 9d
    Sprint 3 Payment :s3, 2025-02-03, 9d
    Sprint 4 Notify :s4, 2025-02-17, 9d
    Sprint 5 KYC :s5, 2025-03-03, 9d
    Release :r, 2025-03-12, 2d
```

---

## 📊 DIAGRAM 18: User Story Board

```mermaid
graph LR
    A["📋 BACKLOG"] --> B["🔄 IN PROGRESS"]
    B --> C["👀 IN REVIEW"]
    C --> D["🧪 TESTING"]
    D --> E["✅ DONE"]
    C -->|Changes| B
    D -->|Fail| B
    
    style A fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style B fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style C fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style D fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 🚀 DIAGRAM 19: Release Process

```mermaid
graph LR
    A["🚀 Prep"] --> B["🧪 UAT"]
    B --> C{"Pass?"}
    C -->|NO| A
    C -->|YES| D["🐳 Build"]
    D --> E["📦 Staging"]
    E --> F["✅ Check"]
    F --> G["🌍 PROD"]
    G --> H["📊 Monitor"]
    H --> I["✨ Done"]
    
    style C fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style G fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 📈 DIAGRAM 20: Sprint Burndown

```mermaid
graph LR
    A["D0<br/>40"] --> B["D2<br/>38"]
    B --> C["D4<br/>30"]
    C --> D["D6<br/>22"]
    D --> E["D8<br/>15"]
    E --> F["D10<br/>8"]
    F --> G["D12<br/>2"]
    G --> H["D14<br/>0✅"]
    
    style A fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style H fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 👥 DIAGRAM 21: Team Structure

```mermaid
graph TB
    A["🎯 Scrum<br/>Master"]
    B["📊 Product<br/>Owner"]
    C["👨‍💻 Dev Team"]
    D["🧪 QA"]
    C1["Backend"]
    C2["Frontend"]
    C3["DevOps"]
    
    C --> C1
    C --> C2
    C --> C3
    
    E["📅 MEETINGS"]
    E1["Standup 15m"]
    E2["Planning 2h"]
    E3["Review 1h"]
    E4["Retro 1.5h"]
    
    A --> E
    B --> E
    C --> E
    D --> E
    E --> E1
    E --> E2
    E --> E3
    E --> E4
    
    style A fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    style B fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style C fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style D fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style C1 fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style C2 fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style C3 fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style E fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style E1 fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff
    style E2 fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff
    style E3 fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff
    style E4 fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff
```

---

## ✅ ALL 21 DIAGRAMS - READY TO SCREENSHOT

| # | Diagram | Type |
|---|---------|------|
| 1 | System Architecture | Flow |
| 2 | User Login Flow | Sequence |
| 3 | Payment Processing | Flow |
| 4 | Wallet States | State |
| 5 | Database ERD | Database |
| 6 | Authentication | Flow |
| 7 | Transaction Lifecycle | Flow |
| 8 | KYC Tiers | Progression |
| 9 | API Cycle | Sequence |
| 10 | Notifications | Flow |
| 11 | Error Handling | Flow |
| 12 | Security Layers | Flow |
| 13 | Deployment | Architecture |
| 14 | Data Flow | Flow |
| 15 | Testing Strategy | Structure |
| 16 | Agile Process | Flow |
| 17 | Sprint Timeline | Gantt |
| 18 | Story Board | Flow |
| 19 | Release Process | Flow |
| 20 | Burndown Chart | Progression |
| 21 | Team Structure | Organization |

---

## 🎯 HOW TO USE

1. **Copy diagram code**
2. **Go to https://mermaid.live**
3. **Paste in left side**
4. **Screenshot right side** = COMPLETE diagram (no scroll!)
5. **Insert in report**

✅ **Each diagram fits in ONE screenshot!**

---

**Generated**: December 23, 2025
**System**: XUPay Payment Service System  
**Version**: 4.0 - Optimized for Single Screenshot

All diagrams optimized to fit within mermaid.live viewport 🎉
