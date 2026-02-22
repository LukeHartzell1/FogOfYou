import React, { useState } from 'react'
import { Persona } from '../types'
import { ArrowLeft, Save, Hash, Clock, Sparkles, Info } from 'lucide-react'

interface Props {
  initialPersona?: Persona | null
  onSave: (p: Partial<Persona>) => void
  onCancel: () => void
}

const PRESETS = [
  { name: 'Midwest Soccer Parent', interests: 'Youth Soccer, School Events, Minivan Reviews, Grocery Deals, Local News' },
  { name: 'Retired Home Hobbyist', interests: 'Woodworking, Home Improvement, Garden, Bird Watching, Classic Cars' },
  { name: 'Luxury Travel Planner', interests: 'Business Class Flights, Hotel Reviews, Fine Dining, City Guides, Concierge Tips' },
  { name: 'K-pop Superfan',        interests: 'K-pop News, Idol Groups, Concert Tickets, Korean Fashion, Fan Art' },
]

const INTENSITY_HELP = {
  low: 'Best for light background activity.',
  medium: 'Recommended default for most users.',
  high: 'Most aggressive noise generation.',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const PersonaCreator: React.FC<Props> = ({ initialPersona, onSave, onCancel }) => {
  const [name,      setName]      = useState(initialPersona?.name ?? '')
  const [avatar,    setAvatar]    = useState(initialPersona?.avatar ?? '')
  const [interests, setInterests] = useState((initialPersona?.interests ?? []).join(', '))
  const [start,     setStart]     = useState(initialPersona?.schedule.start ?? '19:00')
  const [end,       setEnd]       = useState(initialPersona?.schedule.end   ?? '23:00')
  const [intensity, setIntensity] = useState<'low'|'medium'|'high'>(initialPersona?.intensity ?? 'medium')

  const applyPreset = (p: { name: string; interests: string }) => {
    setName(p.name)
    setInterests(p.interests)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: initialPersona?.id,
      name,
      avatar,
      interests: interests.split(',').map(s => s.trim()).filter(Boolean),
      schedule: { start, end, days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      intensity,
      isActive: false,
    })
  }

  return (
    <div className="max-w-2xl mx-auto fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-3)', background: 'var(--surface)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            {initialPersona ? 'Edit Persona' : 'New Persona'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Build a safe “cover identity” that behaves differently than you.</p>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-glow)' }}>
        <Sparkles size={17} className="mt-0.5" style={{ color: 'var(--blue)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>Make personas feel real</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Use interests that naturally fit together (for example: recipes + home decor + local events).
          </p>
        </div>
      </div>

      {/* Presets (only when creating) */}
      {!initialPersona && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)', e.currentTarget.style.color = 'var(--blue)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)', e.currentTarget.style.color = 'var(--text-2)')}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Identity */}
        <section className="rounded-xl p-6 space-y-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--blue)' }}>Step 1 · Identity</p>

          <Field label="Persona Name">
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Midwest Soccer Parent" required
              onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')} />
          </Field>

          <Field label="Avatar URL (optional)">
            <input style={inputStyle} value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://example.com/avatar.png"
              onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')} />
          </Field>

          <Field label="Interests & Topics">
            <div className="relative">
              <Hash size={13} className="absolute left-3 top-3.5" style={{ color: 'var(--text-3)' }} />
              <textarea
                style={{ ...inputStyle, paddingLeft: '30px', minHeight: '90px', resize: 'vertical' }}
                value={interests}
                onChange={e => setInterests(e.target.value)}
                placeholder="Gardening, Cooking, Local News, Weather, DIY — comma separated"
                required
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>Comma-separated topics. These are used to generate realistic cover searches.</p>
          </Field>
        </section>

        {/* Behavior */}
        <section className="rounded-xl p-6 space-y-5 mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--purple)' }}>Step 2 · Behavior</p>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Start Time">
              <div className="relative">
                <Clock size={13} className="absolute left-3 top-3" style={{ color: 'var(--text-3)' }} />
                <input type="time" style={{ ...inputStyle, paddingLeft: '30px' }} value={start} onChange={e => setStart(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--purple)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')} />
              </div>
            </Field>

            <Field label="End Time">
              <div className="relative">
                <Clock size={13} className="absolute left-3 top-3" style={{ color: 'var(--text-3)' }} />
                <input type="time" style={{ ...inputStyle, paddingLeft: '30px' }} value={end} onChange={e => setEnd(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--purple)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')} />
              </div>
            </Field>

            <Field label="Intensity">
              <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={intensity} onChange={e => setIntensity(e.target.value as any)}
                onFocus={e => (e.target.style.borderColor = 'var(--purple)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')}>
                <option value="low">Low — Casual</option>
                <option value="medium">Medium — Regular</option>
                <option value="high">High — Heavy</option>
              </select>
              <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                <Info size={11} />
                {INTENSITY_HELP[intensity]}
              </p>
            </Field>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
            Cancel
          </button>
          <button type="submit" className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--blue)', color: '#fff', boxShadow: '0 0 20px var(--blue-glow)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Save size={15} /> Save Persona
          </button>
        </div>
      </form>
    </div>
  )
}

export default PersonaCreator
