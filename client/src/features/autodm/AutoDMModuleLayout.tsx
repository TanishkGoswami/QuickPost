import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Instagram,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutoDM } from "./AutoDMContext";

const navItems = [
  { label: "Automations", to: "/dashboard/auto-dm/automations", icon: Workflow },
  { label: "Create Flow", to: "/dashboard/auto-dm/automations/new", icon: BarChart3 },
  { label: "Contacts", to: "/dashboard/auto-dm/contacts", icon: Users },
  { label: "Products", to: "/dashboard/auto-dm/products", icon: Package },
  { label: "Orders", to: "/dashboard/auto-dm/orders", icon: ShoppingCart },
  { label: "Settings", to: "/dashboard/auto-dm/settings", icon: Settings },
];

function AutoDMSidebar({ onNavigate = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="flex h-full flex-col bg-[var(--canvas-lifted)]">
      <div className="border-b border-black/10 px-5 py-5">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            navigate("/dashboard");
          }}
          className="mb-5 inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-[var(--slate)] shadow-sm transition hover:border-black/20 hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Social Pilot
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--arc)]">Auto DM</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">Instagram CRM</h2>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.to.endsWith("/automations")
              ? location.pathname.startsWith(item.to) && !location.pathname.endsWith("/new")
              : item.to.endsWith("/new")
                ? location.pathname === item.to
                : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--ink)] text-[var(--canvas)] shadow-sm"
                  : "text-[var(--slate)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${active ? "bg-white/10" : "bg-black/[0.05]"}`}>
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="hidden border-t border-black/10 p-4 xl:block">
        <div className="rounded-[18px] border border-black/10 bg-white p-4">
          <p className="text-xs font-semibold text-[var(--ink)]">Instagram only</p>
          <p className="mt-1 text-xs leading-5 text-[var(--slate)]">
            Auto DM flows trigger from Instagram comments, reels, DMs, stories, and new composer posts.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function AutoDMModuleLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    accounts,
    activeAccount,
    setActiveAccountId,
    hasSocialInstagramConnection,
    syncingAccount,
    syncSocialInstagram,
    statusLoading,
    configured,
  } = useAutoDM();

  return (
    <div className="min-h-full bg-[var(--canvas)]">
      <div className="flex min-h-screen">
        <div className="hidden w-[260px] shrink-0 border-r border-black/10 xl:block">
          <AutoDMSidebar />
        </div>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-[80] xl:hidden">
            <button
              type="button"
              aria-label="Close Auto DM menu"
              className="absolute inset-0 bg-black/35 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative h-full w-[82vw] max-w-[320px] shadow-2xl">
              <AutoDMSidebar onNavigate={() => setMobileSidebarOpen(false)} />
              <button
                type="button"
                aria-label="Close Auto DM menu"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-black/10 bg-[var(--canvas)]/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-1 shrink-0 xl:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--arc)]">
                    GAP Social Pilot
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-3xl">Auto DM</h1>
                  <p className="mt-1 max-w-2xl text-sm text-[var(--slate)]">
                    Instagram automation, lead capture, and CRM inside your Social Pilot workspace.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={activeAccount?.profile_picture_url || ""} />
                        <AvatarFallback>
                          {(activeAccount?.username || "IG").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="text-xs text-slate-500">Instagram Account</div>
                        <div className="text-sm font-medium text-slate-900">
                          {activeAccount ? `@${activeAccount.username}` : "Select account"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Auto DM Accounts</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accounts.length === 0 ? (
                    <DropdownMenuItem disabled>No imported Auto DM accounts yet</DropdownMenuItem>
                  ) : (
                    accounts.map((account) => (
                      <DropdownMenuItem key={account.id} onClick={() => setActiveAccountId(account.id)}>
                        <Avatar className="mr-2 h-7 w-7">
                          <AvatarImage src={account.profile_picture_url || ""} />
                          <AvatarFallback>{account.username?.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>@{account.username}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={syncSocialInstagram} disabled={!hasSocialInstagramConnection || syncingAccount}>
                    <Instagram className="mr-2 h-4 w-4" />
                    {syncingAccount ? "Syncing..." : "Sync From Social Pilot"}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard/auto-dm/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Module Settings
                    </NavLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
              {!configured ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-8 text-sm text-amber-900 shadow-sm">
                  <p className="text-base font-semibold">Auto DM is not configured yet.</p>
                  <p className="mt-2">
                    Add `VITE_AUTODM_SUPABASE_URL` and `VITE_AUTODM_SUPABASE_ANON_KEY` to the Social
                    Pilot client env, then restart the dev server.
                  </p>
                </div>
              ) : statusLoading ? (
                <div className="rounded-[24px] border border-black/10 bg-white p-8 text-sm text-[var(--slate)] shadow-sm">
                  Loading Auto DM workspace...
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}
