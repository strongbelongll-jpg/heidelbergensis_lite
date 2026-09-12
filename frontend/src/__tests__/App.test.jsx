// Переключение экранов и вход (заказ №64871429).
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('axios', () => {
  const get = vi.fn()
  const post = vi.fn()
  return { default: { get, post, defaults: {} } }
})
import axios from 'axios'
import App from '../App.jsx'

const tribe = {
  name: 'Моё племя', food: 10, wood: 5, stone: 3, population: 5, max_population: 7,
  hut_level: 1, tribesmen: [{ id: 1, name: 'Охотник 1', task: 'idle', is_alive: true }],
}

const meNoGoogle = { authenticated: false, google_configured: false, login_url: 'http://s/accounts/google/login/', logout_url: 'http://s/accounts/logout/' }
const meLoggedIn = { authenticated: true, google_configured: true, username: 'gosha', tribe_name: 'Племя gosha', login_url: 'http://s/accounts/google/login/', logout_url: 'http://s/accounts/logout/' }
const meNeedLogin = { authenticated: false, google_configured: true, login_url: 'http://s/accounts/google/login/?process=login', logout_url: 'http://s/accounts/logout/' }

beforeEach(() => {
  axios.get.mockReset()
  axios.post.mockReset()
})

function otvety({ me = meNoGoogle, settlements = [], tribeOk = true }) {
  axios.get.mockImplementation((url) => {
    if (url.endsWith('/api/me/')) return Promise.resolve({ data: me })
    if (url.endsWith('/api/tribe/')) return tribeOk ? Promise.resolve({ data: tribe }) : Promise.reject(new Error('500'))
    if (url.endsWith('/api/settlements/')) return Promise.resolve({ data: settlements })
    return Promise.reject(new Error('нет такого адреса: ' + url))
  })
}

describe('App', () => {
  it('запросы идут с куками сессии и CSRF-заголовком для другого origin', () => {
    expect(axios.defaults.withCredentials).toBe(true)
    expect(axios.defaults.withXSRFToken).toBe(true)
    expect(axios.defaults.xsrfCookieName).toBe('csrftoken')
    expect(axios.defaults.xsrfHeaderName).toBe('X-CSRFToken')
  })

  it('без настроенного входа стартует с карты мира (как раньше у заказчика)', async () => {
    otvety({})
    render(<App />)
    expect(await screen.findByRole('img', { name: /карта/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /основать/i })).toHaveLength(4)
  })

  it('вход настроен, игрок не вошёл - экран входа, игру не грузим', async () => {
    otvety({ me: meNeedLogin })
    render(<App />)
    expect(await screen.findByRole('link', { name: /войти через google/i })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /карта/i })).not.toBeInTheDocument()
    expect(axios.get.mock.calls.some(([u]) => u.endsWith('/api/tribe/'))).toBe(false)
  })

  it('вошедший видит карту, своё имя и ссылку «Выйти»', async () => {
    otvety({ me: meLoggedIn })
    render(<App />)
    expect(await screen.findByRole('img', { name: /карта/i })).toBeInTheDocument()
    expect(screen.getByText('Племя gosha')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /выйти/i })).toHaveAttribute('href', 'http://s/accounts/logout/')
  })

  it('клик по своему поселению открывает экран поселения, кнопка возвращает на карту', async () => {
    otvety({ settlements: [{ slot: 2, owner_name: 'Моё племя', is_mine: true }] })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /моё поселение/i }))
    expect(await screen.findByRole('button', { name: /на карту/i })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /карта/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /на карту/i }))
    expect(await screen.findByRole('img', { name: /карта/i })).toBeInTheDocument()
  })

  it('основать поселение - шлёт номер места на сервер и перечитывает список', async () => {
    otvety({})
    axios.post.mockResolvedValue({ data: { message: 'Поселение основано' } })
    render(<App />)
    fireEvent.click((await screen.findAllByRole('button', { name: /основать/i }))[1])
    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    const [url, body] = axios.post.mock.calls[0]
    expect(url).toMatch(/\/api\/settlements\/claim\/$/)
    expect(body).toEqual({ slot: 2 })
    await waitFor(() => expect(axios.get.mock.calls.filter(([u]) => u.endsWith('/api/settlements/')).length).toBeGreaterThan(1))
  })

  it('если список поселений не отдаётся, карта всё равно показывается, а не белый экран', async () => {
    axios.get.mockImplementation((url) => {
      if (url.endsWith('/api/me/')) return Promise.resolve({ data: meNoGoogle })
      if (url.endsWith('/api/tribe/')) return Promise.resolve({ data: tribe })
      return Promise.reject(new Error('500'))
    })
    render(<App />)
    expect(await screen.findByRole('img', { name: /карта/i })).toBeInTheDocument()
    expect(await screen.findByText(/поселени/i)).toBeInTheDocument()
  })

  it('если /api/me/ не отвечает - игра всё равно открывается (как без входа)', async () => {
    axios.get.mockImplementation((url) => {
      if (url.endsWith('/api/me/')) return Promise.reject(new Error('500'))
      if (url.endsWith('/api/tribe/')) return Promise.resolve({ data: tribe })
      if (url.endsWith('/api/settlements/')) return Promise.resolve({ data: [] })
      return Promise.reject(new Error('x'))
    })
    render(<App />)
    expect(await screen.findByRole('img', { name: /карта/i })).toBeInTheDocument()
  })
})
