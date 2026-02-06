import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  PronunciationSection,
  PronunciationLesson,
  PronunciationPart,
  SectionsResponse,
  SectionResponse,
  LessonsResponse,
  LessonResponse,
  PartsResponse,
  PartResponse,
  CreateSectionPayload,
  UpdateSectionPayload,
  CreateLessonPayload,
  UpdateLessonPayload,
  CreatePartPayload,
  UpdatePartPayload,
  ReorderSectionsPayload,
  ReorderLessonsPayload,
  ReorderPartsPayload,
  GenerateAudioPayload,
  GenerateAudioResponse,
  SaveAudioPayload,
  SaveAudioResponse,
  UploadResponse,
} from '@/types/pronunciation';

// ============================================
// SECTION HOOKS
// ============================================

// Fetch all sections (admin)
export function useAdminSections() {
  return useQuery({
    queryKey: ['admin', 'pronunciation', 'sections'],
    queryFn: async (): Promise<PronunciationSection[]> => {
      const response = await api.get<SectionsResponse>('/api/pronunciation/admin/sections');
      if (response.data.success) {
        return response.data.sections;
      }
      throw new Error('Failed to load sections');
    },
    staleTime: 30 * 1000,
  });
}

// Fetch a single section (admin)
export function useAdminSection(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'pronunciation', 'section', id],
    queryFn: async (): Promise<PronunciationSection> => {
      const response = await api.get<SectionResponse>(`/api/pronunciation/admin/sections/${id}`);
      if (response.data.success) {
        return response.data.section;
      }
      throw new Error('Section not found');
    },
    enabled: id !== null,
    staleTime: 30 * 1000,
  });
}

// Create a section
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSectionPayload) => {
      const response = await api.post<SectionResponse>('/api/pronunciation/admin/sections', data);
      if (response.data.success) {
        return response.data.section;
      }
      throw new Error('Failed to create section');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
    },
  });
}

// Update a section
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSectionPayload }) => {
      const response = await api.put<SectionResponse>(`/api/pronunciation/admin/sections/${id}`, data);
      if (response.data.success) {
        return response.data.section;
      }
      throw new Error('Failed to update section');
    },
    onSuccess: (updatedSection) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
      queryClient.setQueryData(['admin', 'pronunciation', 'section', updatedSection.id], updatedSection);
    },
  });
}

// Delete a section
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/pronunciation/admin/sections/${id}`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to delete section');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
    },
  });
}

// Reorder sections
export function useReorderSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderSectionsPayload) => {
      const response = await api.put<{ success: boolean; message: string }>('/api/pronunciation/admin/sections-reorder', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to reorder sections');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
    },
  });
}

// ============================================
// LESSON HOOKS
// ============================================

// Fetch all lessons (with optional sectionId filter)
export function useAdminLessons(sectionId?: string) {
  return useQuery({
    queryKey: ['admin', 'pronunciation', 'lessons', { sectionId }],
    queryFn: async (): Promise<PronunciationLesson[]> => {
      const params = sectionId ? `?sectionId=${sectionId}` : '';
      const response = await api.get<LessonsResponse>(`/api/pronunciation/admin/lessons${params}`);
      if (response.data.success) {
        return response.data.lessons;
      }
      throw new Error('Failed to load lessons');
    },
    staleTime: 30 * 1000,
  });
}

// Fetch a single lesson (admin)
export function useAdminLesson(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'pronunciation', 'lesson', id],
    queryFn: async (): Promise<PronunciationLesson> => {
      const response = await api.get<LessonResponse>(`/api/pronunciation/admin/lessons/${id}`);
      if (response.data.success) {
        return response.data.lesson;
      }
      throw new Error('Lesson not found');
    },
    enabled: id !== null,
    staleTime: 30 * 1000,
  });
}

// Create a lesson
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLessonPayload) => {
      const response = await api.post<LessonResponse>('/api/pronunciation/admin/lessons', data);
      if (response.data.success) {
        return response.data.lesson;
      }
      throw new Error('Failed to create lesson');
    },
    onSuccess: (newLesson) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'section', newLesson.sectionId] });
    },
  });
}

// Update a lesson
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLessonPayload }) => {
      const response = await api.put<LessonResponse>(`/api/pronunciation/admin/lessons/${id}`, data);
      if (response.data.success) {
        return response.data.lesson;
      }
      throw new Error('Failed to update lesson');
    },
    onSuccess: (updatedLesson) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
      queryClient.setQueryData(['admin', 'pronunciation', 'lesson', updatedLesson.id], updatedLesson);
    },
  });
}

// Delete a lesson
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/pronunciation/admin/lessons/${id}`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to delete lesson');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
    },
  });
}

// Reorder lessons
export function useReorderLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderLessonsPayload) => {
      const response = await api.put<{ success: boolean; message: string }>('/api/pronunciation/admin/lessons-reorder', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to reorder lessons');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'sections'] });
    },
  });
}

// ============================================
// PART HOOKS
// ============================================

// Fetch all parts (with optional lessonId filter)
export function useAdminParts(lessonId?: string) {
  return useQuery({
    queryKey: ['admin', 'pronunciation', 'parts', { lessonId }],
    queryFn: async (): Promise<PronunciationPart[]> => {
      const params = lessonId ? `?lessonId=${lessonId}` : '';
      const response = await api.get<PartsResponse>(`/api/pronunciation/admin/parts${params}`);
      if (response.data.success) {
        return response.data.parts;
      }
      throw new Error('Failed to load parts');
    },
    enabled: lessonId !== undefined,
    staleTime: 30 * 1000,
  });
}

// Fetch a single part (admin)
export function useAdminPart(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'pronunciation', 'part', id],
    queryFn: async (): Promise<PronunciationPart> => {
      const response = await api.get<PartResponse>(`/api/pronunciation/admin/parts/${id}`);
      if (response.data.success) {
        return response.data.part;
      }
      throw new Error('Part not found');
    },
    enabled: id !== null,
    staleTime: 30 * 1000,
  });
}

// Create a part
export function useCreatePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePartPayload) => {
      const response = await api.post<PartResponse>('/api/pronunciation/admin/parts', data);
      if (response.data.success) {
        return response.data.part;
      }
      throw new Error('Failed to create part');
    },
    onSuccess: (newPart) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'parts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lesson', newPart.lessonId] });
    },
  });
}

// Update a part
export function useUpdatePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePartPayload }) => {
      const response = await api.put<PartResponse>(`/api/pronunciation/admin/parts/${id}`, data);
      if (response.data.success) {
        return response.data.part;
      }
      throw new Error('Failed to update part');
    },
    onSuccess: (updatedPart) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'parts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lesson', updatedPart.lessonId] });
      queryClient.setQueryData(['admin', 'pronunciation', 'part', updatedPart.id], updatedPart);
    },
  });
}

// Delete a part
export function useDeletePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/pronunciation/admin/parts/${id}`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to delete part');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'parts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'lessons'] });
    },
  });
}

// Reorder parts
export function useReorderParts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderPartsPayload) => {
      const response = await api.put<{ success: boolean; message: string }>('/api/pronunciation/admin/parts-reorder', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to reorder parts');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pronunciation', 'parts'] });
    },
  });
}

// ============================================
// FILE UPLOAD & AUDIO GENERATION HOOKS
// ============================================

// Upload image
export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await api.post<UploadResponse>('/api/pronunciation/admin/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to upload image');
    },
  });
}

// Upload audio
export function useUploadAudio() {
  return useMutation({
    mutationFn: async ({ file, folder, filename }: { file: File; folder?: string; filename?: string }) => {
      const formData = new FormData();
      formData.append('audio', file);
      if (folder) {
        formData.append('folder', folder);
      }
      if (filename) {
        formData.append('filename', filename);
      }

      const response = await api.post<UploadResponse>('/api/pronunciation/admin/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to upload audio');
    },
  });
}

// Generate audio preview
export function useGenerateAudio() {
  return useMutation({
    mutationFn: async (data: GenerateAudioPayload) => {
      const response = await api.post<GenerateAudioResponse>('/api/pronunciation/admin/generate-audio', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to generate audio');
    },
  });
}

// Save audio to S3
export function useSaveAudio() {
  return useMutation({
    mutationFn: async (data: SaveAudioPayload) => {
      const response = await api.post<SaveAudioResponse>('/api/pronunciation/admin/save-audio', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to save audio');
    },
  });
}

// Transcribe audio and align with text lines
interface TranscribeAudioPayload {
  audioUrl: string;
  text: string;
}

interface TranscribeAudioResponse {
  success: boolean;
  segments: { line: string; start: number; end: number }[];
  transcript: string;
  wordCount: number;
  duration: number;
}

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: async (data: TranscribeAudioPayload) => {
      const response = await api.post<TranscribeAudioResponse>('/api/pronunciation/admin/transcribe-audio', data);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to transcribe audio');
    },
  });
}
