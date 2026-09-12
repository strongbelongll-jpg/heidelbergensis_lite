import React, { useState } from 'react'

export default function BottomRightPanel({ tribe, onAction }) {
  const [hoveredDead, setHoveredDead] = useState(false)
  const [hoveredStone, setHoveredStone] = useState(false)

  if (!tribe || !tribe.tribesmen) return null

  const dead = tribe.tribesmen.filter(m => m.is_alive === false)
  const stonemasons = tribe.tribesmen.filter(m => (m.task === 'stone_2' || m.task === 'stone_10') && m.is_alive !== false)

  return (
    <>
      {/* Кнопка "Собрать камни" — левее панели "Погибшие" */}
      <div
        style={{
          position: 'fixed',
          bottom: '26px',
          right: '241px',
          zIndex: 10000,
          display: 'inline-block',
        }}
        onMouseEnter={() => setHoveredStone(true)}
        onMouseLeave={() => setHoveredStone(false)}
      >
        <button
          onClick={() => onAction('/api/gather_stone/', 'Сбор камней начат!')}
          style={{
            padding: '8px 12px',
            background: '#9e9e9e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = '#757575'}
          onMouseLeave={(e) => e.target.style.background = '#9e9e9e'}
        >
          ⛏️ Собрать камни
          {stonemasons.length > 0 && ` (${stonemasons.length})`}
        </button>
        {hoveredStone && stonemasons.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              background: 'rgba(30,30,30,0.95)',
              backdropFilter: 'blur(4px)',
              borderRadius: '8px',
              padding: '10px 12px',
              minWidth: '180px',
              maxHeight: '150px',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 10001,
              marginBottom: '4px',
            }}
          >
            {stonemasons.map((man) => (
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

      {/* Панель "Погибшие" */}
      {dead.length > 0 && (
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
          onMouseEnter={() => setHoveredDead(true)}
          onMouseLeave={() => setHoveredDead(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#ff6b6b', fontSize: '14px' }}>💀 Погибшие</strong>
            <span style={{ fontSize: '14px', color: '#ff6b6b' }}>{dead.length}</span>
          </div>
          {hoveredDead && (
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
      )}
    </>
  )
}