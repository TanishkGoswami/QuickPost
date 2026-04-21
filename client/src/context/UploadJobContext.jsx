import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import apiClient from '../utils/apiClient';

/**
 * @typedef {Object} UploadJob
 * @property {string} id
 * @property {'pending'|'processing'|'completed'|'failed'} status
 * @property {number} progress   0–100
 * @property {string} step       Human-readable step label
 * @property {string|null} error
 * @property {Object} meta       caption, channels, mediaType, fileCount, previewUrl
 * @property {number} createdAt
 * @property {number} updatedAt
 */

const UploadJobContext = createContext(null);

const POLL_INTERVAL_MS = 1500;

export function UploadJobProvider({ children }) {
  /** @type {[UploadJob[], Function]} */
  const [jobs, setJobs] = useState([]);
  // Set of jobIds we are currently polling
  const activePollers = useRef(new Map()); // jobId → intervalId
  // Callback registry: jobId → fn called on completion
  const completionCallbacks = useRef(new Map());

  // ── Polling logic ──────────────────────────────────────────────────────

  const stopPolling = useCallback((jobId) => {
    const intervalId = activePollers.current.get(jobId);
    if (intervalId) {
      clearInterval(intervalId);
      activePollers.current.delete(jobId);
    }
  }, []);

  const fetchJobStatus = useCallback(async (jobId) => {
    try {
      const { data } = await apiClient.get(`/api/jobs/${jobId}`);
      if (!data.success) return;

      const serverJob = data.job;

      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, ...serverJob } : j)
      );

      // Stop polling if terminal
      if (serverJob.status === 'completed' || serverJob.status === 'failed') {
        stopPolling(jobId);

        // Fire completion callback (e.g. dashboard refresh)
        const cb = completionCallbacks.current.get(jobId);
        if (cb) {
          cb(serverJob);
          completionCallbacks.current.delete(jobId);
        }
      }
    } catch (err) {
      // Silently ignore network errors during polling; just keep trying
      console.warn(`[UploadJobContext] Poll error for job ${jobId}:`, err.message);
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId) => {
    if (activePollers.current.has(jobId)) return; // already polling
    fetchJobStatus(jobId); // immediate first fetch
    const id = setInterval(() => fetchJobStatus(jobId), POLL_INTERVAL_MS);
    activePollers.current.set(jobId, id);
  }, [fetchJobStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const id of activePollers.current.values()) clearInterval(id);
    };
  }, []);

  // Resume polling for active jobs when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Re-fetch all jobs that were still active before tab was hidden
        setJobs(currentJobs => {
          currentJobs.forEach(job => {
            if (job.status === 'pending' || job.status === 'processing') {
              fetchJobStatus(job.id);
            }
          });
          return currentJobs;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchJobStatus]);

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Register a new upload job returned by the server.
   * @param {string} jobId
   * @param {Object} meta  caption, channels, mediaType, fileCount
   * @param {Function} [onComplete]  Optional callback when job completes/fails
   */
  const addJob = useCallback((jobId, meta = {}, onComplete = null) => {
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

    setJobs(prev => [newJob, ...prev]);

    if (onComplete) {
      completionCallbacks.current.set(jobId, onComplete);
    }

    startPolling(jobId);
  }, [startPolling]);

  /**
   * Retry a failed job by re-starting polling.
   * (The backend job state won't reset, but for network issues polling may resume.)
   * Full retry requires re-submitting the form — this just polls again.
   */
  const retryJob = useCallback((jobId) => {
    setJobs(prev =>
      prev.map(j => j.id === jobId ? { ...j, status: 'processing', progress: 0, step: 'Retrying…' } : j)
    );
    startPolling(jobId);
  }, [startPolling]);

  /** Remove completed/failed jobs from the panel */
  const clearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status !== 'completed' && j.status !== 'failed'));
  }, []);

  /** Remove a single job from the panel */
  const dismissJob = useCallback((jobId) => {
    stopPolling(jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }, [stopPolling]);

  const activeCount = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length;

  return (
    <UploadJobContext.Provider value={{ jobs, addJob, retryJob, clearCompleted, dismissJob, activeCount }}>
      {children}
    </UploadJobContext.Provider>
  );
}

/**
 * Hook to consume the upload job context.
 * @returns {{ jobs: UploadJob[], addJob: Function, retryJob: Function, clearCompleted: Function, dismissJob: Function, activeCount: number }}
 */
export function useUploadJobs() {
  const ctx = useContext(UploadJobContext);
  if (!ctx) throw new Error('useUploadJobs must be used inside <UploadJobProvider>');
  return ctx;
}

export default UploadJobContext;
