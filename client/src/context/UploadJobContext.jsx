/**
 * UploadJobContext.jsx — Fixed version
 * ─────────────────────────────────────────────────────────────────
 * Fixes:
 * 1. dismissJob properly cleans up polling AND completion callbacks
 * 2. retryJob resets state before polling
 * 3. No orphaned intervals — cleanup on unmount is exhaustive
 * 4. Visibility handler uses functional setState to avoid stale closure
 * 5. addJob returns the jobId for external use
 *
 * Replace: client/src/context/UploadJobContext.jsx
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import apiClient from '../utils/apiClient';

/**
 * @typedef {Object} UploadJob
 * @property {string}   id
 * @property {'pending'|'processing'|'completed'|'failed'} status
 * @property {number}   progress   — 0–100
 * @property {string}   step       — Human-readable step label
 * @property {string|null} error
 * @property {Object}  meta       — caption, channels, mediaType, fileCount, previewUrl
 * @property {number}  createdAt
 * @property {number}  updatedAt
 */

const UploadJobContext = createContext(null);

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ERRORS  = 5; // stop polling after 5 consecutive network errors

export function UploadJobProvider({ children }) {
  const [jobs, setJobs] = useState([]);

  /**
   * Maps jobId → { intervalId, errorCount }
   * Using a plain ref (not state) to avoid re-render cycles.
   */
  const pollersRef = useRef(new Map());
  const callbacksRef = useRef(new Map()); // jobId → onComplete fn

  /* ─────────────────────────────────────────────────────────────
     POLLING CORE
  ───────────────────────────────────────────────────────────── */

  const stopPolling = useCallback((jobId) => {
    const poller = pollersRef.current.get(jobId);
    if (poller) {
      clearInterval(poller.intervalId);
      pollersRef.current.delete(jobId);
    }
  }, []);

  const fetchJobStatus = useCallback(
    async (jobId) => {
      try {
        const { data } = await apiClient.get(`/api/jobs/${jobId}`);
        if (!data?.success || !data?.job) return;

        const serverJob = data.job;

        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, ...serverJob, updatedAt: Date.now() }
              : j
          )
        );

        // Terminal state — stop polling and fire callback
        if (
          serverJob.status === 'completed' ||
          serverJob.status === 'failed'
        ) {
          stopPolling(jobId);

          const cb = callbacksRef.current.get(jobId);
          if (cb) {
            try { cb(serverJob); } catch (_) {}
            callbacksRef.current.delete(jobId);
          }
        } else {
          // Reset error count on success
          const poller = pollersRef.current.get(jobId);
          if (poller) poller.errorCount = 0;
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;

        const poller = pollersRef.current.get(jobId);
        if (!poller) return;

        poller.errorCount = (poller.errorCount || 0) + 1;
        if (poller.errorCount >= MAX_POLL_ERRORS) {
          console.warn(`[UploadJobContext] Stopping poll for ${jobId} after ${MAX_POLL_ERRORS} errors`);
          stopPolling(jobId);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId && j.status !== 'completed'
                ? { ...j, status: 'failed', error: 'Lost connection. Please check status manually.', updatedAt: Date.now() }
                : j
            )
          );
        }
      }
    },
    [stopPolling]
  );

  const startPolling = useCallback(
    (jobId) => {
      if (pollersRef.current.has(jobId)) return; // already polling

      // Immediate first fetch
      fetchJobStatus(jobId);

      const intervalId = setInterval(() => fetchJobStatus(jobId), POLL_INTERVAL_MS);
      pollersRef.current.set(jobId, { intervalId, errorCount: 0 });
    },
    [fetchJobStatus]
  );

  /* ─────────────────────────────────────────────────────────────
     CLEANUP ON UNMOUNT
  ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    return () => {
      for (const { intervalId } of pollersRef.current.values()) {
        clearInterval(intervalId);
      }
      pollersRef.current.clear();
      callbacksRef.current.clear();
    };
  }, []);

  /* ─────────────────────────────────────────────────────────────
     VISIBILITY HANDLER — resume polling when tab becomes visible
  ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;

      // Use functional setState to get current jobs without stale closure
      setJobs((currentJobs) => {
        for (const job of currentJobs) {
          if (job.status === 'pending' || job.status === 'processing') {
            // Kick off a single status check (don't restart interval if already running)
            fetchJobStatus(job.id);
          }
        }
        return currentJobs; // return same reference — no re-render
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchJobStatus]);

  /* ─────────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────────── */

  /**
   * Register a new upload job returned by the server.
   * @param {string}   jobId
   * @param {Object}   meta      — caption, channels, mediaType, fileCount, previewUrl
   * @param {Function} [onComplete]
   * @returns {string} jobId
   */
  const addJob = useCallback(
    (jobId, meta = {}, onComplete = null) => {
      const newJob = {
        id: jobId,
        status: 'pending',
        progress: 0,
        step: 'Queued',
        error: null,
        meta,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setJobs((prev) => [newJob, ...prev]);

      if (onComplete) {
        callbacksRef.current.set(jobId, onComplete);
      }

      startPolling(jobId);
      return jobId;
    },
    [startPolling]
  );

  /**
   * Retry a failed job — resets state and restarts polling.
   */
  const retryJob = useCallback(
    (jobId) => {
      stopPolling(jobId); // clean up any stale poller first

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'processing',
                progress: 0,
                step: 'Retrying…',
                error: null,
                updatedAt: Date.now(),
              }
            : j
        )
      );

      startPolling(jobId);
    },
    [startPolling, stopPolling]
  );

  /**
   * Remove completed/failed jobs from the panel.
   */
  const clearCompleted = useCallback(() => {
    setJobs((prev) =>
      prev.filter((j) => {
        const isDone =
          j.status === 'completed' || j.status === 'failed';
        if (isDone) {
          stopPolling(j.id);
          callbacksRef.current.delete(j.id);
        }
        return !isDone;
      })
    );
  }, [stopPolling]);

  /**
   * Remove a single job — stops polling and cleans up callbacks.
   */
  const dismissJob = useCallback(
    (jobId) => {
      stopPolling(jobId);
      callbacksRef.current.delete(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    },
    [stopPolling]
  );

  /* ─────────────────────────────────────────────────────────────
     DERIVED VALUES
  ───────────────────────────────────────────────────────────── */

  const activeCount = useMemo(
    () =>
      jobs.filter(
        (j) => j.status === 'pending' || j.status === 'processing'
      ).length,
    [jobs]
  );

  const contextValue = useMemo(
    () => ({
      jobs,
      addJob,
      retryJob,
      clearCompleted,
      dismissJob,
      activeCount,
    }),
    [jobs, addJob, retryJob, clearCompleted, dismissJob, activeCount]
  );

  return (
    <UploadJobContext.Provider value={contextValue}>
      {children}
    </UploadJobContext.Provider>
  );
}

/**
 * Hook to consume the upload job context.
 */
export function useUploadJobs() {
  const ctx = useContext(UploadJobContext);
  if (!ctx) {
    throw new Error('useUploadJobs must be used inside <UploadJobProvider>');
  }
  return ctx;
}

export default UploadJobContext;
