import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/apiClient';
import { useAuth } from './AuthContext';
import { startAutoDMInstagramOAuth } from '../services/autodm/supabaseClient';

const AutoDMContext = createContext(null);

export function AutoDMProvider({ children }) {
  const { connectedAccounts } = useAuth();
  const [status, setStatus] = useState(null); // { autodmAccounts, hasSocialInstagramConnection, socialInstagram }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const loadedRef = useRef(false);
  const autoSyncAttemptedRef = useRef(false);
  const hasPostingInstagram = Boolean(connectedAccounts?.instagram?.connected);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/autodm/status');
      let data = res.data;
      let accounts = data.autodmAccounts || [];
      const socialReady = Boolean(data.hasSocialInstagramConnection || hasPostingInstagram);
      data = {
        ...data,
        hasSocialInstagramConnection: socialReady,
        socialInstagram: data.socialInstagram || connectedAccounts?.instagram || null,
      };
      if (data.autoDMStorageError) {
        setError(data.autoDMStorageError);
      }

      if (
        accounts.length === 0 &&
        socialReady &&
        data.autoDMStorageReady === true &&
        !autoSyncAttemptedRef.current
      ) {
        autoSyncAttemptedRef.current = true;
        try {
          await apiClient.post('/api/autodm/import-instagram');
          const refreshed = await apiClient.get('/api/autodm/status');
          data = refreshed.data;
          accounts = data.autodmAccounts || [];
          data = {
            ...data,
            hasSocialInstagramConnection: Boolean(data.hasSocialInstagramConnection || hasPostingInstagram),
            socialInstagram: data.socialInstagram || connectedAccounts?.instagram || null,
          };
        } catch (syncError) {
          console.warn('[AutoDM] Instagram auto-sync failed:', syncError);
          setError(syncError.response?.data?.error || syncError.message || 'Failed to sync Instagram into AutoDM');
        }
      }

      setStatus(data);
      setActiveAccount((prev) => {
        if (prev) {
          const still = accounts.find((a) => a.id === prev.id);
          return still || accounts[0] || null;
        }
        return accounts[0] || null;
      });
    } catch (err) {
      console.error('[AutoDM] Status load error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load AutoDM status');
    } finally {
      setLoading(false);
    }
  }, [connectedAccounts?.instagram, hasPostingInstagram]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadStatus();
    }
  }, [loadStatus]);

  useEffect(() => {
    if (loadedRef.current && hasPostingInstagram && !autoSyncAttemptedRef.current) {
      loadStatus();
    }
  }, [hasPostingInstagram, loadStatus]);

  const importInstagram = useCallback(async (instagramAccountId) => {
    if (status?.autoDMStorageReady === false) {
      throw new Error(status.autoDMStorageError || 'AutoDM storage is not ready.');
    }
    const payload = instagramAccountId ? { instagramAccountId } : {};
    const res = await apiClient.post('/api/autodm/import-instagram', payload);
    await loadStatus();
    return res.data.account;
  }, [loadStatus, status?.autoDMStorageError, status?.autoDMStorageReady]);

  const startOAuth = useCallback(async () => {
    return startAutoDMInstagramOAuth(window.location.origin);
  }, []);

  const loadAutomations = useCallback(async (skipLoading = false) => {
    if (!activeAccount?.id) {
      setAutomations([]);
      if (!skipLoading) setAutomationsLoading(false);
      return;
    }

    try {
      if (!skipLoading) setAutomationsLoading(true);
      const res = await apiClient.get('/api/autodm/automations', {
        params: { instagramAccountId: activeAccount.id },
      });
      setAutomations(res.data.automations || []);
    } catch (err) {
      console.error('[AutoDM] Automations load error:', err);
    } finally {
      if (!skipLoading) setAutomationsLoading(false);
    }
  }, [activeAccount?.id]);

  const loadContacts = useCallback(async () => {
    if (!activeAccount?.id) {
      setContactsLoading(false);
      return;
    }
    try {
      setContactsLoading(true);
      const res = await apiClient.get('/api/autodm/contacts', {
        params: { instagramAccountId: activeAccount.id },
      });
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('[AutoDM] Contacts load error:', err);
    } finally {
      setContactsLoading(false);
    }
  }, [activeAccount?.id]);

  const createAutomation = useCallback(async (payload) => {
    const res = await apiClient.post('/api/autodm/automations', payload);
    return res.data.automation;
  }, []);

  const updateAutomation = useCallback(async (id, payload) => {
    const res = await apiClient.patch(`/api/autodm/automations/${id}`, payload);
    return res.data.automation;
  }, []);

  const deleteAutomation = useCallback(async (id) => {
    await apiClient.delete(`/api/autodm/automations/${id}`);
  }, []);

  const getAutomation = useCallback(async (id) => {
    const res = await apiClient.get(`/api/autodm/automations/${id}`);
    return res.data.automation;
  }, []);

  const fetchAnalytics = useCallback(async (automationId) => {
    const res = await apiClient.get(`/api/autodm/automations/${automationId}/analytics`);
    return res.data.analytics;
  }, []);

  const syncInsights = useCallback(async (automationId) => {
    const res = await apiClient.post(`/api/autodm/automations/${automationId}/sync-insights`);
    return res.data.automation;
  }, []);

  const fetchMessagesForContact = useCallback(async (contactId) => {
    const res = await apiClient.get(`/api/autodm/contacts/${contactId}/messages`);
    return res.data.messages || [];
  }, []);

  const fetchDailyMetrics = useCallback(async (days = 7) => {
    if (!activeAccount?.id) return [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const res = await apiClient.get('/api/autodm/daily-metrics', {
      params: {
        instagramAccountId: activeAccount.id,
        startDate: startDate.toISOString().split('T')[0],
      },
    });
    return res.data.metrics || [];
  }, [activeAccount?.id]);

  const fetchInstagramMedia = useCallback(async (limit = 30) => {
    const instagramAccountId = activeAccount?.id || activeAccount?.instagram_business_account_id || activeAccount?.page_id || activeAccount?.instagram_user_id;
    const res = await apiClient.get('/api/autodm/instagram-media', { 
      params: { limit, ...(instagramAccountId ? { instagramAccountId } : {}) } 
    });
    if (res.data.account) {
      setStatus((prev) => {
        const previousAccounts = prev?.autodmAccounts || [];
        const nextAccounts = previousAccounts.some((account) => account.id === res.data.account.id)
          ? previousAccounts.map((account) => (account.id === res.data.account.id ? res.data.account : account))
          : [res.data.account, ...previousAccounts];

        return {
          ...(prev || {}),
          autodmAccounts: nextAccounts,
        };
      });
      setActiveAccount(res.data.account);
    }
    const media = res.data.media || [];
    media.warning = res.data.warning || null;
    return media;
  }, [activeAccount?.id, activeAccount?.instagram_business_account_id, activeAccount?.page_id, activeAccount?.instagram_user_id]);

  const autodmAccounts = status?.autodmAccounts || [];
  const hasSocialInstagramConnection = status?.hasSocialInstagramConnection || false;
  const socialInstagram = status?.socialInstagram || null;
  const autoDMStorageReady = status?.autoDMStorageReady !== false;
  const autoDMStorageError = status?.autoDMStorageError || null;

  return (
    <AutoDMContext.Provider
      value={{
        // State
        loading,
        error,
        autodmAccounts,
        activeAccount,
        setActiveAccount,
        hasSocialInstagramConnection,
        socialInstagram,
        autoDMStorageReady,
        autoDMStorageError,
        automations,
        setAutomations,
        automationsLoading,
        contacts,
        setContacts,
        contactsLoading,
        // Actions
        loadStatus,
        importInstagram,
        startOAuth,
        loadAutomations,
        loadContacts,
        createAutomation,
        updateAutomation,
        deleteAutomation,
        getAutomation,
        fetchAnalytics,
        syncInsights,
        fetchMessagesForContact,
        fetchDailyMetrics,
        fetchInstagramMedia,
      }}
    >
      {children}
    </AutoDMContext.Provider>
  );
}

export function useAutoDM() {
  const ctx = useContext(AutoDMContext);
  if (!ctx) throw new Error('useAutoDM must be used within AutoDMProvider');
  return ctx;
}
