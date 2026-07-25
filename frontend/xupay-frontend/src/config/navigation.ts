import type { Icon as LucideIcon } from "@phosphor-icons/react";
import {
  ArrowsLeftRight,
  ChartBar,
  FileX,
  Gear,
  Scroll,
  ShieldCheck,
  ShieldWarning,
  SquaresFour,
  Users,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Not backed by a real backend endpoint — still a full page, just not flagged to the viewer. */
  mock?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const mainNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: SquaresFour }],
  },
  {
    label: "Money",
    items: [
      { label: "Wallets", href: "/wallets", icon: Wallet },
      { label: "Transactions", href: "/transactions", icon: ArrowsLeftRight },
      { label: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { label: "KYC Verification", href: "/kyc", icon: ShieldCheck },
      { label: "Fraud Detection", href: "/fraud", icon: ShieldWarning, mock: true },
      { label: "Compliance / SAR", href: "/compliance", icon: FileX, mock: true },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: ChartBar, mock: true },
      { label: "Audit Log", href: "/audit", icon: Scroll, mock: true },
    ],
  },
];

export const userMenuItems: NavItem[] = [
  { label: "Gear", href: "/settings", icon: Gear },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(item.href);
}
