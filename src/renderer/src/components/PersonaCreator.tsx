import React, { useState } from 'react';
import { Persona } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

interface PersonaCreatorProps {
  initialPersona?: Persona | null;
  onSave: (persona: Partial<Persona>) => void;
  onCancel: () => void;
}

const PersonaCreator: React.FC<PersonaCreatorProps> = ({ initialPersona, onSave, onCancel }) => {
  const [name, setName] = useState(initialPersona?.name || '');
  const [avatar, setAvatar] = useState(initialPersona?.avatar || '');
  const [interests, setInterests] = useState<string>((initialPersona?.interests || []).join(', ') || '');
  const [start, setStart] = useState(initialPersona?.schedule.start || '09:00');
  const [end, setEnd] = useState(initialPersona?.schedule.end || '17:00');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>(initialPersona?.intensity || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPersona: Partial<Persona> = {
      id: initialPersona?.id,
      name,
      avatar,
      interests: interests.split(',').map(s => s.trim()).filter(s => s.length > 0),
      schedule: {
        start,
        end,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] // Hardcoded for now
      },
      intensity,
      isActive: false
    };
    onSave(newPersona);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={onCancel} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      
      <h1 className="text-2xl font-bold mb-6">{initialPersona ? 'Edit Persona' : 'Create New Persona'}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            placeholder="e.g. Midwest Mom"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL (Optional)</label>
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Interests (comma separated)</label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white h-24"
            placeholder="e.g. Gardening, Cooking, Local News, Weather"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Intensity</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as any)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
          >
            <option value="low">Low (Few searches/day)</option>
            <option value="medium">Medium (Regular browsing)</option>
            <option value="high">High (Heavy activity)</option>
          </select>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2"
          >
            <Save size={18} /> Save Persona
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonaCreator;
