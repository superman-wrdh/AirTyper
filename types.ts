export interface KeyDetectionResult {
  key: string | null;
  confidence: number;
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ERROR = 'ERROR'
}

export interface KeyboardLayoutRow {
  keys: string[];
}
