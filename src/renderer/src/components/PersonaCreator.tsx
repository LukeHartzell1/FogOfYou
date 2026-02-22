import React, { useState } from 'react';
import { Persona } from '../types';
import { PERSONA_TEMPLATES, PersonaTemplate } from '../personaTemplates';
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
  const [days, setDays] = useState<string[]>(initialPersona?.schedule.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>(initialPersona?.intensity || 'medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const applyTemplate = (template: PersonaTemplate) => {
    setName(template.name);
    setAvatar(template.avatar);
    setInterests(template.interests.join(', '));
    setStart(template.schedule.start);
    setEnd(template.schedule.end);
    setDays(template.schedule.days);
    setIntensity(template.intensity);
    setSelectedTemplate(template.name);
  };

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
        days,
      },
      intensity,
      isActive: false
    };
    onSave(newPersona);
  };

  const isEditing = !!initialPersona;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={onCancel} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Persona' : 'Create New Persona'}</h1>

      {/* Template picker — only show when creating */}
      {!isEditing && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Start from a template</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERSONA_TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTemplate(t)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedTemplate === t.name
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <span className="text-2xl block mb-1">{t.avatar}</span>
                <span className="text-sm font-medium block">{t.name}</span>
                <span className="text-xs text-gray-500 block mt-1">{t.interests.length} interests</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
          <label className="block text-sm font-medium text-gray-400 mb-1">Avatar (emoji or URL)</label>
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
            placeholder="👩‍🍳 or https://..."
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Active Days</label>
          <div className="flex gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() =>
                  setDays((prev) =>
                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                  )
                }
                className={`px-3 py-1 rounded text-sm ${
                  days.includes(day)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}
              >
                {day}
              </button>
            ))}
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
