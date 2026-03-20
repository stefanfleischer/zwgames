import { type HskWord, getWordsUpToLevel, getAllCharacters } from './hsk-data'

export const GRID_SIZES = [7, 8, 9, 10] as const
export type GridSize = (typeof GRID_SIZES)[number]

/** Word count scales with grid size */
export function getWordCount(gridSize: GridSize): number {
  switch (gridSize) {
    case 7: return 6
    case 8: return 8
    case 9: return 10
    case 10: return 12
  }
}

export interface PlacedWord {
  word: HskWord
  cells: [number, number][] // [row, col] for each character
}

export interface Puzzle {
  grid: string[][]
  placedWords: PlacedWord[]
  wordCount: number
}

type Direction = [number, number] // [dRow, dCol]

const DIRECTIONS: Direction[] = [
  [0, 1],  // right
  [0, -1], // left
  [1, 0],  // down
  [-1, 0], // up
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tryPlaceWord(
  grid: (string | null)[][],
  word: string,
  gridSize: number,
): [number, number][] | null {
  const dirs = shuffle(DIRECTIONS)

  for (const [dr, dc] of dirs) {
    const positions = generateStartPositions(word.length, dr, dc, gridSize)
    for (const [startR, startC] of shuffle(positions)) {
      const cells: [number, number][] = []
      let valid = true

      for (let i = 0; i < word.length; i++) {
        const r = startR + i * dr
        const c = startC + i * dc
        const existing = grid[r][c]
        if (existing !== null && existing !== word[i]) {
          valid = false
          break
        }
        cells.push([r, c])
      }

      if (valid) return cells
    }
  }
  return null
}

function generateStartPositions(
  wordLen: number,
  dr: number,
  dc: number,
  gridSize: number,
): [number, number][] {
  const positions: [number, number][] = []
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const endR = r + (wordLen - 1) * dr
      const endC = c + (wordLen - 1) * dc
      if (endR >= 0 && endR < gridSize && endC >= 0 && endC < gridSize) {
        positions.push([r, c])
      }
    }
  }
  return positions
}

export function generatePuzzle(maxLevel: number, gridSize: GridSize = 8): Puzzle {
  const wordCount = getWordCount(gridSize)
  const available = getWordsUpToLevel(maxLevel)
  if (available.length < wordCount) {
    throw new Error(`Not enough words for level ${maxLevel}`)
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidates = shuffle(available).slice(0, wordCount * 3)
    const grid: (string | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null),
    )
    const placedWords: PlacedWord[] = []

    for (const word of candidates) {
      if (placedWords.length >= wordCount) break
      const cells = tryPlaceWord(grid, word.hanzi, gridSize)
      if (cells) {
        for (let i = 0; i < word.hanzi.length; i++) {
          grid[cells[i][0]][cells[i][1]] = word.hanzi[i]
        }
        placedWords.push({ word, cells })
      }
    }

    if (placedWords.length === wordCount) {
      const fillers = getAllCharacters(maxLevel)
      const finalGrid = grid.map((row) =>
        row.map((cell) =>
          cell !== null
            ? cell
            : fillers[Math.floor(Math.random() * fillers.length)],
        ),
      )
      return { grid: finalGrid, placedWords, wordCount }
    }
  }

  throw new Error('Failed to generate puzzle after 50 attempts')
}

/** Check if two cells are orthogonally adjacent */
export function isAdjacent(a: [number, number], b: [number, number]): boolean {
  const dr = Math.abs(a[0] - b[0])
  const dc = Math.abs(a[1] - b[1])
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1)
}

/** Check if a path of cells matches any of the placed words */
export function checkMatch(
  path: [number, number][],
  grid: string[][],
  placedWords: PlacedWord[],
  foundIndices: Set<number>,
): number | null {
  const selected = path.map(([r, c]) => grid[r][c]).join('')

  for (let i = 0; i < placedWords.length; i++) {
    if (foundIndices.has(i)) continue
    if (selected === placedWords[i].word.hanzi) {
      // Also verify the path matches the actual placed cells
      const placedCells = placedWords[i].cells
      if (
        path.length === placedCells.length &&
        path.every(([r, c], idx) => placedCells[idx][0] === r && placedCells[idx][1] === c)
      ) {
        return i
      }
    }
  }
  return null
}
