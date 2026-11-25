export type QuickMode =
  | 'auto'
  | 'summarize'
  | 'diagnose'
  | 'plan'
  | 'translate';

export interface AIStep {
  id: string;
  label: string;
  done: boolean;
}

export type TabularValue = string | number | boolean | null;
export type TabularRow = Record<string, TabularValue>;

export interface AIResponse {
  detected_intent: string;
  direct_answer: string;
  structured_steps: AIStep[];
  tabular_data: TabularRow[];
  suggested_next_action: string;
}

export interface MediaAttachment {
  id: string;
  kind: 'image' | 'audio' | 'file';
  name: string;
  mimeType: string;
  base64: string; // sem prefixo data:
  previewUrl?: string;
  size: number;
}

export interface OmniInputPayload {
  text: string;
  attachments: MediaAttachment[];
  mode: QuickMode;
}

export interface SessionEntry {
  id: string;
  createdAt: string;
  mode: QuickMode;
  inputSummary: string;
  response: AIResponse;
}
