import { type HskWord, getWordsUpToLevel, getAllCharacters } from './hsk-data'

export const GRID_SIZE = 8
export const WORD_COUNT = 10

export interface PlacedWord {
  word: HskWord
  cells: [number, number][] // [row, col] for each character
}

export interface Puzzle {
  grid: string[][]
  placedWords: PlacedWord[]
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
): [number, number][] | null {
  const dirs = shuffle(DIRECTIONS)

  // Try each direction with random starting positions
  for (const [dr, dc] of dirs) {
    const positions = generateStartPositions(word.length, dr, dc)
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
): [number, number][] {
  const positions: [number, number][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const endR = r + (wordLen - 1) * dr
      const endC = c + (wordLen - 1) * dc
      if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
        positions.push([r, c])
      }
    }
  }
  return positions
}

export function generatePuzzle(maxLevel: number): Puzzle {
  const available = getWordsUpToLevel(maxLevel)
  if (available.length < WORD_COUNT) {
    throw new Error(`Not enough words for level ${maxLevel}`)
  }

  // Try generating a valid puzzle (retry if placement fails)
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidates = shuffle(available).slice(0, WORD_COUNT * 3) // Pick extra candidates
    const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(null),
    )
    const placedWords: PlacedWord[] = []

    for (const word of candidates) {
      if (placedWords.length >= WORD_COUNT) break
      const cells = tryPlaceWord(grid, word.hanzi)
      if (cells) {
        // Place the word on the grid
        for (let i = 0; i < word.hanzi.length; i++) {
          grid[cells[i][0]][cells[i][1]] = word.hanzi[i]
        }
        placedWords.push({ word, cells })
      }
    }

    if (placedWords.length === WORD_COUNT) {
      // Fill empty cells with random characters
      const fillers = getAllCharacters(maxLevel)
      const finalGrid = grid.map((row) =>
        row.map((cell) =>
          cell !== null
            ? cell
            : fillers[Math.floor(Math.random() * fillers.length)],
        ),
      )
      return { grid: finalGrid, placedWords }
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
