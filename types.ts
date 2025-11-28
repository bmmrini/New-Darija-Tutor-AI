export interface VocabItem {
  word: string;
  meaning: string;
  notes?: string;
}

export interface TutorResponse {
  transcription: string;
  translation: string; // New field for direct English translation
  explanation: string;
  vocabulary: VocabItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  type: 'text' | 'audio';
  content: string; // Text content or Base64 audio string
  response?: TutorResponse; // Parsed JSON response from AI
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface AudioInput {
  base64Data: string;
  mimeType: string;
}