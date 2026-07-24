import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Users,
  ShieldCheck,
  ShieldAlert,
  FileWarning,
  BarChart3,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

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
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Money",
    items: [
      { label: "Wallets", href: "/wallets", icon: Wallet },
      { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { label: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { label: "KYC Verification", href: "/kyc", icon: ShieldCheck },
      { label: "Fraud Detection", href: "/fraud", icon: ShieldAlert, mock: true },
      { label: "Compliance / SAR", href: "/compliance", icon: FileWarning, mock: true },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, mock: true },
      { label: "Audit Log", href: "/audit", icon: ScrollText, mock: true },
    ],
  },
];

export const userMenuItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(item.href);
}
