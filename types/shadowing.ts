export interface ShadowingLesson {
  id: number;
  title: string;
  youtubeVideoId: string;
  description: string | null;
  tags: string[];
  videoContent: VideoContent | null;
  duration: number | null;
  thumbnailUrl: string | null;
  status: 'draft' | 'queue' | 'published';
  order: number | null;
  category: 'start_here' | 'more_videos';
  isPublic: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoContent {
  content: VideoContentSegment[];
  [key: string]: unknown;
}

export interface VideoContentSegment {
  id: number;
  start: number;
  end: number;
  offset: number;
  text: string;
  wordCount: number;
}

export interface ShadowingLessonSummary {
  id: number;
  title: string;
  youtubeVideoId: string;
  description: string | null;
  tags: string[];
  duration: number | null;
  thumbnailUrl: string | null;
  status: 'draft' | 'queue' | 'published';
  category: 'start_here' | 'more_videos';
  order: number | null;
  isPublic: boolean;
  videoRequests?: Array<{
    userId: number;
    requestedAt: string;
    user: {
      id: number;
      first: string | null;
      last: string | null;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShadowingLessonsResponse {
  success: boolean;
  lessons: ShadowingLessonSummary[];
  pagination: PaginationInfo;
}

export interface ShadowingLessonResponse {
  success: boolean;
  lesson: ShadowingLesson;
}

export interface UpdateShadowingLessonPayload {
  title?: string;
  youtubeVideoId?: string;
  description?: string | null;
  tags?: string[];
  videoContent?: VideoContent | null;
  duration?: number | null;
  thumbnailUrl?: string | null;
  status?: 'draft' | 'queue' | 'published';
  order?: number | null;
  category?: 'start_here' | 'more_videos';
  isPublic?: boolean;
  metadata?: Record<string, unknown> | null;
}

// ============================================
// Shadowing Transcription Job Types
// ============================================

export type ShadowingTranscriptionJobStatus = 
  | 'pending' 
  | 'downloading' 
  | 'transcribing' 
  | 'processing' 
  | 'creating_lesson' 
  | 'completed' 
  | 'failed';

export interface ShadowingTranscriptionJob {
  id: string;
  youtubeUrl: string;
  videoId: string | null;
  status: ShadowingTranscriptionJobStatus;
  progress: string | null;
  result: ShadowingTranscriptionResult | null;
  error: string | null;
  title: string | null;
  duration: number | null;
  shadowingLessonId: number | null;
  shadowingLesson?: {
    id: number;
    title: string;
    status: 'draft' | 'queue' | 'published';
    youtubeVideoId: string;
  } | null;
  audioFilePath: string | null;
  transcriptFilePath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShadowingTranscriptionResult {
  videoId: string;
  title: string;
  duration: number;
  durationFormatted: string;
  durationMinutes: string;
  shadowingLessonId: number;
  stats: {
    totalWords: number;
    segments: number;
    speakingTimeSeconds: number;
    wpmBasedOnVideoLength: number;
    wpmBasedOnSpeakingTime: number;
  };
}

export interface ShadowingTranscriptionJobResponse {
  success: boolean;
  job: ShadowingTranscriptionJob;
  message?: string;
}

export interface ShadowingTranscriptionJobsResponse {
  success: boolean;
  jobs: ShadowingTranscriptionJob[];
  pagination: PaginationInfo;
}

export interface CreateShadowingTranscriptionPayload {
  url: string;
}

export interface QueueLessonPayload {
  url: string;
}

export interface QueueLessonResponse {
  success: boolean;
  lesson: ShadowingLesson;
  message: string;
}

export interface ProcessLessonResponse {
  success: boolean;
  job: {
    id: string;
    videoId: string;
    status: string;
    lessonId: number;
  };
  message: string;
}
