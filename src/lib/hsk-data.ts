import hsk1Raw from '../../data/hsk1.csv?raw'
import hsk2Raw from '../../data/hsk2.csv?raw'
import hsk3Raw from '../../data/hsk3.csv?raw'
import hsk4Raw from '../../data/hsk4.csv?raw'
import hsk5Raw from '../../data/hsk5.csv?raw'
import hsk6Raw from '../../data/hsk6.csv?raw'

export interface HskWord {
  hanzi: string
  pinyin: string
  english: string
  level: number
}

function parseCsv(raw: string, level: number): HskWord[] {
  return raw
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [hanzi, pinyin, ...rest] = line.split(',')
      return {
        hanzi: hanzi.trim(),
        pinyin: pinyin.trim(),
        english: rest.join(',').trim(),
        level,
      }
    })
}

const hsk1 = parseCsv(hsk1Raw, 1)
const hsk2 = parseCsv(hsk2Raw, 2)
const hsk3 = parseCsv(hsk3Raw, 3)
const hsk4 = parseCsv(hsk4Raw, 4)
const hsk5 = parseCsv(hsk5Raw, 5)
const hsk6 = parseCsv(hsk6Raw, 6)

const allWords: HskWord[] = [...hsk1, ...hsk2, ...hsk3, ...hsk4, ...hsk5, ...hsk6]

/** Get all words up to and including the given HSK level, filtered to 2+ characters */
export function getWordsUpToLevel(maxLevel: number): HskWord[] {
  return allWords.filter((w) => w.level <= maxLevel && w.hanzi.length >= 2)
}

/** Get all single characters for filler */
export function getFillerCharacters(maxLevel: number): string[] {
  return allWords
    .filter((w) => w.level <= maxLevel && w.hanzi.length === 1)
    .map((w) => w.hanzi)
}

/** Get pinyin for a single character (first match from single-char HSK words) */
const charPinyinMap: Map<string, string> = new Map()
for (const w of allWords) {
  if (w.hanzi.length === 1 && !charPinyinMap.has(w.hanzi)) {
    charPinyinMap.set(w.hanzi, w.pinyin)
  }
}

export function getCharPinyin(char: string): string | null {
  return charPinyinMap.get(char) ?? null
}

/** Get all characters from all words for filler fallback */
export function getAllCharacters(maxLevel: number): string[] {
  const chars = new Set<string>()
  allWords
    .filter((w) => w.level <= maxLevel)
    .forEach((w) => {
      for (const ch of w.hanzi) {
        chars.add(ch)
      }
    })
  return Array.from(chars)
}
