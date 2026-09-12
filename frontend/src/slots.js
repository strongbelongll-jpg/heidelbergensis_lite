// Четыре места под поселения на карте мира (заказ №64871429).
// Координаты - центры чистых песчаных клеток на map.png (1920x1080), в процентах
// от сцены 16:9 (см. .world__stage в WorldMap.css): сцена всегда пропорциональна
// картинке, поэтому маркеры стоят на своих клетках при любом размере окна.
export const SLOTS = [
  { slot: 1, x: 20.3, y: 19.9 },
  { slot: 2, x: 72.9, y: 43.5 },
  { slot: 3, x: 20.3, y: 76.9 },
  { slot: 4, x: 80.5, y: 78.0 },
]

// Состояние места по списку поселений с сервера.
export function slotState(slot, settlements) {
  const s = (settlements || []).find((x) => x.slot === slot)
  if (!s) return 'free'
  return s.is_mine ? 'mine' : 'taken'
}
