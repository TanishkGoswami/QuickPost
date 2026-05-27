import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/apiClient';

const AutoDMContext = createContext(null);

export function AutoDMProvider({ children }) {
  const [status, setStatus] = useState(null); // { autodmAccounts, hasSocialInstagramConnection, socialInstagram }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const loadedRef = useRef(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/autodm/status');
      const data = res.data;
      setStatus(data);
      const accounts = data.autodmAccounts || [];
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
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadStatus();
    }
  }, [loadStatus]);

  const importInstagram = useCallback(async () => {
    const res = await apiClient.post('/api/autodm/import-instagram');
    await loadStatus();
    return res.data.account;
  }, [loadStatus]);

  const startOAuth = useCallback(async () => {
    const res = await apiClient.post('/api/autodm/oauth-start', {
      frontendUrl: window.location.origin,
    });
    return res.data.redirectTo;
  }, []);

  const loadAutomations = useCallback(async () => {
    if (!activeAccount?.id) return;
    try {
      setAutomationsLoading(true);
      const res = await apiClient.get('/api/autodm/automations', {
        params: { instagramAccountId: activeAccount.id },
      });
      setAutomations(res.data.automations || []);
    } catch (err) {
      console.error('[AutoDM] Automations load error:', err);
    } finally {
      setAutomationsLoading(false);
    }
  }, [activeAccount?.id]);

  const loadContacts = useCallback(async () => {
    if (!activeAccount?.id) return;
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
    const res = await apiClient.get('/api/autodm/instagram-media', { params: { limit } });
    return res.data.media || [];
  }, []);

  const autodmAccounts = status?.autodmAccounts || [];
  const hasSocialInstagramConnection = status?.hasSocialInstagramConnection || false;
  const socialInstagram = status?.socialInstagram || null;

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
