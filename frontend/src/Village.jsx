import React from 'react'
import TribePanel from './TribePanel.jsx'
import { HUT_SPOTS, hutsToShow } from './huts.js'
import './Village.css'
import GameControls from './GameControls'
import DeadPanel from './DeadPanel'
import BottomRightPanel from './BottomRightPanel'
import WoodButton from './WoodButton'
import HuntButton from './HuntButton'

// Экран поселения: сцена 16:9 - поляна с костром (village_bg.png), поверх неё
// хижины (hut.png) по точкам плана: сколько построено (hut_level из API),
// столько и стоит. Панель племени и кнопка «На карту» - у краёв окна.
export default function Village({ tribe, message, onAction, onBack }) {
  const huts = tribe ? hutsToShow(tribe.hut_level) : 0
  // Панель племени можно свернуть, чтобы не закрывала хижины на маленьких экранах.
  const [panelOpen, setPanelOpen] = React.useState(true)

  return (
    <div className="village">
      <div className="village__stage">
        <img className="village__bg" src="/village_bg.png" alt="Поселение" draggable={false} />
        {HUT_SPOTS.slice(0, huts).map(({ x, y }, i) => (
          <div key={i} data-testid="hut" className="hut" style={{ left: `${x}%`, top: `${y}%` }}>
            <img src="/hut.png" alt={`Хижина ${i + 1}`} draggable={false} />
          </div>
        ))}
      </div>

      <div className="village__top">
        <button type="button" className="village__back" onClick={onBack}>← На карту</button>
        <div className="village__title">{tribe ? tribe.name : 'Поселение'}</div>
        {tribe && <div className="village__title">🛖 Хижин: {huts}</div>}
        {tribe && (
          <button type="button" className="village__back" onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? 'Скрыть племя' : 'Показать племя'}
          </button>
        )}
      </div>

      {tribe ? (
        panelOpen && (
          <div className="village__panel">
            <TribePanel tribe={tribe} message={message} onAction={onAction} />
          </div>
        )
      ) : (
        <div className="village__error">Данные племени не загрузились - сервер не отвечает</div>
      )}

      <GameControls />
      <DeadPanel tribe={tribe} />
      <BottomRightPanel tribe={tribe} onAction={onAction} />
      <WoodButton tribe={tribe} onAction={onAction} />
      <HuntButton tribe={tribe} onAction={onAction} />
    </div>
  )
}
