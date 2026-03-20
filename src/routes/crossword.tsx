import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  generateCrossword,
  type CrosswordPuzzle,
  type CrosswordPlacedWord,
} from '../lib/crossword'

export const Route = createFileRoute('/crossword')({
  validateSearch: (search: Record<string, unknown>) => ({
    hsk: Math.min(6, Math.max(1, Number(search.hsk) || 1)),
  }),
  component: CrosswordGame,
})

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getWordCells(pw: CrosswordPlacedWord): [number, number][] {
  const cells: [number, number][] = []
  for (let i = 0; i < pw.word.hanzi.length; i++) {
    cells.push([
      pw.startRow + (pw.direction === 'down' ? i : 0),
      pw.startCol + (pw.direction === 'across' ? i : 0),
    ])
  }
  return cells
}

function CrosswordGame() {
  const { hsk } = Route.useSearch()
  const navigate = useNavigate()

  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [cellValues, setCellValues] = useState<Map<string, string>>(new Map())
  const [lockedWords, setLockedWords] = useState<Set<number>>(new Set())
  const [shakeWord, setShakeWord] = useState<number | null>(null)

  const newGame = useCallback((level: number) => {
    setPuzzle(generateCrossword(level))
    setSelectedIdx(null)
    setCellValues(new Map())
    setLockedWords(new Set())
  }, [])

  useEffect(() => {
    newGame(hsk)
  }, [hsk, newGame])

  // Map each cell to clue number(s)
  const cellClueNumbers = useMemo(() => {
    if (!puzzle) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const pw of puzzle.placedWords) {
      const key = `${pw.startRow},${pw.startCol}`
      if (!map.has(key)) {
        map.set(key, pw.clueNumber)
      }
    }
    return map
  }, [puzzle])

  // Map each cell → word indices it belongs to
  const cellToWords = useMemo(() => {
    if (!puzzle) return new Map<string, number[]>()
    const map = new Map<string, number[]>()
    puzzle.placedWords.forEach((pw, idx) => {
      for (const [r, c] of getWordCells(pw)) {
        const key = `${r},${c}`
        const list = map.get(key) || []
        list.push(idx)
        map.set(key, list)
      }
    })
    return map
  }, [puzzle])

  // Cells of selected word
  const selectedCells = useMemo(() => {
    if (!puzzle || selectedIdx === null) return new Set<string>()
    const pw = puzzle.placedWords[selectedIdx]
    return new Set(getWordCells(pw).map(([r, c]) => `${r},${c}`))
  }, [puzzle, selectedIdx])

  // Locked cells
  const lockedCells = useMemo(() => {
    if (!puzzle) return new Map<string, string>()
    const map = new Map<string, string>()
    lockedWords.forEach((idx) => {
      const pw = puzzle.placedWords[idx]
      const chars = [...pw.word.hanzi]
      getWordCells(pw).forEach(([r, c], i) => {
        map.set(`${r},${c}`, chars[i])
      })
    })
    return map
  }, [puzzle, lockedWords])

  // Character bank for selected word
  const bankChars = useMemo(() => {
    if (!puzzle || selectedIdx === null) return []
    const pw = puzzle.placedWords[selectedIdx]
    const chars = [...pw.word.hanzi]
    const cells = getWordCells(pw)

    // Filter out characters at locked intersections
    const needed: string[] = []
    for (let i = 0; i < chars.length; i++) {
      const key = `${cells[i][0]},${cells[i][1]}`
      if (!lockedCells.has(key)) {
        needed.push(chars[i])
      }
    }

    // Remove already-placed characters from bank
    const placed: string[] = []
    for (const [r, c] of cells) {
      const key = `${r},${c}`
      if (!lockedCells.has(key) && cellValues.has(key)) {
        placed.push(cellValues.get(key)!)
      }
    }

    const remaining = [...needed]
    for (const p of placed) {
      const idx = remaining.indexOf(p)
      if (idx !== -1) remaining.splice(idx, 1)
    }

    return shuffle(remaining)
  }, [puzzle, selectedIdx, lockedCells, cellValues])

  const handleCellClick = (r: number, c: number) => {
    if (!puzzle) return
    const key = `${r},${c}`
    if (puzzle.grid[r][c] === null) return

    const wordIndices = cellToWords.get(key) || []
    const unlocked = wordIndices.filter((i) => !lockedWords.has(i))
    if (unlocked.length === 0) return

    // If clicking a cell in the selected word, remove its value
    if (selectedIdx !== null && unlocked.includes(selectedIdx)) {
      if (cellValues.has(key) && !lockedCells.has(key)) {
        setCellValues((prev) => {
          const next = new Map(prev)
          next.delete(key)
          return next
        })
        return
      }
    }

    // Select word — cycle if multiple
    if (selectedIdx !== null && unlocked.includes(selectedIdx)) {
      // Cycle to the other word at this cell
      const otherIdx = unlocked.find((i) => i !== selectedIdx)
      if (otherIdx !== undefined) {
        setSelectedIdx(otherIdx)
        return
      }
    }
    setSelectedIdx(unlocked[0])
  }

  const handleBankClick = (char: string) => {
    if (!puzzle || selectedIdx === null) return
    const pw = puzzle.placedWords[selectedIdx]
    const cells = getWordCells(pw)

    // Find first empty cell in this word
    for (const [r, c] of cells) {
      const key = `${r},${c}`
      if (lockedCells.has(key)) continue
      if (cellValues.has(key)) continue

      const newValues = new Map(cellValues)
      newValues.set(key, char)
      setCellValues(newValues)

      // Check if word is complete
      const allFilled = cells.every(([cr, cc]) => {
        const ck = `${cr},${cc}`
        return lockedCells.has(ck) || newValues.has(ck)
      })

      if (allFilled) {
        // Verify correctness
        const chars = [...pw.word.hanzi]
        const isCorrect = cells.every(([cr, cc], i) => {
          const ck = `${cr},${cc}`
          const val = lockedCells.get(ck) || newValues.get(ck)
          return val === chars[i]
        })

        if (isCorrect) {
          setLockedWords((prev) => new Set([...prev, selectedIdx]))
          // Clear cell values for this word (they're now in lockedCells)
          const cleaned = new Map(newValues)
          for (const [cr, cc] of cells) {
            cleaned.delete(`${cr},${cc}`)
          }
          setCellValues(cleaned)
          setSelectedIdx(null)
        } else {
          setShakeWord(selectedIdx)
          setTimeout(() => {
            // Clear non-locked cells of this word
            const cleaned = new Map(newValues)
            for (const [cr, cc] of cells) {
              const ck = `${cr},${cc}`
              if (!lockedCells.has(ck)) cleaned.delete(ck)
            }
            setCellValues(cleaned)
            setShakeWord(null)
          }, 500)
        }
      }
      return
    }
  }

  const handleClueClick = (idx: number) => {
    if (lockedWords.has(idx)) return
    setSelectedIdx(idx)
  }

  const setLevel = (level: number) => {
    navigate({ to: '/crossword', search: { hsk: level } })
  }

  if (!puzzle) return null

  const isWon = lockedWords.size === puzzle.placedWords.length

  const acrossClues = puzzle.placedWords
    .map((pw, idx) => ({ pw, idx }))
    .filter(({ pw }) => pw.direction === 'across')
    .sort((a, b) => a.pw.clueNumber - b.pw.clueNumber)

  const downClues = puzzle.placedWords
    .map((pw, idx) => ({ pw, idx }))
    .filter(({ pw }) => pw.direction === 'down')
    .sort((a, b) => a.pw.clueNumber - b.pw.clueNumber)

  // Cells that belong to the shaking word
  const shakeCells = useMemo(() => {
    if (shakeWord === null || !puzzle) return new Set<string>()
    const pw = puzzle.placedWords[shakeWord]
    return new Set(getWordCells(pw).map(([r, c]) => `${r},${c}`))
  }, [shakeWord, puzzle])

  return (
    <main className="mx-auto max-w-lg px-3 pb-6 pt-3">
      {/* HSK Level Pills */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
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

      {/* Win */}
      {isWon && (
        <div className="ws-win mb-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-3 text-center">
          <p className="text-base font-bold text-[var(--accent)]">
            Gelöst!
          </p>
        </div>
      )}

      {/* Grid */}
      <div
        className="cw-grid mx-auto"
        style={{ gridTemplateColumns: `repeat(${puzzle.width}, 1fr)` }}
      >
        {Array.from({ length: puzzle.height }, (_, r) =>
          Array.from({ length: puzzle.width }, (_, c) => {
            const key = `${r},${c}`
            const gridChar = puzzle.grid[r][c]
            const isBlack = gridChar === null
            const isSelected = selectedCells.has(key)
            const isLocked = lockedCells.has(key)
            const isShaking = shakeCells.has(key)
            const displayChar =
              lockedCells.get(key) || cellValues.get(key) || ''
            const clueNum = cellClueNumbers.get(key)

            if (isBlack) {
              return <div key={key} className="cw-cell cw-cell-black" />
            }

            let cls = 'cw-cell'
            if (isLocked) cls += ' cw-cell-locked'
            else if (isSelected) cls += ' cw-cell-selected'
            if (isShaking) cls += ' ws-shake'

            return (
              <div
                key={key}
                className={cls}
                onClick={() => handleCellClick(r, c)}
              >
                {clueNum && (
                  <span className="cw-clue-number">{clueNum}</span>
                )}
                <span className="cw-cell-char">{displayChar}</span>
              </div>
            )
          }),
        )}
      </div>

      {/* Character Bank */}
      {selectedIdx !== null && !lockedWords.has(selectedIdx) && (
        <div className="wo-bank mt-4">
          {bankChars.map((char, i) => (
            <button
              key={`${i}-${char}`}
              className="wo-word wo-word-bank"
              onClick={() => handleBankClick(char)}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* Clues */}
      <div className="cw-clues mt-4">
        {acrossClues.length > 0 && (
          <div className="mb-3">
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Waagerecht →
            </h3>
            {acrossClues.map(({ pw, idx }) => (
              <button
                key={idx}
                className={`cw-clue ${selectedIdx === idx ? 'cw-clue-active' : ''} ${lockedWords.has(idx) ? 'cw-clue-done' : ''}`}
                onClick={() => handleClueClick(idx)}
              >
                <span className="cw-clue-num">{pw.clueNumber}</span>
                <span>{pw.word.english}</span>
                <span className="text-[var(--text-muted)]">({pw.word.pinyin})</span>
              </button>
            ))}
          </div>
        )}
        {downClues.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Senkrecht ↓
            </h3>
            {downClues.map(({ pw, idx }) => (
              <button
                key={idx}
                className={`cw-clue ${selectedIdx === idx ? 'cw-clue-active' : ''} ${lockedWords.has(idx) ? 'cw-clue-done' : ''}`}
                onClick={() => handleClueClick(idx)}
              >
                <span className="cw-clue-num">{pw.clueNumber}</span>
                <span>{pw.word.english}</span>
                <span className="text-[var(--text-muted)]">({pw.word.pinyin})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-center">
        <button onClick={() => newGame(hsk)} className="btn btn-secondary">
          Neu
        </button>
      </div>
    </main>
  )
}
