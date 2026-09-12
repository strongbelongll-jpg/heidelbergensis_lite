// Экран входа через Google (часть 5 заказа №64871429).
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import Login from '../Login.jsx'

describe('Login', () => {
  it('когда ключи Google заданы - есть ссылка «Войти через Google» на адрес с сервера', () => {
    render(<Login me={{ authenticated: false, google_configured: true, login_url: 'http://localhost:8000/accounts/google/login/?process=login' }} />)
    const a = screen.getByRole('link', { name: /войти через google/i })
    expect(a).toHaveAttribute('href', 'http://localhost:8000/accounts/google/login/?process=login')
  })

  it('когда ключей нет - честно говорит, что вход не настроен, и ссылки не даёт', () => {
    render(<Login me={{ authenticated: false, google_configured: false, login_url: 'x' }} />)
    expect(screen.getByText(/не настроен/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /войти/i })).not.toBeInTheDocument()
  })
})
