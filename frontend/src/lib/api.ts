/**
 * MEDIFED AI — API Client
 * Communicates with the FastAPI ML Microservice.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  device: string;
  checkpoint: string;
  uptime_seconds: number;
  timestamp: string;
}

export interface PredictionResult {
  predicted_class: "NORMAL" | "PNEUMONIA";
  probabilities: { NORMAL: number; PNEUMONIA: number };
  confidence: number;
  gradcam_base64: string;
  original_base64: string;
  model_checkpoint: string;
  inference_time_ms: number;
}

export interface MetricsData {
  model: string;
  strategy: string;
  optimizer: string;
  total_rounds: number;
  test_set_size: number;
  rounds: Record<string, any>;
  client_wise_round_3: Record<string, any>;
  federation: Record<string, any>;
}

export interface ClientInfo {
  client_id: string;
  name: string;
  dataset_source: string;
  train_size: number;
  test_size: number;
  characteristics: string;
}

export interface FederationClients {
  num_clients: number;
  clients: ClientInfo[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${this.baseUrl}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch health status");
    return res.json();
  }

  async predict(file: File): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${this.baseUrl}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || "Inference failed");
    }

    return res.json();
  }

  async getMetrics(): Promise<MetricsData> {
    const res = await fetch(`${this.baseUrl}/metrics`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch metrics");
    return res.json();
  }

  async getFederationClients(): Promise<FederationClients> {
    const res = await fetch(`${this.baseUrl}/federation/clients`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch federation clients");
    return res.json();
  }

  async getFederationRounds(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/federation/rounds`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch federation rounds");
    return res.json();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
