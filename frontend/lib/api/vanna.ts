const VANNA_API_BASE = process.env.NEXT_PUBLIC_VANNA_API_URL || 'http://localhost:8000';

export interface QuestionRequest {
  question: string;
  execute?: boolean;
}

export interface QueryResult {
  success: boolean;
  question: string;
  sql?: string;
  results?: any[];
  explanation?: string;
  row_count?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  database: string;
  vanna: string;
}

export interface TrainingResponse {
  success: boolean;
  message: string;
  tables_trained?: number;
  error?: string;
}

export class VannaAPI {
  private baseUrl: string;

  constructor(baseUrl: string = VANNA_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check API health status
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Train Vanna AI on database schema
   */
  async train(): Promise<TrainingResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Training failed');
    }
    
    return response.json();
  }

  /**
   * Ask a question and optionally execute it
   */
  async ask(question: string, execute: boolean = true): Promise<QueryResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, execute }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Query failed');
    }
    
    return response.json();
  }

  /**
   * Generate SQL without executing
   */
  async generateSQL(question: string): Promise<QueryResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'SQL generation failed');
    }
    
    return response.json();
  }
}

// Export singleton instance
export const vannaAPI = new VannaAPI();