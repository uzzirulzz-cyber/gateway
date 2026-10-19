export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'mistral';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderId;
  contextWindow: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  avgLatencyMs: number;
  throughputTps: number;
  status: 'operational' | 'degraded' | 'offline';
  description: string;
  badge: string;
  electricColor: string;
  benchmarkScore: number;
}

export interface GatewayRoute {
  primaryModelId: string;
  fallbackModelIds: string[];
  retryCount: number;
  timeoutMs: number;
  routingStrategy: 'priority' | 'latency' | 'cost';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GatewayRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  simulateOutage?: boolean;
}

export interface FailoverStep {
  modelId: string;
  provider: ProviderId;
  latencyMs: number;
  status: 'attempted' | 'failed' | 'success';
  reason?: string;
}

export interface GatewayResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'error';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs: number;
  resolvedModel: string;
  costUsd: number;
  failoverSteps: FailoverStep[];
}

export interface GatewayLog {
  id: string;
  timestamp: string;
  requestedModel: string;
  resolvedModel: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  status: number;
  failoverCount: number;
  routeStrategy: string;
  requestPreview: string;
  responsePreview: string;
}

export interface VirtualApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed: string;
  monthlySpend: number;
  spendLimit: number;
  allowedModels: string[];
  active: boolean;
}

export interface SecurityOperator {
  id: string;
  imageUrl: string;
  pin: string;
  accentColor: string;
}
