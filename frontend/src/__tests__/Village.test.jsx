// Экран поселения: хижины появляются по уровню хижин (часть 3 заказа №64871429).
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import Village from '../Village.jsx'
import { HUT_SPOTS, MAX_HUTS, hutsToShow } from '../huts.js'

const tribe = (hut_level) => ({
  name: 'Моё племя', food: 1, wood: 2, stone: 3, population: 5, max_population: 7,
  hut_level, tribesmen: [],
})

describe('hutsToShow', () => {
  it('ноль хижин при уровне 0, мусоре и отрицательном', () => {
    expect(hutsToShow(0)).toBe(0)
    expect(hutsToShow(undefined)).toBe(0)
    expect(hutsToShow(-3)).toBe(0)
    expect(hutsToShow('abc')).toBe(0)
  })
  it('уровень выше плана упирается в максимум', () => {
    expect(hutsToShow(MAX_HUTS + 5)).toBe(MAX_HUTS)
    expect(hutsToShow(3)).toBe(3)
  })
})

describe('Village', () => {
  it('фон - поляна без хижин, костёр в середине рисует картинка', () => {
    render(<Village tribe={tribe(0)} message="" onAction={() => {}} onBack={() => {}} />)
    expect(screen.getByRole('img', { name: /поселение/i })).toHaveAttribute('src', expect.stringContaining('village_bg.png'))
    expect(screen.queryAllByTestId('hut')).toHaveLength(0)
  })

  it('при уровне 3 стоят три хижины по первым трём точкам плана', () => {
    render(<Village tribe={tribe(3)} message="" onAction={() => {}} onBack={() => {}} />)
    const huts = screen.getAllByTestId('hut')
    expect(huts).toHaveLength(3)
    huts.forEach((el, i) => {
      expect(el.style.left).toBe(`${HUT_SPOTS[i].x}%`)
      expect(el.style.top).toBe(`${HUT_SPOTS[i].y}%`)
      expect(el.querySelector('img')).toHaveAttribute('src', expect.stringContaining('hut.png'))
    })
  })

  it('больше плана хижин не рисует', () => {
    render(<Village tribe={tribe(50)} message="" onAction={() => {}} onBack={() => {}} />)
    expect(screen.getAllByTestId('hut')).toHaveLength(MAX_HUTS)
  })

  it('панель племени и кнопка «На карту» на месте, кнопка возвращает', () => {
    const onBack = vi.fn()
    render(<Village tribe={tribe(1)} message="" onAction={() => {}} onBack={onBack} />)
    expect(screen.getByText(/еда/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /построить хижину/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /на карту/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('панель племени сворачивается и разворачивается кнопкой', () => {
    render(<Village tribe={tribe(2)} message="" onAction={() => {}} onBack={() => {}} />)
    expect(screen.getByText(/еда/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /скрыть племя/i }))
    expect(screen.queryByText(/еда/i)).not.toBeInTheDocument()
    expect(screen.getAllByTestId('hut')).toHaveLength(2) // хижины остаются
    fireEvent.click(screen.getByRole('button', { name: /показать племя/i }))
    expect(screen.getByText(/еда/i)).toBeInTheDocument()
  })

  it('без данных племени показывает честное сообщение, а не пустой экран', () => {
    render(<Village tribe={null} message="" onAction={() => {}} onBack={() => {}} />)
    expect(screen.getByText(/не загрузились/i)).toBeInTheDocument()
  })
})
