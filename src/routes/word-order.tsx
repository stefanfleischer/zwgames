import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getRandomSentence,
  scrambleWords,
  type Sentence,
} from '../lib/sentence-data'

export const Route = createFileRoute('/word-order')({
  validateSearch: (search: Record<string, unknown>) => ({
    hsk: Math.min(6, Math.max(1, Number(search.hsk) || 1)),
  }),
  component: WordOrderGame,
})

function WordOrderGame() {
  const { hsk } = Route.useSearch()
  const navigate = useNavigate()

  const [sentence, setSentence] = useState<Sentence | null>(null)
  const [scrambled, setScrambled] = useState<string[]>([])
  const [answer, setAnswer] = useState<string[]>([])
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)

  const loadSentence = useCallback(
    (level: number) => {
      const s = getRandomSentence(level)
      setSentence(s)
      setScrambled(scrambleWords(s.chinese))
      setAnswer([])
      setResult(null)
    },
    [],
  )

  useEffect(() => {
    loadSentence(hsk)
  }, [hsk, loadSentence])

  // Words remaining in the bank (not yet placed in answer)
  const bankWords = useMemo(() => {
    const used = new Map<string, number>()
    for (const w of answer) {
      used.set(w, (used.get(w) || 0) + 1)
    }
    const remaining: { word: string; originalIdx: number }[] = []
    const usedCounts = new Map<string, number>()
    for (let i = 0; i < scrambled.length; i++) {
      const w = scrambled[i]
      const usedSoFar = usedCounts.get(w) || 0
      const totalUsed = used.get(w) || 0
      if (usedSoFar < totalUsed) {
        usedCounts.set(w, usedSoFar + 1)
      } else {
        remaining.push({ word: w, originalIdx: i })
      }
    }
    return remaining
  }, [scrambled, answer])

  const addWord = (word: string) => {
    if (result) return
    setAnswer((prev) => [...prev, word])
  }

  const removeWord = (idx: number) => {
    if (result) return
    setAnswer((prev) => prev.filter((_, i) => i !== idx))
  }

  const checkAnswer = () => {
    if (!sentence || answer.length !== sentence.chinese.length) return
    const isCorrect = answer.every((w, i) => w === sentence.chinese[i])
    setResult(isCorrect ? 'correct' : 'wrong')
    setTotal((t) => t + 1)
    if (isCorrect) setStreak((s) => s + 1)
    else setStreak(0)
  }

  const handleNext = () => {
    loadSentence(hsk)
  }

  const setLevel = (level: number) => {
    navigate({ to: '/word-order', search: { hsk: level } })
    setStreak(0)
    setTotal(0)
  }

  if (!sentence) return null

  const allPlaced = answer.length === sentence.chinese.length
  const canCheck = allPlaced && !result

  return (
    <main className="mx-auto max-w-lg px-3 pb-6 pt-3">
      {/* HSK Level Pills */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
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
          Serie: {streak} &nbsp;·&nbsp; Gesamt: {total}
        </span>
      </div>

      {/* Prompt */}
      <div className="wo-prompt mb-5">
        <p className="text-base font-semibold text-[var(--text)]">{sentence.english}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{sentence.pinyin}</p>
      </div>

      {/* Answer area */}
      <div
        className={`wo-answer-area ${result === 'correct' ? 'wo-correct' : ''} ${result === 'wrong' ? 'wo-wrong' : ''}`}
      >
        {answer.length === 0 && (
          <span className="text-sm text-[var(--text-muted)] opacity-50">
            Tippe auf die Wörter…
          </span>
        )}
        {answer.map((word, idx) => (
          <button
            key={`${idx}-${word}`}
            className="wo-word wo-word-placed"
            onClick={() => removeWord(idx)}
            disabled={result !== null}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="wo-bank">
        {bankWords.map(({ word, originalIdx }) => (
          <button
            key={`${originalIdx}-${word}`}
            className="wo-word wo-word-bank"
            onClick={() => addWord(word)}
            disabled={result !== null}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Result feedback */}
      {result === 'correct' && (
        <div className="wo-feedback wo-feedback-correct">
          Richtig!
        </div>
      )}
      {result === 'wrong' && (
        <div className="wo-feedback wo-feedback-wrong">
          <span>Falsch — </span>
          <span className="font-bold">{sentence.chinese.join(' ')}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-4 flex justify-center gap-2">
        {!result && (
          <button
            onClick={checkAnswer}
            disabled={!canCheck}
            className="btn btn-primary"
          >
            Prüfen
          </button>
        )}
        {result && (
          <button onClick={handleNext} className="btn btn-primary">
            Weiter
          </button>
        )}
        <button
          onClick={handleNext}
          className="btn btn-secondary"
        >
          Überspringen
        </button>
      </div>
    </main>
  )
}
