import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GRID_SIZE,
  WORD_COUNT,
  generatePuzzle,
  isAdjacent,
  checkMatch,
  type Puzzle,
} from '../../lib/word-search'

export const Route = createFileRoute('/games/word-search')({
  validateSearch: (search: Record<string, unknown>) => ({
    hsk: Math.min(6, Math.max(1, Number(search.hsk) || 1)),
  }),
  component: WordSearchGame,
})

// Colors for found words (cycling)
const WORD_COLORS = [
  'rgba(79, 184, 178, 0.45)',
  'rgba(47, 106, 74, 0.40)',
  'rgba(178, 112, 62, 0.40)',
  'rgba(106, 47, 94, 0.40)',
  'rgba(62, 136, 178, 0.40)',
  'rgba(178, 62, 78, 0.40)',
  'rgba(134, 178, 62, 0.40)',
  'rgba(62, 178, 134, 0.40)',
  'rgba(178, 156, 62, 0.40)',
  'rgba(98, 62, 178, 0.40)',
]

function WordSearchGame() {
  const { hsk } = Route.useSearch()
  const navigate = useNavigate()

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [foundIndices, setFoundIndices] = useState<Set<number>>(new Set())
  const [selectedPath, setSelectedPath] = useState<[number, number][]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [flashCells, setFlashCells] = useState<Set<string> | null>(null)
  const [hints, setHints] = useState<number[]>([])
  const [shakeWrong, setShakeWrong] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Generate puzzle on mount / level change
  useEffect(() => {
    setPuzzle(generatePuzzle(hsk))
    setFoundIndices(new Set())
    setSelectedPath([])
    setHints([])
  }, [hsk])

  // Build a map of found cell -> color index
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

  const getCellFromPoint = useCallback(
    (x: number, y: number): [number, number] | null => {
      const el = document.elementFromPoint(x, y)
      if (!el) return null
      const row = el.getAttribute('data-row')
      const col = el.getAttribute('data-col')
      if (row === null || col === null) return null
      return [parseInt(row), parseInt(col)]
    },
    [],
  )

  const handlePointerDown = useCallback(
    (r: number, c: number) => {
      if (!puzzle) return
      setIsSelecting(true)
      setSelectedPath([[r, c]])
    },
    [puzzle],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isSelecting || !puzzle) return
      const cell = getCellFromPoint(e.clientX, e.clientY)
      if (!cell) return
      const [r, c] = cell
      const key = `${r},${c}`

      // Already in path?
      if (selectedSet.has(key)) {
        // Allow backtracking: if it's the second-to-last cell, pop
        if (
          selectedPath.length >= 2 &&
          selectedPath[selectedPath.length - 2][0] === r &&
          selectedPath[selectedPath.length - 2][1] === c
        ) {
          setSelectedPath((p) => p.slice(0, -1))
        }
        return
      }

      // Must be adjacent to last cell
      const last = selectedPath[selectedPath.length - 1]
      if (last && isAdjacent(last, [r, c])) {
        setSelectedPath((p) => [...p, [r, c]])
      }
    },
    [isSelecting, puzzle, selectedPath, selectedSet, getCellFromPoint],
  )

  const handlePointerUp = useCallback(() => {
    if (!isSelecting || !puzzle) return
    setIsSelecting(false)

    if (selectedPath.length >= 2) {
      const matchIdx = checkMatch(
        selectedPath,
        puzzle.grid,
        puzzle.placedWords,
        foundIndices,
      )
      if (matchIdx !== null) {
        // Found a word!
        const cellKeys = new Set(
          puzzle.placedWords[matchIdx].cells.map(([r, c]) => `${r},${c}`),
        )
        setFlashCells(cellKeys)
        setTimeout(() => {
          setFoundIndices((prev) => new Set([...prev, matchIdx]))
          setFlashCells(null)
        }, 600)
      } else {
        // Wrong selection — shake
        setShakeWrong(true)
        setTimeout(() => setShakeWrong(false), 400)
      }
    }
    setSelectedPath([])
  }, [isSelecting, puzzle, selectedPath, foundIndices])

  const handleNewGame = () => {
    setPuzzle(generatePuzzle(hsk))
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
    navigate({ to: '/games/word-search', search: { hsk: level } })
  }

  const isWon = puzzle !== null && foundIndices.size === WORD_COUNT

  if (!puzzle) return null

  return (
    <main className="page-wrap px-2 pb-8 pt-4 sm:px-4">
      {/* Level selector */}
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <button
            key={level}
            onClick={() => setLevel(level)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              hsk === level
                ? 'bg-[var(--lagoon)] text-white'
                : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] hover:bg-[var(--surface-strong)]'
            }`}
          >
            HSK {level}
          </button>
        ))}
      </div>

      {/* Progress */}
      <p className="mb-3 text-center text-sm font-semibold text-[var(--sea-ink-soft)]">
        {foundIndices.size} / {WORD_COUNT} gefunden
      </p>

      {/* Win message */}
      {isWon && (
        <div className="ws-win mb-4 rounded-2xl bg-[rgba(79,184,178,0.18)] p-4 text-center">
          <p className="text-lg font-bold text-[var(--lagoon-deep)]">
            Alle Wörter gefunden!
          </p>
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridRef}
        className={`mx-auto grid touch-none select-none ${shakeWrong ? 'ws-shake' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          maxWidth: `min(100%, ${GRID_SIZE * 48}px)`,
          gap: '2px',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {puzzle.grid.map((row, r) =>
          row.map((char, c) => {
            const key = `${r},${c}`
            const isSelected = selectedSet.has(key)
            const foundIdx = foundCellColors.get(key)
            const isFound = foundIdx !== undefined
            const isFlashing = flashCells?.has(key)

            let bg = 'bg-[var(--surface)]'
            let extraClass = ''

            if (isFlashing) {
              bg = 'bg-[var(--lagoon)]'
              extraClass = 'ws-flash'
            } else if (isSelected) {
              bg = 'bg-[rgba(79,184,178,0.35)]'
            } else if (isFound) {
              bg = ''
            }

            return (
              <button
                key={key}
                data-row={r}
                data-col={c}
                onPointerDown={(e) => {
                  e.preventDefault()
                  ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                  handlePointerDown(r, c)
                }}
                className={`flex aspect-square items-center justify-center rounded-lg text-lg font-bold transition-colors ${bg} ${extraClass} ${
                  isFound && !isFlashing
                    ? 'text-white'
                    : isSelected
                      ? 'text-white'
                      : 'text-[var(--sea-ink)]'
                }`}
                style={
                  isFound && !isFlashing
                    ? { backgroundColor: WORD_COLORS[foundIdx % WORD_COLORS.length] }
                    : undefined
                }
              >
                {char}
              </button>
            )
          }),
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          onClick={handleNewGame}
          className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--surface-strong)]"
        >
          Neues Spiel
        </button>
        <button
          onClick={handleHint}
          disabled={isWon}
          className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:bg-[rgba(79,184,178,0.24)] disabled:opacity-40"
        >
          Tipp
        </button>
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="mt-3 text-center">
          <p className="mb-1 text-xs font-semibold text-[var(--sea-ink-soft)]">Tipps:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {hints.map((idx) => (
              <span
                key={idx}
                className={`inline-block rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm ${
                  foundIndices.has(idx)
                    ? 'text-[var(--sea-ink-soft)] line-through'
                    : 'text-[var(--sea-ink)]'
                }`}
              >
                {puzzle.placedWords[idx].word.pinyin} —{' '}
                {puzzle.placedWords[idx].word.english}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Found words */}
      {foundIndices.size > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-center text-xs font-semibold text-[var(--sea-ink-soft)]">
            Gefundene Wörter:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[...foundIndices].map((idx) => {
              const w = puzzle.placedWords[idx].word
              return (
                <div
                  key={idx}
                  className="ws-found-word inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: WORD_COLORS[idx % WORD_COLORS.length],
                  }}
                >
                  <span>{w.hanzi}</span>
                  <span className="text-xs opacity-80">{w.pinyin}</span>
                  <span className="text-xs opacity-70">{w.english}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
