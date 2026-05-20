import { NavLink, Outlet } from "react-router-dom";
import { ChevronDown, Instagram, RefreshCw, Settings } from "lucide-react";

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
        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white/90 shadow-sm">
          {/* Instagram-style gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-orange-400 via-pink-500 to-violet-600" />

          <div className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--arc)]">
                  GAP Social Pilot
                </p>
                <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Auto DM</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
                  Instagram automation, lead capture, and CRM inside your Social Pilot workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto justify-between gap-3 rounded-xl border-black/10 bg-white py-2.5 pl-3 pr-3.5 shadow-sm hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 ring-2 ring-pink-100">
                          <AvatarImage src={activeAccount?.profile_picture_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-violet-500 text-xs text-white font-semibold">
                            {(activeAccount?.username || "IG").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Instagram Account
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {activeAccount ? `@${activeAccount.username}` : "Select account"}
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 rounded-xl p-1.5 shadow-lg">
                    <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Auto DM Accounts
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {accounts.length === 0 ? (
                      <DropdownMenuItem disabled className="text-slate-400">
                        No imported Auto DM accounts yet
                      </DropdownMenuItem>
                    ) : (
                      accounts.map((account) => (
                        <DropdownMenuItem
                          key={account.id}
                          onClick={() => setActiveAccountId(account.id)}
                          className="rounded-lg"
                        >
                          <Avatar className="mr-2.5 h-7 w-7 ring-1 ring-black/5">
                            <AvatarImage src={account.profile_picture_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-violet-500 text-xs text-white">
                              {account.username?.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">@{account.username}</span>
                          {activeAccount?.id === account.id && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={syncSocialInstagram}
                      disabled={!hasSocialInstagramConnection || syncingAccount}
                      className="rounded-lg"
                    >
                      {syncingAccount ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-pink-500" />
                      ) : (
                        <Instagram className="mr-2 h-4 w-4 text-pink-500" />
                      )}
                      {syncingAccount ? "Syncing..." : "Sync From Social Pilot"}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
                      <NavLink to="/dashboard/auto-dm/settings">
                        <Settings className="mr-2 h-4 w-4 text-slate-500" />
                        Module Settings
                      </NavLink>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="mt-5 flex gap-px rounded-xl border border-black/8 bg-slate-100 p-1">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    `flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-700"
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
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
