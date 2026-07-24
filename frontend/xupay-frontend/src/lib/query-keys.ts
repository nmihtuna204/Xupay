/** Central query-key factories — one per domain, so invalidation stays consistent. */

export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
  limits: () => [...profileKeys.all, "limits"] as const,
  dailyUsage: () => [...profileKeys.all, "daily-usage"] as const,
};

export const contactKeys = {
  all: ["contacts"] as const,
  list: () => [...contactKeys.all, "list"] as const,
};

export const kycKeys = {
  all: ["kyc"] as const,
  documents: () => [...kycKeys.all, "documents"] as const,
};

export const walletKeys = {
  all: ["wallets"] as const,
  byUser: (userId: string) => [...walletKeys.all, "user", userId] as const,
  balance: (walletId: string) => [...walletKeys.all, "balance", walletId] as const,
};

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: object) => [...transactionKeys.all, "list", params] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};

export const fraudKeys = {
  all: ["fraud"] as const,
  alerts: (params: object) => [...fraudKeys.all, "alerts", params] as const,
};

export const complianceKeys = {
  all: ["compliance"] as const,
  reports: (params: object) => [...complianceKeys.all, "reports", params] as const,
  report: (id: string) => [...complianceKeys.all, "report", id] as const,
};

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (range: string) => [...analyticsKeys.all, "overview", range] as const,
};

export const auditKeys = {
  all: ["audit-log"] as const,
  list: (params: object) => [...auditKeys.all, "list", params] as const,
};
