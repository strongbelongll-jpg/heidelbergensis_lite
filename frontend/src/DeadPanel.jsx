import React, { useState } from 'react'

export default function DeadPanel({ tribe }) {
  const [hovered, setHovered] = useState(false)

  if (!tribe || !tribe.tribesmen) return null

  const dead = tribe.tribesmen.filter(m => m.is_alive === false)

  if (dead.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '26px',
        right: '80px',
        zIndex: 10000,
        background: 'rgba(30,30,30,0.9)',
        backdropFilter: 'blur(4px)',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        minWidth: '120px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: '#ff6b6b', fontSize: '14px' }}>💀 Погибшие</strong>
        <span style={{ fontSize: '14px', color: '#ff6b6b' }}>{dead.length}</span>
      </div>

      {hovered && (
        <ul
          style={{
            listStyle: 'none',
            padding: '4px 0 0 0',
            margin: '4px 0 0 0',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          {dead.map((man) => (
            <li key={man.id} style={{ fontSize: '13px', padding: '2px 0', color: '#ff6b6b' }}>
              {man.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}