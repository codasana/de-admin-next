import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { 
  ShadowingLessonsResponse, 
  ShadowingLessonResponse, 
  ShadowingLesson,
  ShadowingLessonSummary,
  PaginationInfo,
  UpdateShadowingLessonPayload,
  QueueLessonPayload,
  QueueLessonResponse,
  ProcessLessonResponse
} from '@/types/shadowing';

interface FetchLessonsParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'queue' | 'published';
  category?: 'start_here' | 'more_videos';
  search?: string;
}

// Fetch paginated shadowing lessons for admin
export function useAdminShadowingLessons(params: FetchLessonsParams = {}) {
  const { page = 1, limit = 20, status, category, search } = params;
  
  return useQuery({
    queryKey: ['admin', 'shadowing', 'lessons', { page, limit, status, category, search }],
    queryFn: async (): Promise<{ lessons: ShadowingLessonSummary[]; pagination: PaginationInfo }> => {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());
      if (status) queryParams.set('status', status);
      if (category) queryParams.set('category', category);
      if (search) queryParams.set('search', search);
      
      const response = await api.get<ShadowingLessonsResponse>(
        `/api/shadowing/admin/lessons?${queryParams.toString()}`
      );
      
      if (response.data.success) {
        return {
          lessons: response.data.lessons,
          pagination: response.data.pagination
        };
      }
      throw new Error('Failed to load lessons');
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch a single shadowing lesson by ID for admin
export function useAdminShadowingLesson(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'shadowing', 'lesson', id],
    queryFn: async (): Promise<ShadowingLesson> => {
      const response = await api.get<ShadowingLessonResponse>(
        `/api/shadowing/admin/lesson/${id}`
      );
      
      if (response.data.success && response.data.lesson) {
        return response.data.lesson;
      }
      throw new Error('Lesson not found');
    },
    enabled: id !== null,
    staleTime: 30 * 1000,
  });
}

// Update a shadowing lesson
export function useUpdateShadowingLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateShadowingLessonPayload }) => {
      const response = await api.put<ShadowingLessonResponse>(
        `/api/shadowing/admin/lesson/${id}`,
        data
      );
      
      if (response.data.success) {
        return response.data.lesson;
      }
      throw new Error('Failed to update lesson');
    },
    onSuccess: (updatedLesson) => {
      // Invalidate the lessons list query
      queryClient.invalidateQueries({ queryKey: ['admin', 'shadowing', 'lessons'] });
      // Update the single lesson cache
      queryClient.setQueryData(['admin', 'shadowing', 'lesson', updatedLesson.id], updatedLesson);
    },
  });
}

// Queue a new lesson (quick create with just metadata)
export function useQueueLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: QueueLessonPayload) => {
      try {
        const response = await api.post<QueueLessonResponse>(
          '/api/shadowing/admin/queue-lesson',
          data
        );
        
        if (response.data.success) {
          return response.data;
        }
        throw new Error('Failed to queue lesson');
      } catch (error: unknown) {
        // Extract error message from API response
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string } } };
          if (axiosError.response?.data?.error) {
            throw new Error(axiosError.response.data.error);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the lessons list query to show the new queued lesson
      queryClient.invalidateQueries({ queryKey: ['admin', 'shadowing', 'lessons'] });
    },
  });
}

// Process a queued lesson (run full transcription)
export function useProcessLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await api.post<ProcessLessonResponse>(
        `/api/shadowing-transcription/process/${lessonId}`
      );
      
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to start processing');
    },
    onSuccess: () => {
      // Invalidate to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin', 'shadowing', 'lessons'] });
    },
  });
}
