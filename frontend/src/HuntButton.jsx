import React, { useState } from 'react'

export default function HuntButton({ tribe, onAction }) {
  const [hovered, setHovered] = useState(false)

  if (!tribe || !tribe.tribesmen) return null

  const hunters = tribe.tribesmen.filter(m => (m.task === 'hunting_5' || m.task === 'hunting_10') && m.is_alive !== false)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '26px',
        right: '557px',   // левее кнопки "Собрать дерево"
        zIndex: 10000,
        display: 'inline-block',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onAction('/api/hunt/', 'Охотник отправлен на охоту!')}
        style={{
          padding: '8px 12px',
          background: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = '#388e3c'}
        onMouseLeave={(e) => e.target.style.background = '#4caf50'}
      >
        🏹 Охота
        {hunters.length > 0 && ` (${hunters.length})`}
      </button>
      {hovered && hunters.length > 0 && (
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
          {hunters.map((man) => (
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