import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import {
  disconnectInstagramAccount,
  getAutoDMStatus,
  importInstagramAccountFromSocial,
  listInstagramAccountsForUser,
} from "@/services/autodm/accounts";
import { isAutoDMConfigured } from "@/services/autodm/supabaseClient";

const AutoDMContext = createContext(null);

export function AutoDMProvider({ children }) {
  const { user, connectedAccounts } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [hasSocialInstagramConnection, setHasSocialInstagramConnection] = useState(false);
  const [socialInstagram, setSocialInstagram] = useState(null);
  const [syncingAccount, setSyncingAccount] = useState(false);
  const configured = isAutoDMConfigured();

  const activeAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId) || accounts[0] || null,
    [accounts, activeAccountId]
  );

  const refreshStatus = async ({ silent = false } = {}) => {
    if (!user?.userId) {
      setAccounts([]);
      setStatusLoading(false);
      return;
    }

    if (!configured) {
      setAccounts([]);
      setHasSocialInstagramConnection(Boolean(connectedAccounts?.instagram?.connected));
      setSocialInstagram(null);
      setStatusLoading(false);
      return;
    }

    if (!silent) setStatusLoading(true);
    try {
      const status = await getAutoDMStatus();
      setAccounts(status.autodmAccounts || []);
      setHasSocialInstagramConnection(Boolean(status.hasSocialInstagramConnection));
      setSocialInstagram(status.socialInstagram || null);
      setActiveAccountId((current) => current || status.autodmAccounts?.[0]?.id || null);
    } catch (error) {
      console.error("[AutoDM] Failed to refresh status:", error);
      if (!silent) {
        toast.error(error.message || "Failed to load Auto DM status");
      }
    } finally {
      if (!silent) setStatusLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [user?.userId]);

  const syncSocialInstagram = async () => {
    setSyncingAccount(true);
    try {
      const account = await importInstagramAccountFromSocial();
      toast.success("Instagram account synced into Auto DM");
      await refreshStatus({ silent: true });
      setActiveAccountId(account?.id || null);
      return account;
    } catch (error) {
      toast.error(error.message || "Failed to sync Instagram account");
      throw error;
    } finally {
      setSyncingAccount(false);
    }
  };

  const refreshAccountsFromSupabase = async () => {
    if (!user?.userId) return [];
    const data = await listInstagramAccountsForUser(user.userId);
    setAccounts(data);
    setActiveAccountId((current) => current || data[0]?.id || null);
    return data;
  };

  const disconnectAccount = async (accountId) => {
    if (!user?.userId) return;
    await disconnectInstagramAccount(accountId, user.userId);
    await refreshAccountsFromSupabase();
  };

  const value = useMemo(
    () => ({
      socialUser: user,
      socialConnectedAccounts: connectedAccounts,
      accounts,
      activeAccount,
      activeAccountId,
      setActiveAccountId,
      statusLoading,
      hasSocialInstagramConnection,
      socialInstagram,
      syncingAccount,
      configured,
      refreshStatus,
      refreshAccountsFromSupabase,
      syncSocialInstagram,
      disconnectAccount,
    }),
    [
      user,
      connectedAccounts,
      accounts,
      activeAccount,
      activeAccountId,
      statusLoading,
      hasSocialInstagramConnection,
      socialInstagram,
      syncingAccount,
      configured,
    ]
  );

  return <AutoDMContext.Provider value={value}>{children}</AutoDMContext.Provider>;
}

export function useAutoDM() {
  const context = useContext(AutoDMContext);
  if (!context) {
    throw new Error("useAutoDM must be used within AutoDMProvider");
  }
  return context;
}
