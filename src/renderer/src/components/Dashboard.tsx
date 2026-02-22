import React, { useEffect, useRef, useState } from 'react';
import { Persona, Metrics } from '../types';
import { Play, Square, Plus, Trash2, Search, Globe, MousePointer, AlignLeft } from 'lucide-react';

interface ActivityEntry {
  id: number;
  personaName: string;
  type: 'search' | 'visit' | 'scroll' | 'start' | 'stop';
  details: string;
  timestamp: string;
}

interface DashboardProps {
  onEditPersona: (persona: Persona) => void;
  onCreatePersona: () => void;
}

const activityIcon = (type: ActivityEntry['type']) => {
  switch (type) {
    case 'search':  return <Search size={13} className="text-blue-400" />;
    case 'visit':   return <Globe size={13} className="text-green-400" />;
    case 'scroll':  return <AlignLeft size={13} className="text-gray-400" />;
    case 'start':   return <Play size={13} className="text-emerald-400" />;
    case 'stop':    return <Square size={13} className="text-red-400" />;
  }
};

const Dashboard: React.FC<DashboardProps> = ({ onEditPersona, onCreatePersona }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const activityCounter = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!window.api) return;
    const p = await window.api.getPersonas();
    setPersonas(p);
    const m = await window.api.getMetrics();
    setMetrics(m);
  };

  useEffect(() => {
    if (!window.api) return;
    loadData();
    const interval = setInterval(loadData, 5000);

    const unsub = window.api.onAgentActivity((activity: any) => {
      const entry: ActivityEntry = {
        id: activityCounter.current++,
        personaName: activity.personaName || activity.personaId,
        type: activity.type,
        details: activity.details,
        timestamp: new Date().toLocaleTimeString()
      };
      setActivityLog(prev => [...prev.slice(-99), entry]);
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog]);

  const handleStart = async (id: string) => {
    await window.api.startAgent(id);
    loadData();
  };

  const handleStop = async (id: string) => {
    await window.api.stopAgent(id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      await window.api.deletePersona(id);
      loadData();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FogOfYou Dashboard</h1>
        <button
          onClick={onCreatePersona}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} /> New Persona
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Queries</h3>
          <p className="text-2xl font-bold">{metrics?.totalQueries ?? 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Unique Domains</h3>
          <p className="text-2xl font-bold">{metrics?.uniqueDomains?.length ?? 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Entropy Score</h3>
          <p className="text-2xl font-bold text-green-400">{metrics?.entropyScore?.toFixed(2) ?? '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Personas */}
        <div className="xl:col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Personas</h2>
          {personas.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
              No personas yet. Create one to get started.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map(persona => (
              <div key={persona.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{persona.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {persona.interests.slice(0, 3).join(', ')}{persona.interests.length > 3 ? '…' : ''}
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      persona.intensity === 'high' ? 'bg-red-900/50 text-red-300' :
                      persona.intensity === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {persona.intensity}
                    </span>
                  </div>
                  <div className={`w-3 h-3 rounded-full mt-1 ${persona.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => persona.isActive ? handleStop(persona.id) : handleStart(persona.id)}
                    className={`flex-1 py-2 rounded flex justify-center items-center gap-2 text-sm ${
                      persona.isActive
                        ? 'bg-red-900/50 text-red-200 hover:bg-red-900/70'
                        : 'bg-green-900/50 text-green-200 hover:bg-green-900/70'
                    }`}
                  >
                    {persona.isActive ? <><Square size={14} /> Stop</> : <><Play size={14} /> Start</>}
                  </button>
                  <button
                    onClick={() => onEditPersona(persona)}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(persona.id)}
                    className="bg-gray-700 hover:bg-red-900/50 text-red-400 p-2 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Live Activity</h2>
          <div className="bg-gray-800 rounded-lg h-80 xl:h-full max-h-96 overflow-y-auto p-3 space-y-1.5">
            {activityLog.length === 0 && (
              <p className="text-gray-600 text-sm italic text-center mt-8">
                Waiting for activity...
              </p>
            )}
            {activityLog.map(entry => (
              <div key={entry.id} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 shrink-0 mt-0.5">{entry.timestamp}</span>
                <span className="shrink-0 mt-0.5">{activityIcon(entry.type)}</span>
                <span className="text-gray-300 break-all">
                  <span className="text-blue-300 font-medium">{entry.personaName}</span>
                  {' — '}{entry.details}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
