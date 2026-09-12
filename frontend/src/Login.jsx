import React from 'react'
import './Login.css'

// Экран входа: одна кнопка «Войти через Google» (ссылка на allauth на сервере).
// Если ключи Google на сервере не заданы - говорим об этом прямо, а не крутим
// пустой редирект.
export default function Login({ me }) {
  const configured = !!(me && me.google_configured)
  return (
    <div className="login">
      <img className="login__bg" src="/map.png" alt="" aria-hidden="true" draggable={false} />
      <div className="login__card">
        <h1 className="login__title">Heidelbergensis</h1>
        <p className="login__text">Четыре племени, одна карта. Войдите, чтобы основать поселение.</p>
        {configured ? (
          <a className="login__btn" href={me.login_url}>Войти через Google</a>
        ) : (
          <div className="login__warn">
            Вход через Google не настроен на сервере: задайте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET.
          </div>
        )}
      </div>
    </div>
  )
}
