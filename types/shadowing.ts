export interface ShadowingLesson {
  id: number;
  title: string;
  youtubeVideoId: string;
  description: string | null;
  tags: string[];
  videoContent: VideoContent | null;
  duration: number | null;
  thumbnailUrl: string | null;
  status: 'draft' | 'published';
  order: number | null;
  category: 'start_here' | 'more_videos';
  userId: number | null;
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
  status: 'draft' | 'published';
  category: 'start_here' | 'more_videos';
  order: number | null;
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
  status?: 'draft' | 'published';
  order?: number | null;
  category?: 'start_here' | 'more_videos';
  metadata?: Record<string, unknown> | null;
}
