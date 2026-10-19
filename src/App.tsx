import React, { useState } from 'react';
import { SecurityOperator, GatewayResponse, GatewayLog } from './lib/types';
import { OPERATORS, INITIAL_LOGS } from './lib/registry';
import { GatefitGateway } from './components/GatefitGateway';
import { PlaygroundTab } from './components/PlaygroundTab';
import { ModelsTab } from './components/ModelsTab';
import { ApiKeysTab } from './components/ApiKeysTab';
import { LogsTab } from './components/LogsTab';
import { sound } from './lib/audio';
import { ShieldCheck, Lock, Activity, Cpu, Zap, DollarSign } from 'lucide-react';

export default function App() {
  // Authentication & Mode State (Default Preview Enabled)
  const [activeOperator, setActiveOperator] = useState<SecurityOperator | null>(OPERATORS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Dashboard navigation tab
  const [activeTab, setActiveTab] = useState<'playground' | 'models' | 'keys' | 'logs'>('playground');

  // Gateway live logs state
  const [logs, setLogs] = useState<GatewayLog[]>(INITIAL_LOGS);

  // When a request completes in playground, append real-time log
  const handleLogGenerated = (response: GatewayResponse, requestedModel: string, promptText: string) => {
    const newLog: GatewayLog = {
      id: response.id,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      requestedModel,
      resolvedModel: response.resolvedModel,
      latencyMs: response.latencyMs,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      estimatedCost: response.costUsd,
      status: 200,
      failoverCount: response.failoverSteps.filter(s => s.status === 'failed').length,
      routeStrategy: 'priority',
      requestPreview: promptText,
      responsePreview: response.choices[0]?.message.content || ''
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Gatefit holographic access checkpoint
  if (!isAuthenticated) {
    return (
      <GatefitGateway
        onAuthorized={(operator) => {
          setActiveOperator(operator);
          setIsAuthenticated(true);
        }}
        onBypass={() => {
          setActiveOperator(OPERATORS[0]);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Calculate live aggregate metrics
  const totalRequests = logs.length;
  const failoverHops = logs.filter(l => l.failoverCount > 0).length;
  const avgLatency = Math.round(logs.reduce((acc, l) => acc + l.latencyMs, 0) / Math.max(1, logs.length));
  const totalSpend = logs.reduce((acc, l) => acc + l.estimatedCost, 0);

  return (
    <div className="min-h-screen bg-[#05080E] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Bar Contract (Wordmark, Nav links, Action) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-8 py-4 border-b border-slate-800/80 bg-[#05080E]/90 backdrop-blur-md">
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/25">
            PB
          </div>
          <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap">
            Playbeat Gateway
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#090E17] border border-slate-800 rounded-xl text-xs font-semibold">
          {[
            { id: 'playground' as const, label: 'Playground' },
            { id: 'models' as const, label: 'Model Routing' },
            { id: 'keys' as const, label: 'Virtual Keys' },
            { id: 'logs' as const, label: `Gateway Logs (${logs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                sound.playKey(580);
              }}
              className={`px-4 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {activeOperator && (
            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_0_10px_#38BDF8]">
              <img 
                src={activeOperator.imageUrl} 
                alt="Active Node" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          <button
            onClick={() => {
              sound.playKey(420);
              setIsAuthenticated(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Gate</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Real-Time Flash Electric KPI Telemetry */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-sky-500/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-400 opacity-60 group-hover:opacity-100 shadow-[0_0_8px_#38BDF8]" />
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Gateway Traffic</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalRequests.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Dispatched Requests</span>
          </div>

          <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 opacity-60 group-hover:opacity-100 shadow-[0_0_8px_#10B981]" />
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Failover Recovery</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
              99.98%
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{failoverHops} Hops Recovered</span>
          </div>

          <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-400 opacity-60 group-hover:opacity-100 shadow-[0_0_8px_#A855F7]" />
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Latency Hedging</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {avgLatency} ms
            </div>
            <span className="text-[11px] text-slate-500 font-mono">P95 Mesh Velocity</span>
          </div>

          <div className="bg-[#090E17] border border-slate-800 rounded-2xl p-4 text-left relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 opacity-60 group-hover:opacity-100 shadow-[0_0_8px_#F59E0B]" />
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Inference Cost</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 tabular-nums">
              ${totalSpend.toFixed(4)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Metering Active</span>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center gap-1 p-1 bg-[#090E17] border border-slate-800 rounded-xl text-xs overflow-x-auto">
          {[
            { id: 'playground' as const, label: 'Playground' },
            { id: 'models' as const, label: 'Routing' },
            { id: 'keys' as const, label: 'Keys' },
            { id: 'logs' as const, label: `Logs (${logs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                sound.playKey(580);
              }}
              className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Panel */}
        <div className="transition-opacity duration-200">
          {activeTab === 'playground' && (
            <PlaygroundTab onLogGenerated={handleLogGenerated} />
          )}

          {activeTab === 'models' && (
            <ModelsTab />
          )}

          {activeTab === 'keys' && (
            <ApiKeysTab />
          )}

          {activeTab === 'logs' && (
            <LogsTab logs={logs} onClearLogs={handleClearLogs} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-8 py-4 border-t border-slate-800/80 bg-[#05080E] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Playbeat Gateway v3.2</span>
          <span>·</span>
          <span>OpenAI-Compatible Universal Mesh</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-sky-400 hover:underline"
          >
            Switch Holographic Node
          </button>
        </div>
      </footer>
    </div>
  );
}
