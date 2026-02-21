import React, { useEffect, useState } from 'react';
import { Persona, Metrics } from '../types';
import { Play, Square, Plus, Trash2 } from 'lucide-react';

interface DashboardProps {
  onEditPersona: (persona: Persona) => void;
  onCreatePersona: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEditPersona, onCreatePersona }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const loadData = async () => {
    const p = await window.api.getPersonas();
    setPersonas(p);
    const m = await window.api.getMetrics();
    setMetrics(m);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

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
          <p className="text-2xl font-bold">{metrics?.totalQueries || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Unique Domains</h3>
          <p className="text-2xl font-bold">{metrics?.uniqueDomains?.length || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Entropy Score</h3>
          <p className="text-2xl font-bold text-green-400">{metrics?.entropyScore?.toFixed(2) || 0}</p>
        </div>
      </div>

      {/* Personas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map(persona => (
          <div key={persona.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{persona.name}</h3>
                <p className="text-sm text-gray-400">{persona.interests.slice(0, 3).join(', ')}...</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${persona.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => persona.isActive ? handleStop(persona.id) : handleStart(persona.id)}
                className={`flex-1 py-2 rounded flex justify-center items-center gap-2 ${
                  persona.isActive 
                    ? 'bg-red-900/50 text-red-200 hover:bg-red-900/70' 
                    : 'bg-green-900/50 text-green-200 hover:bg-green-900/70'
                }`}
              >
                {persona.isActive ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
              </button>
              <button
                onClick={() => onEditPersona(persona)}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(persona.id)}
                className="bg-gray-700 hover:bg-red-900/50 text-red-400 p-2 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
