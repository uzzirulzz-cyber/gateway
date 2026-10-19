import React, { useState } from 'react';
import { ModelConfig, GatewayResponse } from '../lib/types';
import { MODELS_REGISTRY } from '../lib/registry';
import { executeGatewayRoute, generateCodeSnippets } from '../lib/router';
import { sound } from '../lib/audio';
import { 
  Play, 
  RotateCcw, 
  Code2, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ChevronDown, 
  Sliders, 
  ArrowRight,
  ShieldAlert,
  Server,
  Sparkles
} from 'lucide-react';

const DEFAULT_PREVIEW_TEXT = `// [Executed by Claude 3.5 Sonnet Codex Engine]
// Target: High-throughput concurrent worker pool with context cancellation

package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Job struct {
	ID   int
	Data string
}

type Result struct {
	JobID  int
	Output string
	Err    error
}

func WorkerPool(ctx context.Context, numWorkers int, jobs <-chan Job, results chan<- Result) {
	var wg sync.WaitGroup

	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case job, ok := <-jobs:
					if !ok {
						return
					}
					// Process task with bounded concurrency
					results <- Result{
						JobID:  job.ID,
						Output: fmt.Sprintf("Worker %d completed job %d", workerID, job.ID),
					}
				}
			}
		}(w)
	}

	go func() {
		wg.Wait()
		close(results)
	}()
}`;

const DEFAULT_GATEWAY_RESULT: GatewayResponse = {
  id: 'chatcmpl-preview-init',
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model: 'claude-3-5-sonnet-20241022',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: DEFAULT_PREVIEW_TEXT
      },
      finish_reason: 'stop'
    }
  ],
  usage: {
    prompt_tokens: 42,
    completion_tokens: 284,
    total_tokens: 326
  },
  latencyMs: 412,
  resolvedModel: 'claude-3-5-sonnet-20241022',
  costUsd: 0.00438,
  failoverSteps: [
    {
      modelId: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      latencyMs: 412,
      status: 'success'
    }
  ]
};

export const PlaygroundTab: React.FC<{
  onLogGenerated: (response: GatewayResponse, requestedModel: string, promptText: string) => void;
}> = ({ onLogGenerated }) => {
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-5-sonnet-20241022');
  const [fallbackChain, setFallbackChain] = useState<string[]>(['gemini-2.5-flash', 'llama-3.3-70b-versatile']);
  const [systemPrompt, setSystemPrompt] = useState('You are an autonomous engineering copilot connected via Playbeat Gateway.');
  const [userPrompt, setUserPrompt] = useState('Write an idiomatic, high-throughput concurrent worker pool in Go with context cancellation and backpressure channels.');
  const [temperature, setTemperature] = useState(0.7);
  const [stream, setStream] = useState(true);
  const [simulateOutage, setSimulateOutage] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState(DEFAULT_PREVIEW_TEXT);
  const [gatewayResult, setGatewayResult] = useState<GatewayResponse | null>(DEFAULT_GATEWAY_RESULT);
  const [viewMode, setViewMode] = useState<'preview' | 'json' | 'trace'>('preview');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const availableModels = Object.values(MODELS_REGISTRY);
  const currentModelConfig = MODELS_REGISTRY[selectedModel] || MODELS_REGISTRY['gemini-2.5-flash'];

  const handleToggleFallback = (modelId: string) => {
    sound.playKey(600);
    setFallbackChain(prev => 
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : [...prev, modelId]
    );
  };

  const handleExecute = async () => {
    if (!userPrompt.trim() || isLoading) return;
    sound.playKey(750);
    setIsLoading(true);
    setStreamedText('');
    setGatewayResult(null);

    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      const response = await executeGatewayRoute(
        {
          model: selectedModel,
          messages,
          temperature,
          stream,
          simulateOutage
        },
        fallbackChain,
        'pb-live-9f8a2c4e...',
        (token) => {
          setStreamedText(prev => prev + token);
        }
      );

      setGatewayResult(response);
      onLogGenerated(response, selectedModel, userPrompt);
      if (response.failoverSteps.some(s => s.status === 'failed')) {
        sound.playSelect();
      } else {
        sound.playGranted();
      }
    } catch {
      sound.playDenied();
    } finally {
      setIsLoading(false);
    }
  };

  const snippets = generateCodeSnippets(selectedModel);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(type);
    sound.playKey(880);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Config & Prompt Column (5 cols) */}
      <div className="lg:col-span-5 space-y-5">
        {/* Electric Route Selector Card */}
        <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          {/* Subtle electric edge glow */}
          <div 
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${currentModelConfig.electricColor}, transparent)`,
              boxShadow: `0 0 12px ${currentModelConfig.electricColor}`
            }}
          />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Active Model Pipeline</h3>
            </div>
            <button
              onClick={() => setShowCodeModal(true)}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Integration SDK</span>
            </button>
          </div>

          {/* Primary Model Selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Target Model</label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  sound.playKey(520);
                }}
                className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white font-bold focus:outline-none focus:border-sky-500 appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider.toUpperCase()}) · {m.throughputTps} TPS · ${(m.inputCostPer1M).toFixed(2)}/1M in
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Fallback Chain Configurator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Active Fallback Chain</label>
              <span className="text-[11px] font-mono text-sky-400">
                {fallbackChain.length} Nodes Queued
              </span>
            </div>
            <div className="space-y-1.5 mb-3">
              {availableModels
                .filter(m => m.id !== selectedModel)
                .map(m => {
                  const inChain = fallbackChain.includes(m.id);
                  const orderIndex = fallbackChain.indexOf(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleFallback(m.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs cursor-pointer border transition-all ${
                        inChain
                          ? 'bg-sky-950/40 border-sky-500/70 text-sky-200 shadow-sm'
                          : 'bg-[#05080E]/70 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${inChain ? 'border-sky-400 bg-sky-500 text-slate-950 font-bold' : 'border-slate-700'}`}>
                          {inChain && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{m.name}</span>
                          <span 
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase"
                            style={{ backgroundColor: `${m.electricColor}20`, color: m.electricColor }}
                          >
                            {m.provider}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {inChain && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-800 font-bold">
                            Hop #{orderIndex + 1}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums font-semibold">
                          {m.avgLatencyMs}ms
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Outage Simulation Trigger */}
            <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-200 block">Simulate Upstream Outage</span>
                  <span className="text-[11px] text-amber-300/70 block">Forces 429 Rate Limit on primary to test failover</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={simulateOutage}
                onChange={(e) => {
                  setSimulateOutage(e.target.checked);
                  sound.playKey(e.target.checked ? 700 : 400);
                }}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Prompts Card */}
        <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={2}
              className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Prompt (Codex & Reasoning)</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              placeholder="Enter your prompt here..."
              className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-mono"
            />
          </div>

          {/* Quick Codex Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Codex Presets:</span>
            {[
              { label: 'Claude Codex (Go Queue)', model: 'claude-3-5-sonnet-20241022', prompt: 'Write an idiomatic, high-throughput concurrent worker pool in Go with context cancellation and backpressure channels.' },
              { label: 'OpenAI Codex (Rust Async)', model: 'gpt-4o', prompt: 'Implement a zero-copy lockless ring buffer in Rust using atomic CAS operations and crossbeam channels.' },
              { label: 'Gemini Codex (Distributed Mesh)', model: 'gemini-2.5-flash', prompt: 'Write a production-grade multi-tenant AI gateway router in TypeScript with jittered exponential backoff and circuit breaking.' },
              { label: 'Failover Test', model: 'claude-3-5-sonnet-20241022', prompt: 'Explain how automatic failover chains mitigate upstream rate limits in AI gateways.' }
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedModel(preset.model);
                  setUserPrompt(preset.prompt);
                  sound.playKey(640);
                }}
                className="px-2.5 py-1 text-[11px] bg-slate-900 border border-slate-800 text-slate-300 hover:border-sky-500 hover:text-white rounded-lg transition-colors font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Parameters Controls */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <label className="text-slate-400 font-semibold">Temp: <span className="font-mono text-white tabular-nums">{temperature}</span></label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-20 accent-sky-500 cursor-pointer"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={stream}
                onChange={(e) => setStream(e.target.checked)}
                className="w-3.5 h-3.5 accent-sky-500"
              />
              <span>Stream SSE</span>
            </label>
          </div>

          {/* Execute CTA Button with Electric Gradient */}
          <button
            onClick={handleExecute}
            disabled={isLoading || !userPrompt.trim()}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 text-slate-950 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Routing through Multi-Provider Mesh...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Dispatch Request</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Output & Diagnostics Column (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {/* Metrics Strip */}
        {gatewayResult && (
          <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left shadow-lg">
            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-semibold">Resolved Node</span>
              <span className="text-sm font-bold text-white tracking-tight truncate block">
                {MODELS_REGISTRY[gatewayResult.resolvedModel]?.name || gatewayResult.resolvedModel}
              </span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">Total Latency</span>
              <span className="text-sm font-mono font-bold text-sky-400 tabular-nums block">
                {gatewayResult.latencyMs} ms
              </span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">Tokens In / Out</span>
              <span className="text-sm font-mono font-bold text-slate-200 tabular-nums block">
                {gatewayResult.usage.prompt_tokens} / {gatewayResult.usage.completion_tokens}
              </span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">Estimated Cost</span>
              <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums block">
                ${gatewayResult.costUsd.toFixed(5)}
              </span>
            </div>
          </div>
        )}

        {/* Failover Chain Trace Notice */}
        {gatewayResult && gatewayResult.failoverSteps.length > 1 && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/70 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Automatic Failover Mesh Triggered ({gatewayResult.failoverSteps.length} hops)</span>
            </div>
            <div className="space-y-1.5 pl-6 text-xs font-mono">
              {gatewayResult.failoverSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-400">Hop #{idx + 1}:</span>
                  <span className="text-slate-200 font-bold">{step.modelId}</span>
                  {step.status === 'failed' ? (
                    <span className="text-rose-400 font-semibold">→ FAILED ({step.reason})</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">→ SUCCESSFUL ({step.latencyMs}ms)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Response Viewer */}
        <div className="bg-[#090E17] border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#070C14]">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white">Universal Output Stream</span>
              {isLoading && (
                <span className="text-sky-400 text-[11px] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" /> Streaming
                </span>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'preview' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Code & Text
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'json' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                OpenAI JSON
              </button>
              <button
                onClick={() => setViewMode('trace')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'trace' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hop Trace
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed bg-[#05080E]">
            {viewMode === 'preview' && (
              <div>
                {isLoading && !streamedText && (
                  <div className="h-full flex items-center justify-center text-slate-500 italic py-20">
                    Awaiting response from active model node...
                  </div>
                )}
                {streamedText && (
                  <div className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                    {streamedText}
                  </div>
                )}
                {!isLoading && !streamedText && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400">
                    <p className="font-sans text-sm font-bold text-white mb-1">Gateway Ready</p>
                    <p className="font-sans text-xs text-slate-400 max-w-sm">
                      Select primary target model, configure fallback chain, and dispatch request to observe real-time multi-provider execution.
                    </p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'json' && (
              <pre className="text-emerald-400 text-xs">
                {gatewayResult ? JSON.stringify(gatewayResult, null, 2) : '// Dispatch a request to inspect the raw OpenAI-compatible JSON payload.'}
              </pre>
            )}

            {viewMode === 'trace' && (
              <div className="space-y-4 font-sans">
                {gatewayResult ? (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 font-semibold">
                      Dispatched across <code className="text-sky-300 font-mono font-bold">{gatewayResult.failoverSteps.length}</code> node(s):
                    </div>
                    {gatewayResult.failoverSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs ${
                          step.status === 'success'
                            ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                            : 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">Step {idx + 1}: {MODELS_REGISTRY[step.modelId]?.name || step.modelId}</span>
                          <span className="font-mono font-bold tabular-nums">{step.latencyMs}ms</span>
                        </div>
                        <div className="text-xs opacity-90">
                          Status: <span className="uppercase font-bold">{step.status}</span>
                          {step.reason && <span className="block mt-1 font-mono text-[11px] text-rose-300">{step.reason}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-16 text-center">
                    No active trace available. Dispatch a request to view execution steps.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Snippets Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090E17] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Universal OpenAI Integration</h3>
                <p className="text-xs text-slate-400">Point your OpenAI SDK client to Playbeat Gateway for automatic fallback and cost metering.</p>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Snippet Tabs */}
            <div className="space-y-4 text-left">
              {/* cURL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">cURL Request</span>
                  <button
                    onClick={() => copyToClipboard(snippets.curl, 'curl')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedSnippet === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#05080E] border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto">
                  {snippets.curl}
                </pre>
              </div>

              {/* Python */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">Python (OpenAI SDK)</span>
                  <button
                    onClick={() => copyToClipboard(snippets.python, 'python')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedSnippet === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'python' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#05080E] border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto">
                  {snippets.python}
                </pre>
              </div>

              {/* TypeScript */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">Node.js / TypeScript (OpenAI SDK)</span>
                  <button
                    onClick={() => copyToClipboard(snippets.typescript, 'ts')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedSnippet === 'ts' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'ts' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-[#05080E] border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto">
                  {snippets.typescript}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
