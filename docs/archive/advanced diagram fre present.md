# Advanced Diagrams — Slide Deck (FRE Present)

> Short slide deck with ready-to-render Mermaid diagrams and brief speaker notes. Copy the mermaid code into https://mermaid.live (or use local mermaid tooling) and export SVG/PNG for slides.

---

## Slide 4 — System Architecture (Detailed) ✅

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

**Speaker notes:** Highlight separation of concerns (Auth, Payment, Wallet), cache & MQ for performance/scaling, and external integrations (Bank, KYC provider). Recommend exporting as SVG for slide use.

---

## Slide 5 — KYC Tier Progression ✅

```mermaid
graph LR
    A["🔓 Tier 0\n(low limits)"] --> B["📱 Tier 1\n($1K daily)"]
    B --> C["📄 Tier 2\n($10K daily)"]
    C --> D["✅ Tier 3\n(high/enterprise)"]

    style A fill:#ef4444,stroke:#dc2626,stroke-width:1px,color:#fff
    style B fill:#f59e0b,stroke:#d97706,stroke-width:1px,color:#000
    style C fill:#3b82f6,stroke:#1e40af,stroke-width:1px,color:#fff
    style D fill:#10b981,stroke:#059669,stroke-width:1px,color:#fff
```

**Speaker notes:** Explain how KYC tier upgrades increase limits and enable international transfers; call out automated vs manual upgrades.

---

## Slide 7 — P2P Transfer Flow (Sequence) ✅

```mermaid
sequenceDiagram
  participant Client
  participant FE
  participant API as PaymentService
  participant Fraud as FraudService
  participant Wallet as WalletService
  participant DB
  participant Queue

  Client->>FE: Submit transfer form (idempotencyKey)
  FE->>API: POST /api/payments/transfer
  API->>Fraud: Evaluate risk signals
  Fraud-->>API: riskScore
  alt riskScore < threshold
    API->>Wallet: Debit sender wallet
    API->>Wallet: Credit receiver wallet
    Wallet->>DB: Persist transaction + ledger
    DB-->>Wallet: OK
    API->>Queue: Emit transaction.completed event
    API-->>FE: 201 CREATED { transactionId, status: COMPLETED }
  else review/block
    API-->>FE: 202 PROCESSING or 403 BLOCKED
    API->>Queue: Emit sar.created
  end
```

**Speaker notes:** Emphasize idempotency key usage, fraud gating, and the async notification path; include typical latencies and error handling strategies.

---

## Slide 8 — Idempotency Flow ✅

```mermaid
sequenceDiagram
  participant Client
  participant API as PaymentService
  participant Cache as IdempotencyCache
  participant DB

  Client->>API: POST /api/payments/transfer (idempKey=A)
  API->>Cache: check(idempKey=A) -> miss
  API->>...: process transfer
  API->>DB: persist transaction
  API->>Cache: store(idempKey=A -> result)
  API-->>Client: 201 CREATED (result R)

  Client->>API: POST /api/payments/transfer (idempKey=A) -- retry
  API->>Cache: check(idempKey=A) -> hit(R)
  API-->>Client: 200 OK (cached result R)
```

**Speaker notes:** Note TTL for idempotency cache (24h), storage of full response for stable retries, and that duplicate requests should never create new ledger entries.

---

## Slide 9 — ERD (Backup reference)

```mermaid
erDiagram
    USERS ||--o{ WALLETS : "owns"
    USERS ||--o{ TRANSACTIONS : "initiates"
    WALLETS ||--o{ TRANSACTIONS : "involved"
    TRANSACTIONS ||--o{ NOTIFICATIONS : "triggers"

    USERS {
        int id PK
        string email
        string password_hash
        string first_name
        string last_name
        string kyc_tier
    }
    WALLETS {
        int id PK
        int user_id FK
        decimal balance_cents
        string currency
        boolean is_frozen
    }
    TRANSACTIONS {
        int id PK
        int from_wallet_id FK
        int to_wallet_id FK
        long amount_cents
        string status
    }
    NOTIFICATIONS {
        int id PK
        int transaction_id FK
        string type
    }
```

**Speaker notes:** Keep this slide as a compact backup — show ownership and critical monetary fields.

---

## Slide 10 — Authentication Flow (Nice to have)

```mermaid
sequenceDiagram
  actor User
  participant FE
  participant API as AuthService
  participant DB

  User->>FE: Submit credentials
  FE->>API: POST /api/auth/login
  API->>DB: verify credentials
  DB-->>API: user record
  API->>API: issue JWT + refresh token
  API-->>FE: { accessToken, refreshToken }
  FE->>Client: store accessToken (localStorage) and optionally refreshToken (httpOnly cookie)
```

**Speaker notes:** Recommend short TTL for access tokens and refresh tokens stored in httpOnly cookies for better security.

---

## Export & Render Instructions

- Copy each mermaid block into https://mermaid.live and export **SVG** for slide use.
- I can export all diagrams to `report/diagrams/` as SVG files if you want — say “Export SVGs” and I’ll generate them.

---

*Created: December 24, 2025*
```mermaid
classDiagram
  class User {
    +UUID id
    +String email
    +String phone
    +String firstName
    +String lastName
    +LocalDate dateOfBirth
    +String nationality
    +String passwordHash
    +KycStatus kycStatus
    +KycTier kycTier
    +ZonedDateTime kycVerifiedAt
    +UUID kycVerifiedBy
    +Boolean isActive
    +Boolean isSuspended
    +String suspensionReason
    +Integer fraudScore
    +String ipAddressRegistration
    +String userAgentRegistration
    +ZonedDateTime createdAt
    +ZonedDateTime updatedAt
    +ZonedDateTime lastLoginAt
    +boolean canTransact()
    +void approveKyc(KycTier, UUID)
  }

  class UserPreference {
    +UUID id
    +String language
    +String timezone
    +String currency
    +Boolean notificationEmail
    +Boolean notificationSms
    +Boolean notificationPush
    +Boolean twoFactorEnabled
    +String twoFactorMethod
    +Boolean biometricEnabled
    +Boolean autoTopupEnabled
    +Long autoTopupThresholdCents
    +Long autoTopupAmountCents
    +String theme
  }

  class UserContact {
    +UUID id
    +String nickname
    +Integer totalTransactions
    +OffsetDateTime lastTransactionAt
    +Boolean isFavorite
    +void recordTransaction()
    +void toggleFavorite()
  }

  class KycDocument {
    +UUID id
    +DocumentType documentType
    +String documentNumber
    +String documentCountry
    +String fileUrl
    +Long fileSizeBytes
    +String mimeType
    +String verificationStatus
    +String verificationNotes
    +UUID verifiedBy
    +OffsetDateTime verifiedAt
    +OffsetDateTime expiresAt
    +String extractedData
    +void approve(UUID,String)
    +void reject(UUID,String)
  }

  class DailyUsage {
    +UUID id
    +LocalDate usageDate
    +Long totalSentCents
    +Integer totalSentCount
    +Long totalReceivedCents
    +Integer totalReceivedCount
    +String hourlySentCounts
    +void incrementSent(Long)
    +void incrementReceived(Long)
  }

  class TransactionLimit {
    +UUID id
    +String tierName
    +Long dailySendLimitCents
    +Long dailyReceiveLimitCents
    +Long singleTransactionMaxCents
    +Long monthlyVolumeLimitCents
    +Integer maxTransactionsPerDay
    +Integer maxTransactionsPerHour
    +Boolean canSendInternational
    +Boolean canReceiveMerchantPayments
  }

  class Wallet {
    +UUID id
    +UUID userId
    +String glAccountCode
    +WalletType walletType
    +String currency
    +Boolean isActive
    +Boolean isFrozen
    +String freezeReason
  }

  class Transaction {
    +UUID id
    +UUID idempotencyKey
    +UUID fromWalletId
    +UUID toWalletId
    +UUID fromUserId
    +UUID toUserId
    +Long amountCents
    +String currency
    +TransactionType type
    +TransactionStatus status
    +String description
    +String referenceNumber
    +Boolean isFlagged
    +Integer fraudScore
    +String fraudReason
    +LocalDateTime createdAt
    +LocalDateTime completedAt
  }

  class LedgerEntry {
    +UUID id
    +UUID transactionId
    +String glAccountCode
    +UUID walletId
    +EntryType entryType
    +Long amountCents
    +String description
    +Boolean isReversed
    +LocalDateTime createdAt
  }

  class ChartOfAccounts {
    +UUID id
    +String accountCode
    +String accountName
    +AccountType accountType
    +NormalBalance normalBalance
    +String parentAccountCode
    +Boolean isActive
  }

  class Merchant {
    +UUID id
    +UUID userId
    +UUID walletId
    +String businessName
    +String businessRegistrationNumber
    +String businessType
    +BigDecimal merchantFeePercentage
    +SettlementFrequency settlementFrequency
    +Boolean isActive
    +Boolean isVerified
  }

  class IdempotencyCache {
    +UUID idempotencyKey
    +String responseData
    +UUID transactionId
    +LocalDateTime expiresAt
  }

  class FraudRule {
    +UUID id
    +String ruleName
    +RuleType ruleType
    +String parameters
    +Integer riskScorePenalty
    +FraudAction action
    +Boolean isActive
  }

  %% Associations
  User "1" -- "1" UserPreference : has
  User "1" o-- "*" UserContact : owns
  UserContact "*" --> "1" User : contactUser
  User "1" o-- "*" KycDocument : uploads
  User "1" o-- "*" DailyUsage : dailyRecords

  Wallet "1" -- "0..*" Transaction : participatesIn
  Transaction "1" -- "0..*" LedgerEntry : creates
  LedgerEntry "*" -- "1" ChartOfAccounts : postsTo
  Wallet "1" o-- "1" ChartOfAccounts : mapsTo
  Merchant "1" -- "1" Wallet : uses
  Merchant "1" .. "1" User : owner
  IdempotencyCache "1" -- "0..1" Transaction : mayReference
  FraudRule "0..*" .. "0..*" Transaction : appliedTo

``` 
