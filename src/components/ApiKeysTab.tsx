import React, { useState } from 'react';
import { VirtualApiKey } from '../lib/types';
import { INITIAL_VIRTUAL_KEYS, MODELS_REGISTRY } from '../lib/registry';
import { sound } from '../lib/audio';
import { KeyRound, Plus, Copy, Check, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

export const ApiKeysTab: React.FC = () => {
  const [keys, setKeys] = useState<VirtualApiKey[]>(INITIAL_VIRTUAL_KEYS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newSpendLimit, setNewSpendLimit] = useState('100');
  const [selectedAllowedModels, setSelectedAllowedModels] = useState<string[]>([
    'claude-3-5-sonnet-20241022',
    'gemini-2.5-flash',
    'gpt-4o'
  ]);

  const availableModels = Object.values(MODELS_REGISTRY);

  const handleCopyKey = (key: VirtualApiKey) => {
    sound.playKey(840);
    navigator.clipboard.writeText(`pb-live-${key.id}-${Math.random().toString(36).substring(2, 10)}`);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleToggleActive = (id: string) => {
    sound.playKey(520);
    setKeys(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k));
  };

  const handleRevoke = (id: string) => {
    sound.playDenied();
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    sound.playGranted();

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newKey: VirtualApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix: `pb-live-${randomSuffix}...`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      monthlySpend: 0.00,
      spendLimit: parseFloat(newSpendLimit) || 100,
      allowedModels: selectedAllowedModels,
      active: true
    };

    setKeys(prev => [newKey, ...prev]);
    setShowCreateModal(false);
    setNewKeyName('');
    setNewSpendLimit('100');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header and Action Card */}
      <div className="bg-[#0D1522] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Virtual Gateway API Keys</h2>
          <p className="text-xs text-slate-400">
            Issue scoped, spend-capped virtual credentials (<code className="text-sky-400 font-mono">pb-live-xxxx</code>) that route across all configured model providers.
          </p>
        </div>
        <button
          onClick={() => {
            sound.playKey(660);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Virtual Key</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {keys.map((k) => {
          const spendPct = Math.min(100, (k.monthlySpend / k.spendLimit) * 100);
          return (
            <div
              key={k.id}
              className={`p-5 rounded-xl border transition-all ${
                k.active
                  ? 'bg-[#0D1522] border-slate-800 shadow-sm'
                  : 'bg-[#080E17]/60 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">{k.name}</h3>
                    <span className="text-[11px] font-mono text-slate-500">Created {k.createdAt}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  k.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {k.active ? 'ACTIVE' : 'REVOKED'}
                </span>
              </div>

              {/* Key Value & Copy Box */}
              <div className="flex items-center justify-between p-2.5 bg-[#080E17] rounded-lg border border-slate-800 mb-4 font-mono text-xs">
                <span className="text-slate-300">{k.keyPrefix}</span>
                <button
                  onClick={() => handleCopyKey(k)}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  {copiedKeyId === k.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKeyId === k.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Spend Meter */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Monthly Usage</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    ${k.monthlySpend.toFixed(2)} / ${k.spendLimit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      spendPct > 85 ? 'bg-rose-500' : spendPct > 60 ? 'bg-amber-400' : 'bg-sky-500'
                    }`}
                    style={{ width: `${spendPct}%` }}
                  />
                </div>
              </div>

              {/* Allowed models preview */}
              <div className="mb-4">
                <span className="text-[11px] text-slate-400 block mb-1">Scoped Models ({k.allowedModels.length})</span>
                <div className="flex flex-wrap gap-1">
                  {k.allowedModels.slice(0, 3).map((mId) => (
                    <span key={mId} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300">
                      {MODELS_REGISTRY[mId]?.name.split(' ')[0] || mId}
                    </span>
                  ))}
                  {k.allowedModels.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">+{k.allowedModels.length - 3} more</span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleActive(k.id)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {k.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1522] border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Generate Virtual Gateway Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Key Description / Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Production Mobile App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-[#080E17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Budget Cap (USD)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={newSpendLimit}
                  onChange={(e) => setNewSpendLimit(e.target.value)}
                  className="w-full bg-[#080E17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Permitted Models</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableModels.map(m => {
                    const checked = selectedAllowedModels.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded bg-[#080E17] border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                      >
                        <span className="text-slate-200">{m.name}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedAllowedModels(prev =>
                              e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                            );
                          }}
                          className="w-3.5 h-3.5 accent-sky-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                Create Virtual Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
