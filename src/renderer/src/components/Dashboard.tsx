import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Persona, Metrics } from '../types'
import { Play, Square, Plus, Trash2, Search, Globe, MousePointer, Activity, ShieldCheck, PencilLine, Info } from 'lucide-react'

interface ActivityEntry {
  id: number
  personaName: string
  type: 'search' | 'visit' | 'scroll' | 'start' | 'stop'
  details: string
  timestamp: string
}

interface DashboardProps {
  onEditPersona: (persona: Persona) => void
  onCreatePersona: () => void
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

function activityDot(type: ActivityEntry['type']) {
  const map = {
    search: 'var(--blue)',
    visit: 'var(--green)',
    scroll: 'var(--purple)',
    start: 'var(--green)',
    stop: 'var(--red)',
  }
  return map[type] ?? 'var(--text-3)'
}

function activityIcon(type: ActivityEntry['type']) {
  const cls = 'shrink-0 mt-0.5'
  const style = { color: activityDot(type) }
  switch (type) {
    case 'search': return <Search size={12} className={cls} style={style} />
    case 'visit': return <Globe size={12} className={cls} style={style} />
    case 'scroll': return <MousePointer size={12} className={cls} style={style} />
    case 'start': return <Play size={12} className={cls} style={style} />
    case 'stop': return <Square size={12} className={cls} style={style} />
  }
}

function RingMeter({
  label,
  value,
  color,
  helper,
}: {
  label: string
  value: number
  color: string
  helper: string
}) {
  const size = 98
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = clamp(value)
  const offset = circumference * (1 - pct / 100)
  const gradId = `grad-${label.replace(/\s+/g, '-')}`

  return (
    <div className="rounded-2xl p-3.5 card-gradient depth-card h-fit" style={{ border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{label}</p>
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        <div className="relative" style={{ width: size, height: size, filter: `drop-shadow(0 6px 14px ${color}35)` }}>
          <svg width={size} height={size}>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0.72" />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border)" strokeWidth="1.25" fill="none" strokeDasharray="3 6" opacity="0.6" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradId})`}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <p className="text-xl font-bold leading-none" style={{ color }}>{pct}%</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>score</p>
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-center max-w-[20ch]" style={{ color: 'var(--text-2)' }}>
          {helper}
        </p>
      </div>
    </div>
  )
}

function PersonaCard({
  persona,
  onStart,
  onStop,
  onEdit,
  onDelete,
}: {
  persona: Persona
  onStart: () => void
  onStop: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const active = persona.isActive
  const intensityColor = { low: 'var(--blue)', medium: 'var(--amber)', high: 'var(--red)' }[persona.intensity]
  const intensityBg = { low: 'var(--blue-dim)', medium: 'var(--amber-dim)', high: 'var(--red-dim)' }[persona.intensity]

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 fade-up depth-card"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${active ? 'rgba(62,207,142,0.25)' : 'var(--border)'}`,
        boxShadow: active ? '0 0 20px rgba(62,207,142,0.06)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: active ? 'rgba(62,207,142,0.12)' : 'var(--surface-2)', color: active ? 'var(--green)' : 'var(--text-2)', border: `1px solid ${active ? 'rgba(62,207,142,0.25)' : 'var(--border)'}` }}
          >
            {persona.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{persona.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full status-pulse" style={{ background: active ? 'var(--green)' : 'var(--text-3)', display: 'inline-block', boxShadow: active ? '0 0 6px rgba(62,207,142,0.5)' : 'none' }} />
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: active ? 'var(--green)' : 'var(--text-3)' }}>{active ? 'Active' : 'Idle'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)', e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)', e.currentTarget.style.background = 'transparent')}>
            <PencilLine size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)', e.currentTarget.style.background = 'var(--red-dim)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)', e.currentTarget.style.background = 'transparent')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="text-xs leading-relaxed truncate" style={{ color: 'var(--text-3)' }}>{persona.interests.join(' · ')}</p>

      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px]" style={{ background: intensityBg, color: intensityColor, border: `1px solid ${intensityColor}40` }}>
          {persona.intensity}
        </span>
        <span className="font-mono ml-auto" style={{ color: 'var(--text-3)' }}>{persona.schedule.start}–{persona.schedule.end}</span>
      </div>

      <button
        onClick={active ? onStop : onStart}
        className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
        style={{
          background: active ? 'var(--red-dim)' : 'var(--blue-dim)',
          color: active ? 'var(--red)' : 'var(--blue)',
          border: `1px solid ${active ? 'rgba(248,113,113,0.25)' : 'var(--blue-glow)'}`,
        }}
      >
        {active ? <><Square size={13} /> Stop Agent</> : <><Play size={13} /> Start Agent</>}
      </button>
    </div>
  )
}

const Dashboard: React.FC<DashboardProps> = ({ onEditPersona, onCreatePersona }) => {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [log, setLog] = useState<ActivityEntry[]>([])
  const counter = useRef(0)
  const logEnd = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!window.api) return
    const p = await window.api.getPersonas()
    const m = await window.api.getMetrics()
    setPersonas(p)
    setMetrics(m)
  }

  useEffect(() => {
    if (!window.api) return
    load()
    const iv = setInterval(load, 5000)
    const unsub = window.api.onAgentActivity((a: any) => {
      setLog(prev => [
        ...prev.slice(-99),
        {
          id: counter.current++,
          personaName: a.personaName ?? a.personaId,
          type: a.type,
          details: a.details,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])
    })
    return () => {
      clearInterval(iv)
      unsub()
    }
  }, [])

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const activeCount = personas.filter(p => p.isActive).length
  const fogApplied = clamp(Math.round((metrics?.entropyScore ?? 0) * 16 + (metrics?.totalQueries ?? 0) * 0.45))
  const riskScore = clamp(100 - fogApplied)
  const riskLabel = riskScore > 65 ? 'High' : riskScore > 35 ? 'Medium' : 'Low'
  const riskColor = riskScore > 65 ? 'var(--red)' : riskScore > 35 ? 'var(--amber)' : 'var(--green)'
  const fogLabel = fogApplied > 70 ? 'Strong' : fogApplied > 40 ? 'Moderate' : 'Early'
  const anonymityScore = clamp(
    Math.round(
      (metrics?.entropyScore ?? 0) * 21 +
      (metrics?.uniqueDomains?.length ?? 0) * 2.2 +
      activeCount * 8 +
      Math.min(personas.length, 5) * 4,
    ),
  )
  const anonymityLabel = anonymityScore > 75 ? 'High anonymity' : anonymityScore > 50 ? 'Moderate anonymity' : 'Low anonymity'
  const summaryLabel = useMemo(() => {
    if (fogApplied > 70) return 'Great privacy cover'
    if (fogApplied > 40) return 'Good progress'
    return 'Just getting started'
  }, [fogApplied])
  const queries = metrics?.totalQueries ?? 0
  const domains = metrics?.uniqueDomains?.length ?? 0

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col gap-4 overflow-y-auto overflow-x-hidden pr-1 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Your Privacy Home</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {activeCount > 0 ? `${activeCount} persona${activeCount > 1 ? 's are' : ' is'} currently active` : 'No personas are active right now'}
          </p>
        </div>
        <button
          onClick={onCreatePersona}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
          style={{ background: 'var(--blue)', color: '#fff', boxShadow: '0 0 20px var(--blue-glow)' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} /> Create Persona
        </button>
      </div>

      <div className="rounded-xl p-3 flex items-start gap-3 fade-up" style={{ background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.25)' }}>
        <Info size={18} style={{ color: 'var(--teal)' }} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--teal)' }}>At a glance</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            The app creates safe cover activity so trackers see mixed behavior instead of one clean personal profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <RingMeter label="Fog applied" value={fogApplied} color="var(--blue)" helper={`${fogLabel}. How much cover activity is active.`} />
          <RingMeter label="Privacy risk" value={riskScore} color={riskColor} helper={`${riskLabel} risk. Lower is better.`} />
        </div>

        <div className="xl:col-span-4 rounded-2xl p-3.5 card-gradient fade-up depth-card h-fit" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>General anonymity score</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-3xl font-bold leading-none" style={{ color: 'var(--text)' }}>{anonymityScore}</p>
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
              {anonymityLabel}
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
            {summaryLabel}. {activeCount > 0 ? `${activeCount} persona${activeCount > 1 ? 's' : ''} active` : 'Start a persona to improve score'}.
          </p>
          <div className="mt-3 h-2 rounded-full" style={{ background: 'var(--surface-2)' }}>
            <div className="h-2 rounded-full" style={{ width: `${anonymityScore}%`, background: 'linear-gradient(90deg, var(--blue), var(--teal))' }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <div className="rounded-lg p-2" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Cover searches</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--blue)' }}>{queries}</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Sites touched</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--green)' }}>{domains}</p>
            </div>
            <div className="rounded-lg p-2 col-span-2" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Active personas</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--teal)' }}>{activeCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Personas</h2>

          {personas.length === 0 && (
            <div className="rounded-xl p-10 text-center depth-card" style={{ background: 'var(--surface)', border: '2px dashed var(--border-2)' }}>
              <ShieldCheck size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
              <p className="font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No personas yet</p>
              <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Create your first persona to begin building privacy fog automatically.</p>
              <button onClick={onCreatePersona} className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>Create your first persona →</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {personas.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                onStart={async () => { await window.api.startAgent(p.id); load() }}
                onStop={async () => { await window.api.stopAgent(p.id); load() }}
                onEdit={() => onEditPersona(p)}
                onDelete={async () => { if (confirm('Delete this persona?')) { await window.api.deletePersona(p.id); load() } }}
              />
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Recent Activity</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--green)' }}>
              <span className="w-1.5 h-1.5 rounded-full status-pulse" style={{ background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 5px rgba(62,207,142,0.5)' }} />
              Updating
            </span>
          </div>

          <div className="rounded-xl overflow-hidden flex flex-col text-xs depth-panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-2)' }}>What the app is doing now</span>
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{log.length} updates</span>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-4 space-y-2.5">
              {log.length === 0 && (
                <p className="text-center mt-8" style={{ color: 'var(--text-3)' }}>
                  <Activity size={20} className="mx-auto mb-2 opacity-30" />
                  No activity yet — start a persona to begin.
                </p>
              )}
              {log.map((e) => (
                <div key={e.id} className="flex gap-2 items-start leading-relaxed fade-up rounded-lg p-2" style={{ background: 'var(--surface-2)' }}>
                  {activityIcon(e.type)}
                  <span style={{ color: 'var(--text-3)' }} className="shrink-0">{e.timestamp}</span>
                  <span className="font-semibold shrink-0" style={{ color: 'var(--blue)' }}>{e.personaName}</span>
                  <span className="flex-1 break-words" style={{ color: 'var(--text-2)' }}>{e.details}</span>
                </div>
              ))}
              <div ref={logEnd} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard
