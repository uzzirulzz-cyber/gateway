import React, { useState } from 'react';
import { GatewayLog } from '../lib/types';
import { MODELS_REGISTRY } from '../lib/registry';
import { sound } from '../lib/audio';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, X, Terminal, ArrowUpRight } from 'lucide-react';

export const LogsTab: React.FC<{
  logs: GatewayLog[];
  onClearLogs: () => void;
}> = ({ logs, onClearLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failover'>('all');
  const [selectedLog, setSelectedLog] = useState<GatewayLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.requestedModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resolvedModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.requestPreview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'failover') return log.failoverCount > 0;
    if (statusFilter === 'success') return log.failoverCount === 0 && log.status === 200;
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Control bar */}
      <div className="bg-[#0D1522] border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, prompt snippet, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080E17] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filter and Clear */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 p-1 bg-[#080E17] border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => {
                setStatusFilter('all');
                sound.playKey(500);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('success');
                sound.playKey(540);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'success' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => {
                setStatusFilter('failover');
                sound.playKey(580);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'failover' ? 'bg-slate-800 text-amber-300 font-medium' : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Failovers ({logs.filter(l => l.failoverCount > 0).length})
            </button>
          </div>

          <button
            onClick={() => {
              sound.playDenied();
              onClearLogs();
            }}
            className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0D1522] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#090F19] text-slate-400 font-semibold">
                <th className="py-3 px-4">Timestamp & ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Routing Path</th>
                <th className="py-3 px-4 text-right">Tokens</th>
                <th className="py-3 px-4 text-right">Latency</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No gateway traffic records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const reqModelName = MODELS_REGISTRY[log.requestedModel]?.name || log.requestedModel;
                  const resModelName = MODELS_REGISTRY[log.resolvedModel]?.name || log.resolvedModel;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => {
                        sound.playSelect();
                        setSelectedLog(log);
                      }}
                      className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-200 font-medium">{log.id}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{log.timestamp}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.failoverCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Failover ({log.failoverCount})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>200 OK</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300 font-medium">{reqModelName}</span>
                          {log.failoverCount > 0 && (
                            <>
                              <span className="text-slate-500">→</span>
                              <span className="text-sky-400 font-semibold">{resModelName}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{log.requestPreview}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {log.promptTokens + log.completionTokens}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sky-400 tabular-nums">
                        {log.latencyMs} ms
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 tabular-nums">
                        ${log.estimatedCost.toFixed(5)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[11px] text-slate-400 hover:text-sky-300 inline-flex items-center gap-0.5">
                          <span>Details</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspection Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1522] border border-slate-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white font-mono">{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diagnostic Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080E17] p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">HTTP Code</span>
                <span className="font-semibold text-emerald-400">200 OK</span>
              </div>
              <div>
                <span className="text-slate-500 block">Latency</span>
                <span className="font-mono text-sky-400 tabular-nums">{selectedLog.latencyMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">Prompt / Comp</span>
                <span className="font-mono text-slate-200 tabular-nums">{selectedLog.promptTokens} / {selectedLog.completionTokens}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Cost</span>
                <span className="font-mono text-emerald-400 tabular-nums">${selectedLog.estimatedCost.toFixed(5)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Request Prompt</span>
              <div className="p-3 bg-[#080E17] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-wrap">
                {selectedLog.requestPreview}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Response Output</span>
              <div className="p-3 bg-[#080E17] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-wrap">
                {selectedLog.responsePreview}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
