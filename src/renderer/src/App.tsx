import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import PersonaCreator from './components/PersonaCreator'
import Settings from './components/Settings'
import { Persona } from './types'
import { LayoutDashboard, UserPlus, Settings as Cog, Cloud, Cpu, Sparkles } from 'lucide-react'

type View = 'dashboard' | 'create' | 'edit' | 'settings'

const NAV = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'create',    label: 'Personas', icon: UserPlus },
  { id: 'settings',  label: 'Preferences', icon: Cog },
] as const

function App(): React.JSX.Element {
  const [view, setView]   = useState<View>('dashboard')
  const [editing, setEditing] = useState<Persona | null>(null)

  const goTo = (v: View) => { setEditing(null); setView(v) }

  const onEditPersona = (p: Persona) => { setEditing(p); setView('edit') }
  const onCreatePersona = () => { setEditing(null); setView('create') }
  const onSave = async (p: Partial<Persona>) => {
    await window.api.savePersona(p)
    goTo('dashboard')
  }

  const activeNav = view === 'edit' ? 'create' : view

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 flex flex-col h-full depth-panel" style={{ background: 'linear-gradient(180deg, var(--surface-3) 0%, var(--surface) 100%)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-glow)' }}>
            <Cloud size={18} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>FogOfYou</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>Friendly Privacy Helper</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id
            return (
              <button
                key={id}
                onClick={() => goTo(id as View)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? 'var(--blue-dim)' : 'transparent',
                  color: active ? 'var(--blue)' : 'var(--text-2)',
                  border: active ? '1px solid var(--blue-glow)' : '1px solid transparent',
                }}
              >
                <Icon size={16} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--blue)' }} />}
              </button>
            )
          })}
        </nav>

        {/* Status badge */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="rounded-lg px-3 py-2.5 card-gradient depth-card" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                <Cpu size={11} className="inline mr-1" />System
              </span>
              <span className="w-2 h-2 rounded-full status-pulse" style={{ background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px rgba(62,207,142,0.5)' }} />
            </div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>Ready and protecting</div>
          </div>
          <div className="rounded-lg px-3 py-2.5 mt-2" style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.25)' }}>
            <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--teal)' }}>
              <Sparkles size={12} />
              Tip of the day
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
              Start with 2 personas and medium intensity for realistic blending.
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle top-right gradient */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 100% 0%, rgba(79,126,248,0.06) 0%, transparent 70%)' }} />
        <div className="relative z-10 p-8 max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard onEditPersona={onEditPersona} onCreatePersona={onCreatePersona} />}
          {(view === 'create' || view === 'edit') && <PersonaCreator initialPersona={editing} onSave={onSave} onCancel={() => goTo('dashboard')} />}
          {view === 'settings' && <Settings onBack={() => goTo('dashboard')} />}
        </div>
      </main>
    </div>
  )
}

export default App
