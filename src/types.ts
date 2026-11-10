export interface DialogueItem {
  id: number;
  miaQuestion: string;
  targetSentence: string;
  keyWords: string[]; // bold key words required for meaning
  chunks: string[]; // 2-3 short chunks for 3rd attempt scaffolding
}

export type MicState = 'ready' | 'listening' | 'checking';

export interface SentenceResult {
  dialogueId: number;
  completed: boolean;
  skipped: boolean;
  attempts: number; // tap frequency for this step
  tapCount?: number;
  bestTranscript: string;
  hadMissingSmallWordsOnly?: boolean;
  audioBlobUrl?: string; // in-memory recording URL for playback
}

export interface GoogleSheetsPayload {
  timestamp: string;
  sentence1: number;
  sentence2: number;
  sentence3: number;
  sentence4: number;
  sentence5: number;
  avg: number;
}

export interface FeedbackData {
  text: string;
  isAiGenerated: boolean;
  type: 'success' | 'small_word_missing' | 'recast' | 'elicitation' | 'chunking' | 'silence';
}

export type AppScreen = 'start' | 'practice' | 'result' | 'summary';

export interface PracticeRecord {
  id?: string;
  user_id?: string | null;
  timestamp: string;
  completed_count: number;
  sentence1_taps: number;
  sentence2_taps: number;
  sentence3_taps: number;
  sentence4_taps: number;
  sentence5_taps: number;
  total_taps: number;
  avg_taps: number;
  created_at?: string;
}

