export type CharType = 'uppercase' | 'lowercase' | 'number' | 'symbol'

export const CHAR_TYPES: CharType[] = ['uppercase', 'lowercase', 'number', 'symbol']

export const CHAR_SETS: Record<CharType, string> = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  symbol: '!@#$%&*?',
}

export const CHAR_META: Record<CharType, { icon: string; label: string; plural: string }> = {
  uppercase: { icon: 'A', label: 'Uppercase', plural: 'uppercase' },
  lowercase: { icon: 'a', label: 'Lowercase', plural: 'lowercase' },
  number: { icon: '1', label: 'Numbers', plural: 'numbers' },
  symbol: { icon: '#', label: 'Symbols', plural: 'symbols' },
}

export const LENGTH_MIN = 4
export const LENGTH_MAX = 64
export const COUNT_MIN = 1
export const COUNT_MAX = 16

export type TypeSetting = { checked: boolean; min: string }
export type Settings = { length: string; types: Record<CharType, TypeSetting> }
export type Rule = { type: CharType; min: number }

export const DEFAULT_SETTINGS: Settings = {
  length: '12',
  types: {
    uppercase: { checked: true, min: '1' },
    lowercase: { checked: true, min: '1' },
    number: { checked: true, min: '1' },
    symbol: { checked: true, min: '1' },
  },
}

export function parseWholeNumber(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  const n = Number(value.trim())
  return n >= min && n <= max ? n : null
}

export const lengthErrorMessage = `For this prototype, enter a whole number from ${LENGTH_MIN} to ${LENGTH_MAX} for the length.`
export const countErrorMessage = (type: CharType) =>
  `Enter a whole number from ${COUNT_MIN} to ${COUNT_MAX} for ${CHAR_META[type].plural}.`

export type ValidationResult =
  | { ok: true; length: number; rules: Rule[] }
  | { ok: false; message: string; field?: 'length' | CharType; fixLength?: number; kind: 'length' | 'count' | 'none' | 'conflict' }

export function validateSettings(settings: Settings): ValidationResult {
  const length = parseWholeNumber(settings.length, LENGTH_MIN, LENGTH_MAX)
  if (length === null) return { ok: false, kind: 'length', field: 'length', message: lengthErrorMessage }

  const selected = CHAR_TYPES.filter((t) => settings.types[t].checked)
  if (selected.length === 0) {
    return { ok: false, kind: 'none', message: 'What should we include? Choose at least one character type.' }
  }

  const rules: Rule[] = []
  for (const type of selected) {
    const min = parseWholeNumber(settings.types[type].min, COUNT_MIN, COUNT_MAX)
    if (min === null) return { ok: false, kind: 'count', field: type, message: countErrorMessage(type) }
    rules.push({ type, min })
  }

  const required = rules.reduce((sum, r) => sum + r.min, 0)
  if (required > length) {
    return {
      ok: false,
      kind: 'conflict',
      field: 'length',
      fixLength: required,
      message: `Your length is ${length}, but your rules need ${required} characters. Increase the length or lower the minimum counts.`,
    }
  }

  return { ok: true, length, rules }
}

function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buf)
    value = buf[0]
  } while (value >= limit)
  return value % max
}

function pick(set: string): string {
  return set[randomInt(set.length)]
}

export function countByType(password: string): Record<CharType, number> {
  const counts: Record<CharType, number> = { uppercase: 0, lowercase: 0, number: 0, symbol: 0 }
  for (const ch of password) {
    for (const type of CHAR_TYPES) {
      if (CHAR_SETS[type].includes(ch)) counts[type]++
    }
  }
  return counts
}

export function meetsRules(password: string, length: number, rules: Rule[]): boolean {
  if (password.length !== length) return false
  const allowed = rules.map((r) => CHAR_SETS[r.type]).join('')
  if ([...password].some((ch) => !allowed.includes(ch))) return false
  const counts = countByType(password)
  return rules.every((r) => counts[r.type] >= r.min)
}

export function generatePassword(length: number, rules: Rule[]): string {
  const pool = rules.map((r) => CHAR_SETS[r.type]).join('')
  for (let attempt = 0; attempt < 10; attempt++) {
    const chars: string[] = []
    for (const rule of rules) {
      for (let i = 0; i < rule.min; i++) chars.push(pick(CHAR_SETS[rule.type]))
    }
    while (chars.length < length) chars.push(pick(pool))
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    const password = chars.join('')
    if (meetsRules(password, length, rules)) return password
  }
  throw new Error('Could not generate a password that meets the rules.')
}

const PHRASES: { pattern: RegExp; key: 'length' | CharType }[] = [
  { pattern: /^(\d+)\s+characters?\s+minimum$/, key: 'length' },
  { pattern: /^(\d+)\s+uppercase$/, key: 'uppercase' },
  { pattern: /^(\d+)\s+lowercase$/, key: 'lowercase' },
  { pattern: /^(\d+)\s+numbers?$/, key: 'number' },
  { pattern: /^(\d+)\s+symbols?$/, key: 'symbol' },
]

export type ParseResult = { ok: true; settings: Settings } | { ok: false; message: string }

export function parseRuleText(text: string): ParseResult {
  const parts = text
    .split(',')
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter(Boolean)

  if (parts.length === 0) {
    return { ok: false, message: 'Type your rules first, or use the options below.' }
  }

  const found: Partial<Record<'length' | CharType, string>> = {}
  for (const part of parts) {
    const lower = part.toLowerCase()
    const match = PHRASES.find((p) => p.pattern.test(lower))
    if (!match) {
      return {
        ok: false,
        message: `We couldn\u2019t read this part: \u2018${part}\u2019. Follow the example or use the options below.`,
      }
    }
    if (found[match.key] !== undefined) {
      return { ok: false, message: 'A rule appears twice. Please list each rule only once.' }
    }
    found[match.key] = lower.match(match.pattern)![1]
  }

  if (found.length === undefined) {
    return { ok: false, message: 'Add a length, such as \u201812 characters minimum\u2019.' }
  }
  if (parseWholeNumber(found.length, LENGTH_MIN, LENGTH_MAX) === null) {
    return { ok: false, message: lengthErrorMessage }
  }

  const listedTypes = CHAR_TYPES.filter((t) => found[t] !== undefined)
  if (listedTypes.length === 0) {
    return { ok: false, message: 'What should we include? Add at least one character type, such as \u20181 number\u2019.' }
  }
  for (const type of listedTypes) {
    if (parseWholeNumber(found[type]!, COUNT_MIN, COUNT_MAX) === null) {
      return { ok: false, message: countErrorMessage(type) }
    }
  }

  const types = {} as Record<CharType, TypeSetting>
  for (const type of CHAR_TYPES) {
    const value = found[type]
    types[type] = value !== undefined ? { checked: true, min: String(Number(value)) } : { checked: false, min: '1' }
  }

  return { ok: true, settings: { length: String(Number(found.length)), types } }
}
