// ============================================
// Pronunciation Course Types
// ============================================

// Part Types
export type PronunciationPartType = 
  | 'video' 
  | 'recognition_quiz' 
  | 'listen_repeat' 
  | 'pronunciation_quiz';

// OpenAI TTS Voices
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// ============================================
// Section Types
// ============================================

export interface PronunciationSection {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  lessons?: PronunciationLesson[];
}

export interface CreateSectionPayload {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublished?: boolean;
}

export interface UpdateSectionPayload {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  order?: number;
  isPublished?: boolean;
}

// ============================================
// Lesson Types
// ============================================

export interface PronunciationLesson {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  section?: {
    id: string;
    title: string;
  };
  parts?: PronunciationPart[];
}

export interface CreateLessonPayload {
  sectionId: string;
  title: string;
  description?: string | null;
  isPublished?: boolean;
}

export interface UpdateLessonPayload {
  sectionId?: string;
  title?: string;
  description?: string | null;
  order?: number;
  isPublished?: boolean;
}

// ============================================
// Part Types
// ============================================

export interface PronunciationPart {
  id: string;
  lessonId: string;
  partType: PronunciationPartType;
  title: string | null;
  description: string | null;
  order: number;
  isPublished: boolean;
  content: PartContent;
  createdAt: string;
  updatedAt: string;
  lesson?: {
    id: string;
    title: string;
    sectionId: string;
    section?: {
      id: string;
      title: string;
    };
  };
}

export interface CreatePartPayload {
  lessonId: string;
  partType: PronunciationPartType;
  title?: string | null;
  description?: string | null;
  content?: PartContent;
  isPublished?: boolean;
}

export interface UpdatePartPayload {
  lessonId?: string;
  partType?: PronunciationPartType;
  title?: string | null;
  description?: string | null;
  order?: number;
  content?: PartContent;
  isPublished?: boolean;
}

// ============================================
// Part Content Types
// ============================================

// Union type for all part content types
export type PartContent = 
  | VideoContent 
  | RecognitionQuizContent 
  | ListenRepeatContent 
  | PronunciationQuizContent
  | Record<string, never>; // Empty object for new parts

// Video Part Content
export interface VideoContent {
  title?: string;
  description?: string;
  vimeoVideoId: string;
}

// Recognition Quiz Content
export interface RecognitionQuizContent {
  questions: RecognitionQuizQuestion[];
}

export interface RecognitionQuizQuestion {
  id: number;
  options: RecognitionQuizOption[];
  // Note: The correct audio is the audioUrl from the option with isCorrect: true
}

export interface RecognitionQuizOption {
  word: string;
  audioUrl: string;
  audioText: string;
  isCorrect: boolean;
}

// Listen & Repeat Content
export interface ListenRepeatContent {
  items: ListenRepeatItem[];
}

export interface ListenRepeatItem {
  text: string;
  audioUrl: string;
}

// Pronunciation Quiz Content (Single Word)
export interface PronunciationQuizContent {
  questions: PronunciationQuizQuestion[];
}

export interface PronunciationQuizQuestion {
  referenceText: string;
  highlightPhonemes?: string[];
  review: PronunciationReviewItem[];
}

export interface PronunciationReviewItem {
  word: string;
  audioUrl: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: T | boolean | string | undefined;
}

export interface SectionsResponse extends ApiResponse<PronunciationSection[]> {
  sections: PronunciationSection[];
}

export interface SectionResponse extends ApiResponse<PronunciationSection> {
  section: PronunciationSection;
}

export interface LessonsResponse extends ApiResponse<PronunciationLesson[]> {
  lessons: PronunciationLesson[];
}

export interface LessonResponse extends ApiResponse<PronunciationLesson> {
  lesson: PronunciationLesson;
}

export interface PartsResponse extends ApiResponse<PronunciationPart[]> {
  parts: PronunciationPart[];
}

export interface PartResponse extends ApiResponse<PronunciationPart> {
  part: PronunciationPart;
}

// ============================================
// Reorder Types
// ============================================

export interface ReorderSectionsPayload {
  orderedIds: string[];
}

export interface ReorderLessonsPayload {
  sectionId: string;
  orderedIds: string[];
}

export interface ReorderPartsPayload {
  lessonId: string;
  orderedIds: string[];
}

// ============================================
// File Upload & Audio Generation Types
// ============================================

export interface UploadResponse extends ApiResponse<string> {
  url: string;
  fullUrl: string;
}

export interface GenerateAudioPayload {
  text: string;
  voice?: TTSVoice;
}

export interface GenerateAudioResponse extends ApiResponse<string> {
  audioBase64: string;
  mimeType: string;
  text: string;
  voice: TTSVoice;
}

export interface SaveAudioPayload {
  audioBase64: string;
  folder: string;
  filename?: string;
}

export interface SaveAudioResponse extends ApiResponse<string> {
  url: string;
  fullUrl: string;
}

// ============================================
// UI Helper Types
// ============================================

export interface PartTypeConfig {
  type: PronunciationPartType;
  label: string;
  icon: string;
  description: string;
}

export const PART_TYPE_CONFIGS: PartTypeConfig[] = [
  {
    type: 'video',
    label: 'Video',
    icon: '🎬',
    description: 'Vimeo video content'
  },
  {
    type: 'recognition_quiz',
    label: 'Recognition Quiz',
    icon: '👂',
    description: 'Listen and select the correct word'
  },
  {
    type: 'listen_repeat',
    label: 'Listen & Repeat',
    icon: '🔊',
    description: 'Audio with text for practice'
  },
  {
    type: 'pronunciation_quiz',
    label: 'Pronunciation Quiz',
    icon: '🎤',
    description: 'Record and assess pronunciation'
  }
];

export const TTS_VOICES: { value: TTSVoice; label: string; description: string }[] = [
  { value: 'nova', label: 'Nova', description: 'Friendly, natural (recommended)' },
  { value: 'alloy', label: 'Alloy', description: 'Neutral, balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm, conversational' },
  { value: 'fable', label: 'Fable', description: 'Expressive, storytelling' },
  { value: 'onyx', label: 'Onyx', description: 'Deep, authoritative' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft, gentle' }
];

// Helper function to get part type display name
export function getPartTypeLabel(type: PronunciationPartType): string {
  const config = PART_TYPE_CONFIGS.find(c => c.type === type);
  return config?.label || type;
}

// Helper function to get part type icon
export function getPartTypeIcon(type: PronunciationPartType): string {
  const config = PART_TYPE_CONFIGS.find(c => c.type === type);
  return config?.icon || '📄';
}
