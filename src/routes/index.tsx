import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GRID_SIZES,
  type GridSize,
  getWordCount,
  generatePuzzle,
  isAdjacent,
  checkMatch,
  type Puzzle,
} from '../lib/word-search'
import { getCharPinyin } from '../lib/hsk-data'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    hsk: Math.min(6, Math.max(1, Number(search.hsk) || 1)),
    size: (GRID_SIZES as readonly number[]).includes(Number(search.size))
      ? (Number(search.size) as GridSize)
      : 8 as GridSize,
  }),
  component: WordSearchGame,
})

const WORD_COLORS = [
  '#e74c3c',
  '#e67e22',
  '#f1c40f',
  '#2ecc71',
  '#1abc9c',
  '#3498db',
  '#9b59b6',
  '#e84393',
  '#00b894',
  '#6c5ce7',
]

function WordSearchGame() {
  const { hsk, size } = Route.useSearch()
  const navigate = useNavigate()
  const wordCount = getWordCount(size)

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [foundIndices, setFoundIndices] = useState<Set<number>>(new Set())
  const [selectedPath, setSelectedPath] = useState<[number, number][]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [flashCells, setFlashCells] = useState<Set<string> | null>(null)
  const [hints, setHints] = useState<number[]>([])
  const [shakeWrong, setShakeWrong] = useState(false)
  const [pinyinBubble, setPinyinBubble] = useState<{
    row: number
    col: number
    pinyin: string
    id: number
  } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPuzzle(generatePuzzle(hsk, size))
    setFoundIndices(new Set())
    setSelectedPath([])
    setHints([])
  }, [hsk, size])

  const foundCellColors = useMemo(() => {
    if (!puzzle) return new Map<string, number>()
    const map = new Map<string, number>()
    foundIndices.forEach((idx) => {
      puzzle.placedWords[idx].cells.forEach(([r, c]) => {
        map.set(`${r},${c}`, idx)
      })
    })
    return map
  }, [puzzle, foundIndices])

  const selectedSet = useMemo(
    () => new Set(selectedPath.map(([r, c]) => `${r},${c}`)),
    [selectedPath],
  )

  // Use refs for touch handlers to avoid stale closures
  const selectingRef = useRef(false)
  const pathRef = useRef<[number, number][]>([])
  const pathSetRef = useRef<Set<string>>(new Set())
  const foundRef = useRef<Set<number>>(new Set())
  const puzzleRef = useRef<Puzzle | null>(null)

  // Keep refs in sync
  useEffect(() => { foundRef.current = foundIndices }, [foundIndices])
  useEffect(() => { puzzleRef.current = puzzle }, [puzzle])

  const getCellFromPoint = useCallback(
    (x: number, y: number): [number, number] | null => {
      const el = document.elementFromPoint(x, y)
      if (!el) return null
      const target = (el as HTMLElement).closest('[data-row]') as HTMLElement | null
      if (!target) return null
      const row = target.getAttribute('data-row')
      const col = target.getAttribute('data-col')
      if (row === null || col === null) return null
      return [parseInt(row), parseInt(col)]
    },
    [],
  )

  const updatePath = useCallback((newPath: [number, number][]) => {
    pathRef.current = newPath
    pathSetRef.current = new Set(newPath.map(([r, c]) => `${r},${c}`))
    setSelectedPath(newPath)
  }, [])

  const startSelection = useCallback(
    (x: number, y: number) => {
      if (!puzzleRef.current) return
      const cell = getCellFromPoint(x, y)
      if (!cell) return
      selectingRef.current = true
      setIsSelecting(true)
      updatePath([cell])
    },
    [getCellFromPoint, updatePath],
  )

  const moveSelection = useCallback(
    (x: number, y: number) => {
      if (!selectingRef.current || !puzzleRef.current) return
      const cell = getCellFromPoint(x, y)
      if (!cell) return
      const [r, c] = cell
      const key = `${r},${c}`
      const path = pathRef.current
      const pathSet = pathSetRef.current

      if (pathSet.has(key)) {
        // Backtracking
        if (
          path.length >= 2 &&
          path[path.length - 2][0] === r &&
          path[path.length - 2][1] === c
        ) {
          updatePath(path.slice(0, -1))
        }
        return
      }

      const last = path[path.length - 1]
      if (last && isAdjacent(last, [r, c])) {
        updatePath([...path, [r, c]])
      }
    },
    [getCellFromPoint, updatePath],
  )

  const bubbleIdRef = useRef(0)

  const endSelection = useCallback(() => {
    if (!selectingRef.current || !puzzleRef.current) return
    selectingRef.current = false
    setIsSelecting(false)

    const path = pathRef.current
    if (path.length === 1) {
      // Single tap — show pinyin bubble
      const [r, c] = path[0]
      const char = puzzleRef.current.grid[r][c]
      const pinyin = getCharPinyin(char)
      if (pinyin) {
        const id = ++bubbleIdRef.current
        setPinyinBubble({ row: r, col: c, pinyin, id })
        setTimeout(() => {
          setPinyinBubble((prev) => (prev?.id === id ? null : prev))
        }, 1200)
      }
    } else if (path.length >= 2) {
      const matchIdx = checkMatch(
        path,
        puzzleRef.current.grid,
        puzzleRef.current.placedWords,
        foundRef.current,
      )
      if (matchIdx !== null) {
        const cellKeys = new Set(
          puzzleRef.current.placedWords[matchIdx].cells.map(([r, c]) => `${r},${c}`),
        )
        setFlashCells(cellKeys)
        setTimeout(() => {
          setFoundIndices((prev) => new Set([...prev, matchIdx]))
          setFlashCells(null)
        }, 600)
      } else {
        setShakeWrong(true)
        setTimeout(() => setShakeWrong(false), 400)
      }
    }
    updatePath([])
  }, [updatePath])

  // No native touch handler needed — we use pointer events with releasePointerCapture

  const handleNewGame = () => {
    setPuzzle(generatePuzzle(hsk, size))
    setFoundIndices(new Set())
    setSelectedPath([])
    setHints([])
  }

  const handleHint = () => {
    if (!puzzle) return
    const unfound = puzzle.placedWords
      .map((_, i) => i)
      .filter((i) => !foundIndices.has(i) && !hints.includes(i))
    if (unfound.length === 0) return
    const pick = unfound[Math.floor(Math.random() * unfound.length)]
    setHints((h) => [...h, pick])
  }

  const setLevel = (level: number) => {
    navigate({ to: '/', search: { hsk: level, size } })
  }

  const setGridSize = (newSize: GridSize) => {
    navigate({ to: '/', search: { hsk, size: newSize } })
  }

  const isWon = puzzle !== null && foundIndices.size === wordCount

  if (!puzzle) return null

  return (
    <main className="mx-auto max-w-lg px-3 pb-6 pt-3">
      {/* HSK Level Pills */}
      <div className="mb-3 flex items-center justify-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-[var(--text-muted)]">HSK</span>
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <button
            key={level}
            onClick={() => setLevel(level)}
            className={`hsk-pill ${hsk === level ? 'active' : ''}`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Grid Size Pills */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-[var(--text-muted)]">Gitter</span>
        {GRID_SIZES.map((gs) => (
          <button
            key={gs}
            onClick={() => setGridSize(gs)}
            className={`hsk-pill ${size === gs ? 'active' : ''}`}
          >
            {gs}×{gs}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(foundIndices.size / wordCount) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs font-medium text-[var(--text-muted)]">
          {foundIndices.size} / {wordCount}
        </p>
      </div>

      {/* Win */}
      {isWon && (
        <div className="ws-win mb-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-3 text-center">
          <p className="text-base font-bold text-[var(--accent)]">
            Alle gefunden!
          </p>
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridRef}
        className={`game-grid mx-auto ${shakeWrong ? 'ws-shake' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
        }}
        onPointerDown={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId)
          startSelection(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => moveSelection(e.clientX, e.clientY)}
        onPointerUp={endSelection}
        onPointerLeave={endSelection}
        onPointerCancel={endSelection}
      >
        {puzzle.grid.map((row, r) =>
          row.map((char, c) => {
            const key = `${r},${c}`
            const isSelected = selectedSet.has(key)
            const foundIdx = foundCellColors.get(key)
            const isFound = foundIdx !== undefined
            const isFlashing = flashCells?.has(key)

            let cellClass = 'cell'
            if (isFlashing) cellClass += ' cell-flash'
            else if (isSelected) cellClass += ' cell-selected'
            else if (isFound) cellClass += ' cell-found'

            const showBubble =
              pinyinBubble !== null &&
              pinyinBubble.row === r &&
              pinyinBubble.col === c

            return (
              <div
                key={key}
                data-row={r}
                data-col={c}
                className={cellClass}
                style={
                  isFound && !isFlashing
                    ? { backgroundColor: WORD_COLORS[foundIdx % WORD_COLORS.length], color: '#fff' }
                    : undefined
                }
              >
                {char}
                {showBubble && (
                  <span key={pinyinBubble.id} className="pinyin-bubble">
                    {pinyinBubble.pinyin}
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={handleNewGame} className="btn btn-secondary">
          Neu
        </button>
        <button onClick={handleHint} disabled={isWon} className="btn btn-primary">
          Tipp
        </button>
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {hints.map((idx) => (
            <span
              key={idx}
              className={`hint-chip ${foundIndices.has(idx) ? 'found' : ''}`}
            >
              {puzzle.placedWords[idx].word.pinyin} — {puzzle.placedWords[idx].word.english}
            </span>
          ))}
        </div>
      )}

      {/* Found words */}
      {foundIndices.size > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {[...foundIndices].map((idx) => {
            const w = puzzle.placedWords[idx].word
            return (
              <div
                key={idx}
                className="ws-found-word found-chip"
                style={{ backgroundColor: WORD_COLORS[idx % WORD_COLORS.length] }}
              >
                <span className="font-bold">{w.hanzi}</span>
                <span className="opacity-80">{w.pinyin}</span>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
