import { NavLink, Outlet } from "react-router-dom";
import { ChevronDown, Instagram, Settings } from "lucide-react";

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

const tabs = [
  { label: "Automations", to: "/dashboard/auto-dm/automations" },
  { label: "Contacts", to: "/dashboard/auto-dm/contacts" },
  { label: "Products", to: "/dashboard/auto-dm/products" },
  { label: "Orders", to: "/dashboard/auto-dm/orders" },
  { label: "Settings", to: "/dashboard/auto-dm/settings" },
];

export default function AutoDMModuleLayout() {
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
    <div className="min-h-full px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--arc)]">
                GAP Social Pilot
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Auto DM</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Instagram automation, lead capture, and CRM inside your Social Pilot workspace.
              </p>
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

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {!configured ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-900 shadow-sm">
            <p className="text-base font-semibold">Auto DM is not configured yet.</p>
            <p className="mt-2">
              Add `VITE_AUTODM_SUPABASE_URL` and `VITE_AUTODM_SUPABASE_ANON_KEY` to the Social
              Pilot client env, then restart the dev server.
            </p>
          </div>
        ) : statusLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading Auto DM workspace...
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
