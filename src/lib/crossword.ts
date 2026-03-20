import { type HskWord, getWordsUpToLevel } from './hsk-data'

export type CrosswordDirection = 'across' | 'down'

export interface CrosswordPlacedWord {
  word: HskWord
  startRow: number
  startCol: number
  direction: CrosswordDirection
  clueNumber: number
}

export interface CrosswordPuzzle {
  width: number
  height: number
  placedWords: CrosswordPlacedWord[]
  grid: (string | null)[][]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Placement {
  word: HskWord
  startRow: number
  startCol: number
  direction: CrosswordDirection
}

function getWordCells(
  startRow: number,
  startCol: number,
  direction: CrosswordDirection,
  length: number,
): [number, number][] {
  const cells: [number, number][] = []
  for (let i = 0; i < length; i++) {
    cells.push([
      startRow + (direction === 'down' ? i : 0),
      startCol + (direction === 'across' ? i : 0),
    ])
  }
  return cells
}

function validatePlacement(
  placement: Placement,
  occupied: Map<string, string>,
  placedWords: Placement[],
): boolean {
  const { word, startRow, startCol, direction } = placement
  const chars = [...word.hanzi]
  const cells = getWordCells(startRow, startCol, direction, chars.length)
  let hasIntersection = placedWords.length === 0

  // Check cell before word is empty
  const [bRow, bCol] =
    direction === 'across'
      ? [startRow, startCol - 1]
      : [startRow - 1, startCol]
  if (occupied.has(`${bRow},${bCol}`)) return false

  // Check cell after word is empty
  const lastCell = cells[cells.length - 1]
  const [aRow, aCol] =
    direction === 'across'
      ? [lastCell[0], lastCell[1] + 1]
      : [lastCell[0] + 1, lastCell[1]]
  if (occupied.has(`${aRow},${aCol}`)) return false

  for (let i = 0; i < chars.length; i++) {
    const [r, c] = cells[i]
    const key = `${r},${c}`
    const existing = occupied.get(key)

    if (existing !== undefined) {
      if (existing !== chars[i]) return false
      hasIntersection = true
    } else {
      // Check perpendicular neighbors aren't occupied (would create unintended words)
      if (direction === 'across') {
        if (occupied.has(`${r - 1},${c}`) || occupied.has(`${r + 1},${c}`)) {
          // OK only if this cell is an intersection (existing char matches)
          return false
        }
      } else {
        if (occupied.has(`${r},${c - 1}`) || occupied.has(`${r},${c + 1}`)) {
          return false
        }
      }
    }
  }

  return hasIntersection
}

function targetWordCount(maxLevel: number): number {
  return maxLevel <= 2 ? 4 : 5
}

export function generateCrossword(maxLevel: number): CrosswordPuzzle {
  const available = getWordsUpToLevel(maxLevel)
  const target = targetWordCount(maxLevel)

  for (let attempt = 0; attempt < 100; attempt++) {
    const candidates = shuffle(available)
    const placed: Placement[] = []
    const occupied = new Map<string, string>()

    // Place first word horizontally at origin
    const first = candidates[0]
    const firstPlacement: Placement = {
      word: first,
      startRow: 0,
      startCol: 0,
      direction: 'across',
    }
    placed.push(firstPlacement)
    for (let i = 0; i < first.hanzi.length; i++) {
      occupied.set(`0,${i}`, first.hanzi[i])
    }

    // Try to place remaining words
    for (let ci = 1; ci < candidates.length && placed.length < target; ci++) {
      const candidate = candidates[ci]
      const chars = [...candidate.hanzi]
      let bestPlacement: Placement | null = null
      let bestExpansion = Infinity

      // Find intersections with already-placed words
      for (const pw of placed) {
        const pwChars = [...pw.word.hanzi]
        const pwCells = getWordCells(
          pw.startRow,
          pw.startCol,
          pw.direction,
          pwChars.length,
        )
        const newDir: CrosswordDirection =
          pw.direction === 'across' ? 'down' : 'across'

        for (let pi = 0; pi < pwChars.length; pi++) {
          for (let ci2 = 0; ci2 < chars.length; ci2++) {
            if (pwChars[pi] !== chars[ci2]) continue

            // Compute start position so chars overlap
            const [intR, intC] = pwCells[pi]
            const startRow =
              newDir === 'down' ? intR - ci2 : intR
            const startCol =
              newDir === 'across' ? intC - ci2 : intC

            const placement: Placement = {
              word: candidate,
              startRow,
              startCol,
              direction: newDir,
            }

            if (validatePlacement(placement, occupied, placed)) {
              // Score by bounding box expansion
              const newCells = getWordCells(
                startRow,
                startCol,
                newDir,
                chars.length,
              )
              let minR = Infinity,
                maxR = -Infinity,
                minC = Infinity,
                maxC = -Infinity
              for (const key of occupied.keys()) {
                const parts = key.split(',')
                const r = Number(parts[0])
                const c = Number(parts[1])
                minR = Math.min(minR, r)
                maxR = Math.max(maxR, r)
                minC = Math.min(minC, c)
                maxC = Math.max(maxC, c)
              }
              for (const [r, c] of newCells) {
                minR = Math.min(minR, r)
                maxR = Math.max(maxR, r)
                minC = Math.min(minC, c)
                maxC = Math.max(maxC, c)
              }
              const expansion = (maxR - minR + 1) * (maxC - minC + 1)

              if (expansion < bestExpansion) {
                bestExpansion = expansion
                bestPlacement = placement
              }
            }
          }
        }
      }

      if (bestPlacement) {
        placed.push(bestPlacement)
        const bChars = [...bestPlacement.word.hanzi]
        const bCells = getWordCells(
          bestPlacement.startRow,
          bestPlacement.startCol,
          bestPlacement.direction,
          bChars.length,
        )
        for (let i = 0; i < bChars.length; i++) {
          occupied.set(`${bCells[i][0]},${bCells[i][1]}`, bChars[i])
        }
      }
    }

    if (placed.length >= target) {
      return buildPuzzle(placed, occupied)
    }
  }

  // Fallback: return whatever we got on the last attempt
  const candidates = shuffle(available)
  const placed: Placement[] = []
  const occupied = new Map<string, string>()
  const first = candidates[0]
  placed.push({
    word: first,
    startRow: 0,
    startCol: 0,
    direction: 'across',
  })
  for (let i = 0; i < first.hanzi.length; i++) {
    occupied.set(`0,${i}`, first.hanzi[i])
  }
  return buildPuzzle(placed, occupied)
}

function buildPuzzle(
  placed: Placement[],
  occupied: Map<string, string>,
): CrosswordPuzzle {
  // Find bounds
  let minR = Infinity,
    maxR = -Infinity,
    minC = Infinity,
    maxC = -Infinity

  for (const key of occupied.keys()) {
    const [r, c] = key.split(',').map(Number)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
    minC = Math.min(minC, c)
    maxC = Math.max(maxC, c)
  }

  const height = maxR - minR + 1
  const width = maxC - minC + 1

  // Normalize coordinates
  const normalizedPlaced = placed.map((p) => ({
    ...p,
    startRow: p.startRow - minR,
    startCol: p.startCol - minC,
  }))

  // Build grid
  const grid: (string | null)[][] = Array.from({ length: height }, () =>
    Array(width).fill(null),
  )
  for (const [key, char] of occupied.entries()) {
    const [r, c] = key.split(',').map(Number)
    grid[r - minR][c - minC] = char
  }

  // Assign clue numbers
  // Sort by position: top-to-bottom, left-to-right
  const sorted = [...normalizedPlaced].sort((a, b) => {
    if (a.startRow !== b.startRow) return a.startRow - b.startRow
    return a.startCol - b.startCol
  })

  let clueNum = 1
  const cellNumbers = new Map<string, number>()
  const placedWords: CrosswordPlacedWord[] = []

  for (const p of sorted) {
    const key = `${p.startRow},${p.startCol}`
    if (!cellNumbers.has(key)) {
      cellNumbers.set(key, clueNum++)
    }
    placedWords.push({
      word: p.word,
      startRow: p.startRow,
      startCol: p.startCol,
      direction: p.direction,
      clueNumber: cellNumbers.get(key)!,
    })
  }

  return { width, height, placedWords, grid }
}
