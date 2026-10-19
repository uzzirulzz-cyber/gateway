import React, { useState } from 'react';
import { ModelConfig } from '../lib/types';
import { MODELS_REGISTRY } from '../lib/registry';
import { sound } from '../lib/audio';
import { 
  Zap, 
  ShieldCheck, 
  Coins, 
  Cpu, 
  Check, 
  Sliders, 
  LayoutGrid, 
  List, 
  Activity, 
  Sparkles, 
  Flame,
  ArrowUpRight
} from 'lucide-react';

export const ModelsTab: React.FC = () => {
  const [models, setModels] = useState<Record<string, ModelConfig>>(MODELS_REGISTRY);
  const [routingStrategy, setRoutingStrategy] = useState<'priority' | 'latency' | 'cost'>('priority');
  const [timeoutMs, setTimeoutMs] = useState(1200);
  const [retryCount, setRetryCount] = useState(2);
  const [savedNotice, setSavedNotice] = useState(false);
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  const handleToggleStatus = (modelId: string) => {
    sound.playKey(620);
    setModels(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        status: prev[modelId].status === 'operational' ? 'degraded' : 'operational'
      }
    }));
  };

  const handleSavePolicy = () => {
    sound.playGranted();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const modelList = Object.values(models);

  return (
    <div className="space-y-6 text-left">
      {/* Global Dispatch Strategy Card */}
      <div className="bg-[#0B1019] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Electric decorative glow behind header */}
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-sky-500/10 blur-[90px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                ACTIVE MULTI-PROVIDER ROUTER
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Global Routing & Failover Fabric</h2>
            <p className="text-xs text-slate-400">Controls how incoming OpenAI-compatible tokens are hedged and dispatched across providers.</p>
          </div>

          <button
            onClick={handleSavePolicy}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all whitespace-nowrap active:scale-95"
          >
            {savedNotice ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{savedNotice ? 'Routing Fabric Updated' : 'Deploy Routing Policy'}</span>
          </button>
        </div>

        {/* 3 Electric Strategy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
          {[
            {
              id: 'priority' as const,
              title: 'Strict Priority Fallback',
              icon: ShieldCheck,
              tag: 'RELIABILITY FIRST',
              color: '#38BDF8',
              desc: 'Directs all traffic to your designated flagship model (Claude 3.5 Sonnet or GPT-4o). Transparently trips down the chain on upstream 429 or 503.'
            },
            {
              id: 'latency' as const,
              title: 'Flash Latency Hedging',
              icon: Zap,
              tag: 'SUB-200MS TARGET',
              color: '#10B981',
              desc: 'Continuously monitors provider P95 latency. Automatically reroutes agent loops to highest-throughput nodes (e.g. Groq 420 TPS & Gemini 2.5 Flash).'
            },
            {
              id: 'cost' as const,
              title: 'Cost-Optimized Dispatch',
              icon: Coins,
              tag: 'TOKEN EFFICIENCY',
              color: '#F59E0B',
              desc: 'Selectively diverts eligible ingestion and reasoning tasks to low-cost nodes ($0.075/1M in), reducing monthly inference spend by up to 88%.'
            }
          ].map(strat => {
            const Icon = strat.icon;
            const active = routingStrategy === strat.id;
            return (
              <div
                key={strat.id}
                onClick={() => {
                  setRoutingStrategy(strat.id);
                  sound.playKey(540);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  active
                    ? 'bg-[#0E1726] border-sky-400 shadow-xl shadow-sky-500/15'
                    : 'bg-[#070C14]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#0B121E]'
                }`}
              >
                {/* Active electric top border line */}
                {active && (
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 shadow-[0_0_12px_#38BDF8]"
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ 
                      backgroundColor: `${strat.color}18`,
                      color: strat.color 
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span 
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                    style={{ 
                      backgroundColor: `${strat.color}15`,
                      color: strat.color 
                    }}
                  >
                    {strat.tag}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5">{strat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{strat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Sliders for timeout and retries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80 relative z-10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Provider Circuit Timeout (ms)</label>
              <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">{timeoutMs} ms</span>
            </div>
            <input
              type="range"
              min="400"
              max="5000"
              step="100"
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(parseInt(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">If upstream provider exceeds this budget, next failover hop is immediately tripped.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Max Failover Hops</label>
              <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">{retryCount} alternative nodes</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={retryCount}
              onChange={(e) => setRetryCount(parseInt(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">Maximum candidate models in chain to attempt before returning error.</p>
          </div>
        </div>
      </div>

      {/* Electric Model Cards Header & View Switcher */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Electric Model Nodes Grid</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              {modelList.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400">Frontier reasoning intelligence, Groq LPUs, and multi-modal throughput metrics.</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#090E17] border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setViewLayout('grid')}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              viewLayout === 'grid' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Electric Cards</span>
          </button>
          <button
            onClick={() => setViewLayout('table')}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              viewLayout === 'table' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Electric Bento Grid */}
      {viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modelList.map((m) => {
            const isOperational = m.status === 'operational';
            return (
              <div
                key={m.id}
                className="group relative bg-[#090E17] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl overflow-hidden flex flex-col justify-between"
                style={{
                  boxShadow: `0 4px 20px -2px rgba(0,0,0,0.5)`
                }}
              >
                {/* Electric top glow accent */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 opacity-80 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${m.electricColor}, transparent)`,
                    boxShadow: `0 0 15px ${m.electricColor}`
                  }}
                />

                {/* Subtle background glow */}
                <div 
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
                  style={{ backgroundColor: m.electricColor }}
                />

                {/* Card Top Row: Provider & Electric Badge */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: m.electricColor }}
                      />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        {m.provider}
                      </span>
                    </div>

                    <span 
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold tracking-wider"
                      style={{
                        backgroundColor: `${m.electricColor}18`,
                        color: m.electricColor,
                        border: `1px solid ${m.electricColor}35`
                      }}
                    >
                      {m.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors mb-1">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {m.description}
                  </p>

                  {/* Frequency Wave & Throughput Meter */}
                  <div className="p-3 bg-[#05080E] border border-slate-800/80 rounded-xl mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* 4 Animated Frequency Bars */}
                      <div className="flex items-end gap-1 h-5 w-7">
                        <div className="w-1 bg-sky-400 rounded-sm freq-bar-1" />
                        <div className="w-1 bg-emerald-400 rounded-sm freq-bar-2" />
                        <div className="w-1 bg-sky-400 rounded-sm freq-bar-3" />
                        <div className="w-1 bg-amber-400 rounded-sm freq-bar-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Throughput</span>
                        <span className="text-xs font-mono font-bold text-white tabular-nums">
                          {m.throughputTps} TPS
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Codex Index</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                        {m.benchmarkScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Metric Chips Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Context Capacity</span>
                      <span className="font-mono text-slate-200 font-bold tabular-nums">
                        {(m.contextWindow / 1000).toLocaleString()}k
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block mb-0.5">P95 Latency</span>
                      <span className="font-mono text-sky-400 font-bold tabular-nums">
                        {m.avgLatencyMs} ms
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Input / 1M</span>
                      <span className="font-mono text-slate-300 font-bold tabular-nums">
                        ${m.inputCostPer1M.toFixed(3)}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Output / 1M</span>
                      <span className="font-mono text-slate-300 font-bold tabular-nums">
                        ${m.outputCostPer1M.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOperational ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-amber-400'}`} />
                    <span className={`text-[11px] font-semibold capitalize ${isOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {m.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(m.id)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
                  >
                    {isOperational ? 'Simulate Outage' : 'Restore Online'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Table View */
        <div className="bg-[#090E17] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#060A12] text-slate-400 font-semibold">
                  <th className="py-3 px-4">Model & Provider</th>
                  <th className="py-3 px-4">Throughput</th>
                  <th className="py-3 px-4">Context Window</th>
                  <th className="py-3 px-4 text-right">Cost (In / 1M)</th>
                  <th className="py-3 px-4 text-right">Cost (Out / 1M)</th>
                  <th className="py-3 px-4 text-right">Latency</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {modelList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.electricColor }} />
                        <div>
                          <span className="font-bold text-white block">{m.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 uppercase">{m.provider}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                      {m.throughputTps} TPS
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                      {(m.contextWindow / 1000).toLocaleString()}k
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">
                      ${m.inputCostPer1M.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">
                      ${m.outputCostPer1M.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sky-400 tabular-nums font-semibold">
                      {m.avgLatencyMs} ms
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        m.status === 'operational' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          m.status === 'operational' ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-amber-400'
                        }`} />
                        <span className="capitalize">{m.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(m.id)}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
                      >
                        {m.status === 'operational' ? 'Degrade' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
