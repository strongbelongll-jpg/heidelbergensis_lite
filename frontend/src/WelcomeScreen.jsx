import React from 'react'
import './WelcomeScreen.css'

export default function WelcomeScreen({ onLogin }) {
  console.log('🔵 WelcomeScreen рендерится, onLogin:', onLogin)

  const handleClick = (e) => {
    e.stopPropagation()
    console.log('🟢 Кнопка нажата!')
    if (typeof onLogin === 'function') {
      onLogin()
    } else {
      console.error('❌ onLogin не является функцией!', onLogin)
    }
  }

  return (
    <div className="welcome">
      <div className="welcome__box">
        <button 
          className="welcome__btn" 
          onClick={handleClick}
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '60px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          {/* Картинка кнопки как фон, но клик обрабатывает сама кнопка */}
          <img 
            src="/Inter.png" 
            alt="Войти"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none', // важно!
            }}
          />
        </button>
      </div>
    </div>
  )
}