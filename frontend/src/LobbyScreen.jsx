import React from 'react'
import './LobbyScreen.css'

export default function LobbyScreen({ onStart }) {
  return (
    <div className="lobby">
      <div className="lobby__box">
        <button className="lobby__btn" onClick={onStart}>
          Начать
        </button>
      </div>
    </div>
  )
}