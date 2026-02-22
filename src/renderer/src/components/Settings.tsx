import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, EyeOff, Plus, X } from 'lucide-react';
import { Settings as SettingsType } from '../types';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [safeList, setSafeList] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.api.getSettings().then((s: SettingsType) => {
      setApiKey(s.apiKey || '');
      setKillSwitch(s.killSwitch || false);
      setSafeList(s.safeList || []);
    });
  }, []);

  const handleSave = async () => {
    await window.api.saveSettings({ apiKey, killSwitch, safeList });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addDomain = () => {
    const trimmed = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (trimmed && !safeList.includes(trimmed)) {
      setSafeList([...safeList, trimmed]);
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setSafeList(safeList.filter(d => d !== domain));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-8">
        {/* API Key */}
        <div className="bg-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">Gemini API Key</h2>
          <p className="text-sm text-gray-400 mb-3">Required for AI-generated search queries.</p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 pr-10 text-white font-mono text-sm"
              placeholder="AIza..."
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Kill Switch */}
        <div className="bg-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Kill Switch</h2>
              <p className="text-sm text-gray-400">Immediately stops all active persona sessions.</p>
            </div>
            <button
              onClick={() => setKillSwitch(v => !v)}
              className={`relative w-14 h-7 rounded-full transition-colors ${killSwitch ? 'bg-red-600' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${killSwitch ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
          {killSwitch && (
            <p className="mt-3 text-sm text-red-400 font-medium">Kill switch is ON — all agents are halted.</p>
          )}
        </div>

        {/* Safe List */}
        <div className="bg-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">Safe List</h2>
          <p className="text-sm text-gray-400 mb-3">
            When non-empty, personas will only visit sites from this list. Leave empty to allow any site.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDomain()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
              placeholder="e.g. wikipedia.org"
            />
            <button
              onClick={addDomain}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-1 text-sm"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {safeList.map(domain => (
              <span
                key={domain}
                className="flex items-center gap-1 bg-gray-700 text-gray-200 text-sm px-2 py-1 rounded"
              >
                {domain}
                <button onClick={() => removeDomain(domain)} className="text-gray-400 hover:text-red-400 ml-1">
                  <X size={12} />
                </button>
              </span>
            ))}
            {safeList.length === 0 && (
              <span className="text-sm text-gray-500 italic">No domains — all sites allowed</span>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-2 rounded flex items-center gap-2 font-medium transition-colors ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save size={18} /> {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
