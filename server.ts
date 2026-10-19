import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// CORS headers for OpenAI-compatible SDK clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-openai-api-key, x-anthropic-api-key, x-groq-api-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    service: 'Playbeat Gateway',
    timestamp: new Date().toISOString(),
    providers: {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      groq: !!process.env.GROQ_API_KEY
    }
  });
});

// Models list endpoint (OpenAI compatible)
app.get('/api/v1/models', (req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: [
      { id: 'claude-3-5-sonnet-20241022', object: 'model', created: 1718841600, owned_by: 'anthropic' },
      { id: 'gpt-4o', object: 'model', created: 1715367049, owned_by: 'openai' },
      { id: 'gpt-4o-mini', object: 'model', created: 1721299200, owned_by: 'openai' },
      { id: 'gemini-2.5-flash', object: 'model', created: 1735689600, owned_by: 'google' },
      { id: 'gemini-1.5-pro', object: 'model', created: 1713139200, owned_by: 'google' },
      { id: 'llama-3.3-70b-versatile', object: 'model', created: 1733356800, owned_by: 'groq' }
    ]
  });
});

// Real OpenAI execution helper
async function callRealOpenAI(model: string, messages: any[], temperature: number, maxTokens: number | undefined, customApiKey?: string) {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in server environment or request headers.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model.includes('gpt') ? model : 'gpt-4o',
      messages,
      temperature: temperature ?? 0.7,
      ...(maxTokens ? { max_tokens: maxTokens } : {})
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errorData}`);
  }

  return await response.json();
}

// Real Anthropic Claude execution helper
async function callRealAnthropic(model: string, messages: any[], temperature: number, maxTokens: number | undefined, customApiKey?: string) {
  const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured in server environment or request headers.');
  }

  // Extract system message if present
  let systemText = '';
  const anthropicMessages: any[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemText += (systemText ? '\n\n' : '') + m.content;
    } else {
      anthropicMessages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      });
    }
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model.includes('claude') ? model : 'claude-3-5-sonnet-20241022',
      messages: anthropicMessages,
      system: systemText || undefined,
      max_tokens: maxTokens || 2048,
      temperature: temperature ?? 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Anthropic HTTP ${response.status}: ${errorData}`);
  }

  const data = await response.json();
  const textContent = data.content?.[0]?.text || '';

  // Convert Anthropic format into standard OpenAI-compatible format
  return {
    id: data.id || `chatcmpl-claude-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: data.model || model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: textContent
        },
        finish_reason: data.stop_reason === 'end_turn' ? 'stop' : 'length'
      }
    ],
    usage: {
      prompt_tokens: data.usage?.input_tokens || 0,
      completion_tokens: data.usage?.output_tokens || 0,
      total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

// Real Google Gemini execution helper via @google/genai
async function callRealGemini(model: string, messages: any[], temperature: number, maxTokens: number | undefined) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const geminiModel = model.includes('1.5-pro') ? 'gemini-1.5-pro' : 'gemini-2.5-flash';

  let systemInstruction = '';
  const contents: string[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemInstruction += (systemInstruction ? '\n' : '') + m.content;
    } else {
      contents.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`);
    }
  }

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: contents.join('\n\n'),
    config: {
      systemInstruction: systemInstruction || undefined,
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxTokens || 2048
    }
  });

  const generatedText = response.text || '';
  const promptTokens = Math.max(1, Math.round(contents.join(' ').length / 4));
  const completionTokens = Math.max(1, Math.round(generatedText.length / 4));

  return {
    id: `chatcmpl-gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: geminiModel,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: generatedText
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };
}

// Universal Chat Completion Route with Automatic Real Failover Mesh
app.post('/api/v1/chat/completions', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const { model, messages, temperature = 0.7, max_tokens, fallback_models = [], simulate_outage } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: { message: 'Missing or invalid "messages" array.' } });
    return;
  }

  const requestedModel = model || 'claude-3-5-sonnet-20241022';
  // Standard fallback priority
  const defaultFallbacks = ['claude-3-5-sonnet-20241022', 'gpt-4o', 'gemini-2.5-flash'];
  const chain = Array.from(new Set([requestedModel, ...(Array.isArray(fallback_models) ? fallback_models : []), ...defaultFallbacks]));

  const customOpenAiKey = (req.headers['x-openai-api-key'] as string) || '';
  const customAnthropicKey = (req.headers['x-anthropic-api-key'] as string) || '';

  const failoverSteps: any[] = [];
  let successfulResponse: any = null;
  let resolvedModel = requestedModel;

  for (let i = 0; i < chain.length; i++) {
    const targetModel = chain[i];
    const stepStart = performance.now();

    // If simulate outage was explicitly checked for the first model
    if (simulate_outage && i === 0 && chain.length > 1) {
      failoverSteps.push({
        modelId: targetModel,
        latencyMs: 85,
        status: 'failed',
        reason: 'Simulated 429 Provider Rate Limit Trip'
      });
      continue;
    }

    try {
      if (targetModel.includes('claude')) {
        successfulResponse = await callRealAnthropic(targetModel, messages, temperature, max_tokens, customAnthropicKey);
        resolvedModel = targetModel;
      } else if (targetModel.includes('gpt')) {
        successfulResponse = await callRealOpenAI(targetModel, messages, temperature, max_tokens, customOpenAiKey);
        resolvedModel = targetModel;
      } else {
        // Default to Google Gemini 2.5 Flash / 1.5 Pro
        successfulResponse = await callRealGemini(targetModel, messages, temperature, max_tokens);
        resolvedModel = targetModel;
      }

      const stepLatency = Math.round(performance.now() - stepStart);
      failoverSteps.push({
        modelId: targetModel,
        latencyMs: stepLatency,
        status: 'success'
      });
      break;
    } catch (err: any) {
      const stepLatency = Math.round(performance.now() - stepStart);
      failoverSteps.push({
        modelId: targetModel,
        latencyMs: stepLatency,
        status: 'failed',
        reason: err.message || 'Upstream provider unavailable'
      });
      // Continue to next provider in failover chain!
    }
  }

  const totalLatency = Math.round(performance.now() - startTime);

  if (successfulResponse) {
    res.json({
      ...successfulResponse,
      gateway_meta: {
        requested_model: requestedModel,
        resolved_model: resolvedModel,
        latency_ms: totalLatency,
        failover_steps: failoverSteps
      }
    });
  } else {
    res.status(502).json({
      error: {
        message: 'All models in the failover chain failed to complete the request.',
        type: 'gateway_failover_exhausted',
        failover_steps: failoverSteps
      }
    });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Playbeat Gateway] Real multi-provider routing server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Playbeat Gateway] Fatal startup failure:', err);
});
