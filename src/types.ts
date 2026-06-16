export type QueryType = 'file' | 'url' | 'domain' | 'ip' | 'hash' | 'image' | 'general_chat';

export type AnalysisStatus = 'completed' | 'pending' | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface AnalysisResult {
  input_type: QueryType;
  status: AnalysisStatus;
  risk_level: RiskLevel;
  verdict: string;
  key_findings: string[];
  recommended_actions: string[];
  confidence: number; // 0 to 100
  source: string;
  raw_data?: any; // For high-level JSON debug views
  input_value: string;
  is_vt_fallback?: boolean; // Set to true if VIRUSTOTAL_API_KEY is not configured
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: QueryType;
  analysis?: AnalysisResult;
  file_info?: {
    name: string;
    size: number;
    mimeType: string;
  };
}
