import { type HskWord, getWordsUpToLevel } from './hsk-data'

export interface ChainState {
  chain: HskWord[]
  options: HskWord[]
  correctIndex: number
  gameOver: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build a map from first character → words starting with that character */
function buildFirstCharMap(words: HskWord[]): Map<string, HskWord[]> {
  const map = new Map<string, HskWord[]>()
  for (const w of words) {
    const first = w.hanzi[0]
    const list = map.get(first) || []
    list.push(w)
    map.set(first, list)
  }
  return map
}

/** Pick a random starting word that has at least one follow-up */
export function startChain(maxLevel: number): ChainState {
  const words = getWordsUpToLevel(maxLevel)
  const charMap = buildFirstCharMap(words)

  // Find words whose last char has follow-ups
  const starters = words.filter((w) => {
    const lastChar = w.hanzi[w.hanzi.length - 1]
    const candidates = charMap.get(lastChar)
    return candidates && candidates.some((c) => c.hanzi !== w.hanzi)
  })

  const start = starters.length > 0
    ? starters[Math.floor(Math.random() * starters.length)]
    : words[Math.floor(Math.random() * words.length)]

  return nextRound([start], words, charMap)
}

/** Generate the next round of options given the current chain */
export function nextRound(
  chain: HskWord[],
  allWords: HskWord[],
  charMap?: Map<string, HskWord[]>,
): ChainState {
  const map = charMap || buildFirstCharMap(allWords)
  const current = chain[chain.length - 1]
  const lastChar = current.hanzi[current.hanzi.length - 1]
  const usedHanzi = new Set(chain.map((w) => w.hanzi))

  // Find valid next words (start with lastChar, not already used)
  const validNext = (map.get(lastChar) || []).filter(
    (w) => !usedHanzi.has(w.hanzi),
  )

  if (validNext.length === 0) {
    return { chain, options: [], correctIndex: -1, gameOver: true }
  }

  // Pick the correct answer
  const correct = validNext[Math.floor(Math.random() * validNext.length)]

  // Pick 3 wrong answers (don't start with lastChar, not used)
  const wrong = shuffle(
    allWords.filter(
      (w) =>
        w.hanzi[0] !== lastChar &&
        !usedHanzi.has(w.hanzi) &&
        w.hanzi !== correct.hanzi,
    ),
  ).slice(0, 3)

  // Combine and shuffle, tracking correct index
  const options = shuffle([correct, ...wrong])
  const correctIndex = options.findIndex((o) => o.hanzi === correct.hanzi)

  return { chain, options, correctIndex, gameOver: false }
}

/** Advance the chain after a correct pick */
export function advanceChain(
  chain: HskWord[],
  picked: HskWord,
  maxLevel: number,
): ChainState {
  const newChain = [...chain, picked]
  const words = getWordsUpToLevel(maxLevel)
  return nextRound(newChain, words)
}
