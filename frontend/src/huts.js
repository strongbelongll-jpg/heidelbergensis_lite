// Точки под хижины на поляне (village_bg.png, сцена 16:9), в процентах от сцены.
// Хижины ставятся по этому плану по порядку, а не по выбору игрока - так
// договорились с заказчиком 06.09.2026. Максимум - длина списка.
// Костёр на village_bg.png стоит в точке (50%, 50%); кольцо хижин - вокруг него,
// внутри песчаной поляны (её края: сверху ~y 22%, снизу ~y 88%, слева/справа ~x 12/88%).
export const HUT_SPOTS = [
  { x: 35, y: 36 },
  { x: 50, y: 31 },
  { x: 65, y: 36 },
  { x: 73, y: 55 },
  { x: 65, y: 76 },
  { x: 50, y: 82 },
  { x: 35, y: 76 },
  { x: 27, y: 55 },
]

export const MAX_HUTS = HUT_SPOTS.length

// Сколько хижин показывать при данном уровне хижин из API (hut_level).
export function hutsToShow(hutLevel) {
  const n = Number(hutLevel)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.floor(n), MAX_HUTS)
}
