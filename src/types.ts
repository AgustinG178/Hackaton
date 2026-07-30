export interface DocumentField {
  label: string;
  value: string;
  unit?: string;
  isNormal?: boolean;
}

export interface MedicalDocument {
  id: string;
  title: string;
  date: string;
  isoDate: string;
  category: 'Análisis' | 'Imagenología' | 'Especialista' | 'Receta' | 'Otro';
  institution: string;
  summary: string;
  extractedText: string;
  fields: DocumentField[];
  tags: string[];
  synthetic?: boolean;
  confirmed?: boolean;
  imagePreviewUrl?: string;
  imagePreviewUrls?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedDocIds?: string[];
}

export interface InferenceEngineConfig {
  engineType: 'fake' | 'gemma-local';
  modelPath: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  quantization: 'int4' | 'int8' | 'fp16';
  useNPU: boolean;
  systemPrompt: string;
}

export interface EngineStats {
  ramUsageMb: number;
  inferenceSpeedTps: number;
  activeModel: string;
  lastResponseLatencyMs: number;
}

export type TabType = 'history' | 'add' | 'chat';
