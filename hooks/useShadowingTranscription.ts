import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import type { 
  ShadowingTranscriptionJob,
  ShadowingTranscriptionJobResponse,
  CreateShadowingTranscriptionPayload 
} from '@/types/shadowing';

/**
 * Extract error message from axios error or generic error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    // Backend returns { error: "message" } for errors
    return error.response.data.error || error.response.data.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Hook to create and poll a shadowing transcription job
 * 
 * How it works:
 * 1. User calls createJob({ url }) with a YouTube URL
 * 2. This POSTs to /api/shadowing-transcription which creates a job and returns immediately
 * 3. The hook starts polling GET /api/shadowing-transcription/:id every 2 seconds
 * 4. Each poll updates the job state (status, progress, etc.)
 * 5. Polling stops when status is 'completed' or 'failed'
 * 6. On completion, invalidates the lessons query to refresh the list
 */
export function useShadowingTranscription() {
  const queryClient = useQueryClient();
  
  const [job, setJob] = useState<ShadowingTranscriptionJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      // Note: api instance already has Authorization header set from login
      const response = await api.get<ShadowingTranscriptionJobResponse>(
        `/api/shadowing-transcription/${jobId}`
      );
      
      if (response.data.success) {
        setJob(response.data.job);
        return response.data.job;
      }
      throw new Error('Failed to fetch job status');
    } catch (error) {
      const message = getErrorMessage(error);
      setPollingError(message);
      throw error;
    }
  }, []);

  // Start polling when we have a job
  useEffect(() => {
    if (!job || !isPolling) return;

    // Stop polling if job is completed or failed
    if (job.status === 'completed' || job.status === 'failed') {
      setIsPolling(false);
      
      // Invalidate the lessons list to show the new lesson
      if (job.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['admin', 'shadowing', 'lessons'] });
      }
      return;
    }

    // Poll every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        await pollJobStatus(job.id);
      } catch (error) {
        console.error('Polling error:', error);
        setIsPolling(false);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [job, isPolling, pollJobStatus, queryClient]);

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (payload: CreateShadowingTranscriptionPayload) => {
      // Note: api instance already has Authorization header set from login
      const response = await api.post<ShadowingTranscriptionJobResponse>(
        '/api/shadowing-transcription',
        payload
      );
      
      if (response.data.success) {
        return response.data.job;
      }
      
      throw new Error(response.data.message || 'Failed to create job');
    },
    onSuccess: (createdJob) => {
      setJob(createdJob);
      setIsPolling(true);
      setPollingError(null);
    },
    onError: (error) => {
      setPollingError(getErrorMessage(error));
    }
  });

  // Reset state
  const reset = useCallback(() => {
    setJob(null);
    setIsPolling(false);
    setPollingError(null);
    createJobMutation.reset();
  }, [createJobMutation]);

  return {
    // Job state
    job,
    isPolling,
    
    // Mutation state
    isCreating: createJobMutation.isPending,
    createError: createJobMutation.error ? getErrorMessage(createJobMutation.error) : pollingError,
    
    // Actions
    createJob: createJobMutation.mutate,
    reset,
    
    // Computed states
    isProcessing: isPolling && job?.status !== 'completed' && job?.status !== 'failed',
    isComplete: job?.status === 'completed',
    isFailed: job?.status === 'failed',
  };
}

/**
 * Hook to poll a processing job by ID
 * Used when processing a queued lesson
 */
export function useProcessingJob(jobId: string | null) {
  const queryClient = useQueryClient();
  
  const [job, setJob] = useState<ShadowingTranscriptionJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start polling when jobId is provided
  const startPolling = useCallback((initialJob?: ShadowingTranscriptionJob) => {
    if (initialJob) {
      setJob(initialJob);
    }
    setIsPolling(true);
    setError(null);
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setJob(null);
    setIsPolling(false);
    setError(null);
  }, []);

  // Poll for job status
  useEffect(() => {
    if (!jobId || !isPolling) return;

    // Stop polling if job is completed or failed
    if (job?.status === 'completed' || job?.status === 'failed') {
      setIsPolling(false);
      
      // Invalidate the lessons list to refresh
      queryClient.invalidateQueries({ queryKey: ['admin', 'shadowing', 'lessons'] });
      return;
    }

    const pollJobStatus = async () => {
      try {
        const response = await api.get<ShadowingTranscriptionJobResponse>(
          `/api/shadowing-transcription/${jobId}`
        );
        
        if (response.data.success) {
          setJob(response.data.job);
        }
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        setIsPolling(false);
      }
    };

    // Initial poll
    pollJobStatus();

    // Poll every 2 seconds
    const pollInterval = setInterval(pollJobStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling, job?.status, queryClient]);

  return {
    job,
    isPolling,
    error,
    startPolling,
    stopPolling,
    reset,
    isProcessing: isPolling && job?.status !== 'completed' && job?.status !== 'failed',
    isComplete: job?.status === 'completed',
    isFailed: job?.status === 'failed',
  };
}
