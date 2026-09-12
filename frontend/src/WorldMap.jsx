import React from 'react'
import { SLOTS, slotState } from './slots.js'
import './WorldMap.css'
import GameControls from './GameControls'

// Карта мира: одна картинка на весь экран и четыре места под поселения.
// settlements - [{slot, owner_name, is_mine}], onClaim(slot) - основать,
// onOpen(slot) - открыть своё поселение.
export default function WorldMap({ settlements = [], onClaim, onOpen }) {
  const uzheEst = settlements.some((s) => s.is_mine)

  return (
    <div className="world">
      <div className="world__stage">
      <img className="world__bg" src="/map.png" alt="Карта мира" draggable={false} />

      {SLOTS.map(({ slot, x, y }) => {
        const state = slotState(slot, settlements)
        const info = settlements.find((s) => s.slot === slot)
        const style = { left: `${x}%`, top: `${y}%` }

        if (state === 'free') {
          return (
            <div key={slot} data-testid="slot" data-state="free" className="slot slot--free" style={style}>
              <button
                type="button"
                className="slot__btn"
                disabled={uzheEst}
                title={uzheEst ? 'У вас уже есть поселение' : 'Основать поселение здесь'}
                onClick={() => onClaim(slot)}
              >
                Основать
              </button>
            </div>
          )
        }

        if (state === 'mine') {
          return (
            <div key={slot} data-testid="slot" data-state="mine" className="slot slot--mine" style={style}>
              <button type="button" className="slot__btn slot__btn--mine" onClick={() => onOpen(slot)}>
                Моё поселение
              </button>
              <div className="slot__name">{info.owner_name}</div>
            </div>
          )
        }

        return (
          <div key={slot} data-testid="slot" data-state="taken" className="slot slot--taken" style={style}>
            <div className="slot__hut" aria-hidden="true" />
            <div className="slot__name">{info.owner_name}</div>
          </div>
        )
      })}
      </div>
      <GameControls />
    </div>
  )
}
