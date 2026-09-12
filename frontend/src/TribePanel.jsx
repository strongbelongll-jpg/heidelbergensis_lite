import React, { useState, useEffect } from 'react'

export default function TribePanel({ tribe, message, onAction }) {
  const plashka = { background: 'rgba(255,245,220,0.9)', padding: '12px 16px', borderRadius: '10px', flex: '1 1 140px' }

  const [timers, setTimers] = useState({})

  useEffect(() => {
    if (!tribe || !tribe.tribesmen) return

    const interval = setInterval(() => {
      const now = Date.now()
      const newTimers = {}

      tribe.tribesmen.forEach((man) => {
        if (man.task !== 'idle' && man.returns_at) {
          const returnTime = new Date(man.returns_at).getTime()
          const diff = Math.max(0, Math.floor((returnTime - now) / 1000))
          newTimers[man.id] = diff
        }
      })

      setTimers(newTimers)
    }, 1000)

    return () => clearInterval(interval)
  }, [tribe])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}м ${secs}с`
  }

  // Группировка
  const all = tribe.tribesmen || []
  const idle = all.filter(m => m.task === 'idle' && m.is_alive !== false)

  const renderList = (title, icon, list, bgColor) => {
    return (
      <div style={{ marginBottom: '10px', background: bgColor, borderRadius: '8px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{icon} {title}</strong>
          <span style={{ fontSize: '14px', color: '#555' }}>
            {list.length > 0 ? `${list.length} чел.` : '—'}
          </span>
        </div>
        {list.length > 0 && (
          <ul style={{ listStyle: 'none', padding: '4px 0 0 0', margin: 0 }}>
            {list.map((man) => (
              <li key={man.id} style={{ fontSize: '14px', padding: '2px 0' }}>
                {man.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="tribe">
      {message && <div className="tribe__msg">{message}</div>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={plashka}><strong> Еда:</strong> {tribe.food}</div>
        <div style={plashka}><strong> Дерево:</strong> {tribe.wood}</div>
        <div style={plashka}><strong> Камни:</strong> {tribe.stone}</div>
        <div style={plashka}><strong> Население:</strong> {tribe.population}</div>
      </div>

      {/* Кнопка "Построить хижину" — на всю ширину панели */}
      <button
        onClick={() => onAction('/api/build_hut/', 'Хижина построена!')}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: 'bold',
          transition: 'background 0.2s',
          marginBottom: '14px',
        }}
        onMouseEnter={(e) => e.target.style.background = '#f57c00'}
        onMouseLeave={(e) => e.target.style.background = '#ff9800'}
      >
        🏠 Построить хижину
      </button>

      <div style={{ marginTop: '8px' }}>
        {/* 1. Все жители (общий список) */}
        {renderList('Все жители', '👥', all, 'rgba(240,240,240,0.9)')}
        
        {/* 2. Свободные */}
        {renderList('Свободные', '✅', idle, 'rgba(232,245,233,0.9)')}
      </div>
    </div>
  )
}