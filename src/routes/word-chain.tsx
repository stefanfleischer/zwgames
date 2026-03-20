import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import {
  startChain,
  advanceChain,
  type ChainState,
} from '../lib/word-chain'
import type { HskWord } from '../lib/hsk-data'

export const Route = createFileRoute('/word-chain')({
  validateSearch: (search: Record<string, unknown>) => ({
    hsk: Math.min(6, Math.max(1, Number(search.hsk) || 1)),
  }),
  component: WordChainGame,
})

function WordChainGame() {
  const { hsk } = Route.useSearch()
  const navigate = useNavigate()

  const [state, setState] = useState<ChainState | null>(null)
  const [best, setBest] = useState(0)
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const [correctPop, setCorrectPop] = useState(false)

  const newGame = useCallback(
    (level: number) => {
      setState(startChain(level))
      setWrongPick(null)
      setCorrectPop(false)
    },
    [],
  )

  useEffect(() => {
    newGame(hsk)
  }, [hsk, newGame])

  const handlePick = (word: HskWord, idx: number) => {
    if (!state || state.gameOver) return
    if (wrongPick !== null || correctPop) return // already animating

    if (idx === state.correctIndex) {
      setCorrectPop(true)
      setTimeout(() => {
        const next = advanceChain(state.chain, word, hsk)
        setState(next)
        const chainLen = next.chain.length
        setBest((b) => Math.max(b, chainLen))
        setCorrectPop(false)
      }, 400)
    } else {
      setWrongPick(idx)
      const chainLen = state.chain.length
      setBest((b) => Math.max(b, chainLen))
      setTimeout(() => {
        setState((s) => (s ? { ...s, gameOver: true } : s))
      }, 600)
    }
  }

  const setLevel = (level: number) => {
    navigate({ to: '/word-chain', search: { hsk: level } })
    setBest(0)
  }

  if (!state) return null

  const chainLen = state.chain.length
  const current = state.chain[chainLen - 1]
  const lastChar = current.hanzi[current.hanzi.length - 1]

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

      {/* Score */}
      <div className="mb-4 text-center">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          Kette: {chainLen} &nbsp;·&nbsp; Rekord: {best}
        </span>
      </div>

      {/* Chain display */}
      <div className="wc-chain-scroll mb-4">
        <div className="wc-chain">
          {state.chain.map((w, i) => (
            <div
              key={`${i}-${w.hanzi}`}
              className={`wc-chain-word ${i === chainLen - 1 ? 'wc-chain-current' : ''}`}
            >
              <span className="font-bold">{w.hanzi}</span>
              <span className="text-[0.65rem] opacity-70">{w.pinyin}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt */}
      {!state.gameOver && (
        <div className="wo-prompt mb-4">
          <p className="text-sm text-[var(--text-muted)]">Welches Wort beginnt mit</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--accent)]">{lastChar}</p>
        </div>
      )}

      {/* Options */}
      {!state.gameOver && state.options.length > 0 && (
        <div className="wc-options">
          {state.options.map((word, idx) => {
            let cls = 'wc-option'
            if (correctPop && idx === state.correctIndex) cls += ' wc-option-correct'
            if (wrongPick === idx) cls += ' wc-option-wrong'

            return (
              <button
                key={`${idx}-${word.hanzi}`}
                className={cls}
                onClick={() => handlePick(word, idx)}
                disabled={wrongPick !== null || correctPop}
              >
                <span className="text-lg font-bold">{word.hanzi}</span>
                <span className="text-xs text-[var(--text-muted)]">{word.pinyin}</span>
                <span className="text-xs text-[var(--text-muted)]">{word.english}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Game Over */}
      {state.gameOver && (
        <div className="wo-prompt mb-4">
          <p className="text-base font-bold text-[var(--accent)]">
            {state.options.length === 0 ? 'Keine Wörter mehr!' : 'Falsch!'}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Kette: {chainLen} Wörter
          </p>
          {wrongPick !== null && state.options[state.correctIndex] && (
            <p className="mt-2 text-sm">
              Richtig wäre: <span className="font-bold">{state.options[state.correctIndex].hanzi}</span>
              {' '}<span className="text-[var(--text-muted)]">({state.options[state.correctIndex].pinyin})</span>
            </p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="mt-4 flex justify-center">
        <button onClick={() => newGame(hsk)} className="btn btn-primary">
          {state.gameOver ? 'Nochmal' : 'Neu starten'}
        </button>
      </div>
    </main>
  )
}
