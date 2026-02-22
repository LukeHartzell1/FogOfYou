import React, { useEffect, useState } from 'react'
import { Save, Eye, EyeOff, Plus, X, Key, Power, Globe, Shield, ArrowLeft, CheckCircle2, Info } from 'lucide-react'
import { Settings as SettingsType } from '../types'

interface Props { onBack: () => void }

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
}

function SectionCard({ icon: Icon, iconColor, title, subtitle, children }: {
  icon: React.ElementType; iconColor: string; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}1a`, border: `1px solid ${iconColor}40` }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

const Settings: React.FC<Props> = ({ onBack }) => {
  const [apiKey,     setApiKey]     = useState('')
  const [showKey,    setShowKey]    = useState(false)
  const [killSwitch, setKillSwitch] = useState(false)
  const [safeList,   setSafeList]   = useState<string[]>([])
  const [newDomain,  setNewDomain]  = useState('')
  const [saved,      setSaved]      = useState(false)

  useEffect(() => {
    window.api.getSettings().then((s: SettingsType) => {
      setApiKey(s.apiKey ?? '')
      setKillSwitch(s.killSwitch ?? false)
      setSafeList(s.safeList ?? [])
    })
  }, [])

  const handleSave = async () => {
    await window.api.saveSettings({ apiKey, killSwitch, safeList })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addDomain = () => {
    const trimmed = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (trimmed && !safeList.includes(trimmed)) { setSafeList(l => [...l, trimmed]); setNewDomain('') }
  }

  return (
    <div className="max-w-2xl mx-auto fade-up">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-3)', background: 'var(--surface)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Preferences</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Simple controls to keep your privacy sessions safe and predictable.</p>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.25)' }}>
        <Info size={17} className="mt-0.5" style={{ color: 'var(--teal)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Tip: Keep your safe domain list focused on low-risk sites (news, recipes, hobbies, education) so your cover browsing stays safe and believable.
        </p>
      </div>

      <div className="space-y-5">

        {/* API Key */}
        <SectionCard icon={Key} iconColor="var(--amber)" title="AI Key" subtitle="Lets the app create natural-looking cover activity">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace', paddingRight: '40px' }}
              placeholder="AIza..."
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')}
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-2.5 p-1 rounded transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <Shield size={11} /> Stored locally on your device
          </p>
        </SectionCard>

        {/* Kill Switch */}
        <SectionCard
          icon={Power}
          iconColor={killSwitch ? 'var(--red)' : 'var(--text-3)'}
          title="Emergency Stop"
          subtitle="Immediately stop all active persona sessions"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: killSwitch ? 'var(--red)' : 'var(--text-3)' }}>
              {killSwitch ? '⚠ All agents are halted.' : 'Agents will run on schedule.'}
            </p>
            <button
              onClick={() => setKillSwitch(v => !v)}
              className="relative rounded-full transition-all duration-300"
              style={{
                width: '52px', height: '28px',
                background: killSwitch ? 'var(--red)' : 'var(--border-2)',
                boxShadow: killSwitch ? '0 0 14px rgba(248,113,113,0.4)' : 'none',
                border: '1px solid transparent',
              }}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-300"
                style={{ width: '22px', height: '22px', left: killSwitch ? 'calc(100% - 24px)' : '2px' }}
              />
            </button>
          </div>
        </SectionCard>

        {/* Safe List */}
        <SectionCard icon={Globe} iconColor="var(--green)" title="Safe Domain List" subtitle="Only allow visits to websites you trust">
          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDomain()}
              style={inputStyle}
              placeholder="e.g. wikipedia.org"
              onFocus={e => (e.target.style.borderColor = 'var(--green)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')}
            />
            <button onClick={addDomain}
              className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 flex items-center gap-1.5 transition-opacity"
              style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(62,207,142,0.25)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="min-h-12 rounded-lg p-3 flex flex-wrap gap-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {safeList.length === 0
              ? <span className="text-xs italic" style={{ color: 'var(--text-3)' }}>No restrictions — all domains allowed</span>
              : safeList.map(d => (
                <span key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}>
                  {d}
                  <button onClick={() => setSafeList(l => l.filter(x => x !== d))}
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                    <X size={11} />
                  </button>
                </span>
              ))
            }
          </div>
        </SectionCard>
      </div>

      {/* Save bar */}
      <div className="flex justify-end mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: saved ? 'var(--green)' : 'var(--blue)',
            color: '#fff',
            boxShadow: saved ? '0 0 20px rgba(62,207,142,0.3)' : '0 0 20px var(--blue-glow)',
            transform: saved ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save Preferences</>}
        </button>
      </div>
    </div>
  )
}

export default Settings
