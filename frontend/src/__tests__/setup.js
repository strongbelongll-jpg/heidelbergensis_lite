// Общая подготовка тестов: чистить DOM после каждого теста, иначе рендеры
// накапливаются и запросы вроде getByText находят по несколько элементов.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
