import React from 'react'
import './ResultsScreen.css'

export default function ResultsScreen({ results, winner, onExit }) {
  if (!results || results.length === 0) {
    return (
      <div className="results">
        <div className="results__box">
          <div className="results__text">
            <h2>Игра завершена</h2>
            <p>Данных о результатах нет</p>
            <button className="results__btn" onClick={onExit}>Выйти</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="results">
      <div className="results__box">
        <div className="results__text">
          <h2>🏆 Игра завершена!</h2>
          <p className="results__winner">Победитель: <strong>{winner?.name || '—'}</strong></p>

          <ul className="results__list">
            {results.map((r, i) => (
              <li key={i} className={r.name === winner?.name ? 'results__item results__item--win' : 'results__item'}>
                <span className="results__name">{r.name}</span>
                <span className="results__pop">👥 {r.population} жителей</span>
              </li>
            ))}
          </ul>

          <button className="results__btn" onClick={onExit}>Выйти</button>
        </div>
      </div>
    </div>
  )
}