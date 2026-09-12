// Тесты компонента карты мира (часть 2 заказа №64871429).
// Проверяем поведение, которое видит игрок: четыре места, их состояния и клики.
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import WorldMap from '../WorldMap.jsx'
import { SLOTS } from '../slots.js'

const settlements = [
  { slot: 1, owner_name: 'Племя Волка', is_mine: false },
  { slot: 3, owner_name: 'Моё племя', is_mine: true },
]

describe('WorldMap', () => {
  it('рисует ровно четыре места под поселения', () => {
    render(<WorldMap settlements={[]} onClaim={() => {}} onOpen={() => {}} />)
    expect(screen.getAllByTestId('slot')).toHaveLength(4)
    expect(SLOTS).toHaveLength(4)
  })

  it('фон карты - картинка map.png на весь экран', () => {
    render(<WorldMap settlements={[]} onClaim={() => {}} onOpen={() => {}} />)
    const img = screen.getByRole('img', { name: /карта/i })
    expect(img).toHaveAttribute('src', expect.stringContaining('map.png'))
  })

  it('свободное место предлагает основать поселение и отдаёт номер места', () => {
    const onClaim = vi.fn()
    // у игрока ещё нет поселения - занято только чужое место 1
    const chuzhie = [{ slot: 1, owner_name: 'Племя Волка', is_mine: false }]
    render(<WorldMap settlements={chuzhie} onClaim={onClaim} onOpen={() => {}} />)
    const free = screen.getAllByRole('button', { name: /основать/i })
    expect(free).toHaveLength(3) // места 2, 3 и 4 свободны
    fireEvent.click(free[0])
    expect(onClaim).toHaveBeenCalledWith(2)
  })

  it('чужое место показывает имя хозяина и не кликается', () => {
    const onClaim = vi.fn()
    const onOpen = vi.fn()
    render(<WorldMap settlements={settlements} onClaim={onClaim} onOpen={onOpen} />)
    const chuzhoe = screen.getByText('Племя Волка').closest('[data-testid="slot"]')
    expect(chuzhoe).toHaveAttribute('data-state', 'taken')
    fireEvent.click(chuzhoe)
    expect(onClaim).not.toHaveBeenCalled()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('своё место по клику открывает поселение', () => {
    const onOpen = vi.fn()
    render(<WorldMap settlements={settlements} onClaim={() => {}} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /моё поселение/i }))
    expect(onOpen).toHaveBeenCalledWith(3)
  })

  it('когда у игрока уже есть поселение, основать второе нельзя', () => {
    render(<WorldMap settlements={settlements} onClaim={() => {}} onOpen={() => {}} />)
    screen.getAllByRole('button', { name: /основать/i }).forEach((b) => {
      expect(b).toBeDisabled()
    })
  })

  it('места стоят по координатам из slots.js в процентах', () => {
    render(<WorldMap settlements={[]} onClaim={() => {}} onOpen={() => {}} />)
    const slots = screen.getAllByTestId('slot')
    slots.forEach((el, i) => {
      expect(el.style.left).toBe(`${SLOTS[i].x}%`)
      expect(el.style.top).toBe(`${SLOTS[i].y}%`)
    })
  })
})
