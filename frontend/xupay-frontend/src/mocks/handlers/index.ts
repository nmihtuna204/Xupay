import { fraudHandlers } from "./fraud";
import { complianceHandlers } from "./compliance";
import { analyticsHandlers } from "./analytics";
import { auditHandlers } from "./audit-log";

/**
 * Handlers for the four showcase domains only. These have NO real backend —
 * fraud/compliance/analytics/audit-log are always mock-served, in every
 * environment (dev, prod, tests). The real-API domains (auth/wallets/
 * payments/kyc/contacts) are never intercepted here.
 */
export const handlers = [
  ...fraudHandlers,
  ...complianceHandlers,
  ...analyticsHandlers,
  ...auditHandlers,
];
