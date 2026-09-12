import React, { useState } from 'react'

export default function WoodButton({ tribe, onAction }) {
  const [hovered, setHovered] = useState(false)

  if (!tribe || !tribe.tribesmen) return null

  const woodcutters = tribe.tribesmen.filter(m => (m.task === 'wood_2' || m.task === 'wood_10') && m.is_alive !== false)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '26px',
        right: '386px',   // было 340px — сместили на 60px (2 см) левее
        zIndex: 10000,
        display: 'inline-block',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onAction('/api/gather_wood/', 'Сбор дерева начат!')}
        style={{
          padding: '8px 12px',    // было 6px 12px — увеличили высоту
          background: '#8d6e63',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = '#6d4c41'}
        onMouseLeave={(e) => e.target.style.background = '#8d6e63'}
      >
        🪓 Собрать дерево
        {woodcutters.length > 0 && ` (${woodcutters.length})`}
      </button>
      {hovered && woodcutters.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            background: 'rgba(30,30,30,0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            padding: '8px 12px',
            minWidth: '180px',
            maxHeight: '150px',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 10001,
            marginBottom: '4px',
          }}
        >
          {woodcutters.map((man) => (
            <div
              key={man.id}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                color: '#ddd',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span>{man.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}