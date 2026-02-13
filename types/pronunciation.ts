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
  slug: string;
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
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublished?: boolean;
}

export interface UpdateSectionPayload {
  title?: string;
  slug?: string;
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
  slug: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  section?: {
    id: string;
    title: string;
    slug: string;
  };
  parts?: PronunciationPart[];
}

export interface CreateLessonPayload {
  sectionId: string;
  title: string;
  slug: string;
  description?: string | null;
  isPublished?: boolean;
}

export interface UpdateLessonPayload {
  sectionId?: string;
  title?: string;
  slug?: string;
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
  vimeoVideoId: string;
  textBefore?: string;  // Text content to display before the video
  textAfter?: string;   // Text content to display after the video
}

// Recognition Quiz Content
export interface RecognitionQuizContent {
  questions: RecognitionQuizQuestion[];
}

export interface RecognitionQuizQuestion {
  id: number;
  options: RecognitionQuizOption[];
  // Note: The correct answer is randomly assigned on the frontend at quiz time
}

export interface RecognitionQuizOption {
  word: string;
  audioUrl: string;
  audioText: string;
  voice?: TTSVoice; // Voice used for TTS generation
  isCustomAudio?: boolean; // True if audio was uploaded, false if AI generated
  isCorrect?: boolean; // Deprecated: correct answer is now randomly assigned on frontend
}

// Listen & Repeat Content
export interface ListenRepeatContent {
  items: ListenRepeatItem[];
}

export interface ListenRepeatSegment {
  line: string;      // Original line text
  start: number;     // Start time in seconds
  end: number;       // End time in seconds
}

export interface RawWordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface ListenRepeatItem {
  label?: string;        // Optional label/title for this item
  text: string;          // Multi-line text with \n
  audioUrl: string;
  voice?: TTSVoice;
  isCustomAudio?: boolean; // True if audio was uploaded, false if AI generated
  segments?: ListenRepeatSegment[];  // Timestamped segments per line
  rawWords?: RawWordTimestamp[];     // Raw word-level timestamps from Deepgram
  enableRecording?: boolean; // Enable per-segment recording for user practice
}

// Pronunciation Quiz Content
// quizType distinguishes between single word and future multi-word quizzes
export type PronunciationQuizType = 'single_word' | 'multi_word';

export interface PronunciationQuizContent {
  quizType: PronunciationQuizType; // 'single_word' for now, 'multi_word' for future
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
  voice?: TTSVoice;
  isCustomAudio?: boolean; // True if audio was uploaded, false if AI generated
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
    label: 'Pronunciation Quiz (Single Word)',
    icon: '🎤',
    description: 'Record and assess single word pronunciation'
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
