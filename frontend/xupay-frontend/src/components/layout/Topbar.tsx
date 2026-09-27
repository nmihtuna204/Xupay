"use client";

import { Gear, SignOut, User as UserIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./MobileNav";
import { mainNavigation, userMenuItems, isNavItemActive } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";

/** Every route with a name: the sidebar's items plus the user-menu ones (Settings). */
const NAMED_ROUTES = [...mainNavigation.flatMap((group) => group.items), ...userMenuItems];

function useCurrentSection(): string {
  const pathname = usePathname();
  return NAMED_ROUTES.find((item) => isNavItemActive(item, pathname))?.label ?? "";
}

export function Topbar() {
  const { user, logout } = useAuth();
  const section = useCurrentSection();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "??";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        {/* Breadcrumb: brand · current section. */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground sm:inline">XuPay</span>
          {section && (
            <>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="font-medium">{section}</span>
            </>
          )}
        </nav>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Avatar className="size-8">
            <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-medium">
              {user ? `${user.firstName} ${user.lastName}` : "Loading…"}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserIcon weight="light" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Gear weight="light" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
            <SignOut weight="light" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
