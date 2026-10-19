import { ModelConfig, SecurityOperator, VirtualApiKey, GatewayLog } from './types';

// Security nodes: purely image based with secret PIN, no names or pin revealed in UI
export const OPERATORS: SecurityOperator[] = [
  {
    id: 'node-1',
    imageUrl: 'https://www.dropbox.com/scl/fi/rb7o9l95n3p3cuqojk34v/qazi.png?rlkey=r3aof0853xaa5et1iad35v0rl&raw=1',
    pin: '10011',
    accentColor: '#FF5500' // High-voltage flame orange
  },
  {
    id: 'node-2',
    imageUrl: 'https://www.dropbox.com/scl/fi/ra2flkqq9mqpr5udu6c2n/creed.png?rlkey=0lqj28r0qkppyvs3ofo7f8xo6&raw=1',
    pin: '10012',
    accentColor: '#10B981' // Electric Emerald
  },
  {
    id: 'node-3',
    imageUrl: 'https://www.dropbox.com/scl/fi/1adl3zr6juecfi86qmlap/mahbuba.jpg?rlkey=xemwl12md7jfj5k04bwgbb8q3&raw=1',
    pin: '10013',
    accentColor: '#F59E0B' // Electric Amber
  }
];

export const MODELS_REGISTRY: Record<string, ModelConfig> = {
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    avgLatencyMs: 640,
    throughputTps: 82,
    status: 'operational',
    description: 'SOTA frontier reasoning, complex architecture & high-precision code synthesis.',
    badge: 'FLAGSHIP CODEX',
    electricColor: '#F97316', // Electric Orange / Amber
    benchmarkScore: 93.7
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'openai',
    contextWindow: 128000,
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    avgLatencyMs: 510,
    throughputTps: 110,
    status: 'operational',
    description: 'High-speed omnimodal flagship with dynamic tool calling and deep analysis.',
    badge: 'OMNI CORE',
    electricColor: '#10B981', // Electric Emerald
    benchmarkScore: 92.4
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    contextWindow: 1000000,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    avgLatencyMs: 240,
    throughputTps: 185,
    status: 'operational',
    description: 'Lightning-fast sub-second latency with massive 1,000,000 token context window.',
    badge: 'TURBO SPEED',
    electricColor: '#38BDF8', // Electric Cyan
    benchmarkScore: 90.8
  },
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    contextWindow: 128000,
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    avgLatencyMs: 180,
    throughputTps: 420,
    status: 'operational',
    description: 'Ultra-low latency Groq LPU inference running at 400+ tokens per second.',
    badge: 'LPU 420 TPS',
    electricColor: '#A855F7', // Electric Violet
    benchmarkScore: 89.2
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    avgLatencyMs: 290,
    throughputTps: 160,
    status: 'operational',
    description: 'Affordable high-throughput worker model for autonomous sub-agents.',
    badge: 'LIGHTWEIGHT',
    electricColor: '#06B6D4', // Cyan
    benchmarkScore: 86.5
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    contextWindow: 2000000,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    avgLatencyMs: 780,
    throughputTps: 74,
    status: 'operational',
    description: 'Extreme 2,000,000 token context window capable of ingesting entire repos.',
    badge: '2M CONTEXT',
    electricColor: '#6366F1', // Indigo
    benchmarkScore: 91.9
  },
  'mistral-large-latest': {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2',
    provider: 'mistral',
    contextWindow: 128000,
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00,
    avgLatencyMs: 590,
    throughputTps: 88,
    status: 'operational',
    description: 'High-reasoning multilingual European model with advanced function invocation.',
    badge: 'REASONING',
    electricColor: '#EC4899', // Pink / Magenta
    benchmarkScore: 88.7
  }
};

export const INITIAL_VIRTUAL_KEYS: VirtualApiKey[] = [
  {
    id: 'key-prod-01',
    name: 'Production Ingest Gateway',
    keyPrefix: 'pb-live-9f8a2c4e...',
    createdAt: '2026-09-14',
    lastUsed: 'Just now',
    monthlySpend: 42.18,
    spendLimit: 150.00,
    allowedModels: ['claude-3-5-sonnet-20241022', 'gemini-2.5-flash', 'llama-3.3-70b-versatile'],
    active: true
  },
  {
    id: 'key-dev-02',
    name: 'Autonomous Agent Sandbox',
    keyPrefix: 'pb-live-4b719d0a...',
    createdAt: '2026-10-02',
    lastUsed: '4 minutes ago',
    monthlySpend: 8.92,
    spendLimit: 30.00,
    allowedModels: ['gpt-4o-mini', 'gemini-2.5-flash'],
    active: true
  },
  {
    id: 'key-batch-03',
    name: 'Batch Vectorization Pipeline',
    keyPrefix: 'pb-live-11a5e89f...',
    createdAt: '2026-10-18',
    lastUsed: '18 minutes ago',
    monthlySpend: 114.60,
    spendLimit: 500.00,
    allowedModels: ['gemini-2.5-flash', 'llama-3.3-70b-versatile'],
    active: true
  }
];

export const INITIAL_LOGS: GatewayLog[] = [
  {
    id: 'req_892fa1e4',
    timestamp: '13:41:02',
    requestedModel: 'claude-3-5-sonnet-20241022',
    resolvedModel: 'claude-3-5-sonnet-20241022',
    latencyMs: 614,
    promptTokens: 420,
    completionTokens: 184,
    estimatedCost: 0.00402,
    status: 200,
    failoverCount: 0,
    routeStrategy: 'priority',
    requestPreview: 'Provide architectural recommendations for distributed vector indexing...',
    responsePreview: 'When scaling distributed vector stores, decouple index shards from inference nodes...'
  },
  {
    id: 'req_892fa1e3',
    timestamp: '13:38:44',
    requestedModel: 'claude-3-5-sonnet-20241022',
    resolvedModel: 'gemini-2.5-flash',
    latencyMs: 480,
    promptTokens: 310,
    completionTokens: 215,
    estimatedCost: 0.00009,
    status: 200,
    failoverCount: 1,
    routeStrategy: 'priority',
    requestPreview: 'Draft an async event bus pattern using Redis streams in Go...',
    responsePreview: 'Here is an idempotent Go consumer implementation leveraging Consumer Groups...'
  },
  {
    id: 'req_892fa1e2',
    timestamp: '13:35:19',
    requestedModel: 'llama-3.3-70b-versatile',
    resolvedModel: 'llama-3.3-70b-versatile',
    latencyMs: 172,
    promptTokens: 140,
    completionTokens: 98,
    estimatedCost: 0.00016,
    status: 200,
    failoverCount: 0,
    routeStrategy: 'latency',
    requestPreview: 'Classify sentiment and extract entities from incoming enterprise audit logs...',
    responsePreview: 'Classification: NEUTRAL-SYSTEM. Entities: [Cluster-East-1, Kubernetes, PodMemoryExceeded].'
  },
  {
    id: 'req_892fa1e1',
    timestamp: '13:31:05',
    requestedModel: 'gpt-4o',
    resolvedModel: 'gpt-4o',
    latencyMs: 495,
    promptTokens: 840,
    completionTokens: 310,
    estimatedCost: 0.0052,
    status: 200,
    failoverCount: 0,
    routeStrategy: 'priority',
    requestPreview: 'Analyze the trade-offs of single-tenant vs multi-tenant database partitioning...',
    responsePreview: 'Single-tenant architecture provides strict regulatory compliance and eliminates noisy neighbor...'
  }
];
