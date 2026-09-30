'use client'

import { useRef, useState } from 'react'
import { KeyRound } from 'lucide-react'
import {
  type Settings,
  DEFAULT_SETTINGS,
  generatePassword,
  parseRuleText,
  validateSettings,
} from '@/lib/password'
import { RulesPanel, type WorkshopError } from './rules-panel'
import { ResultPanel } from './result-panel'

const HINT_DEFAULT = 'Separate rules with commas, as shown above.'

function errorFromValidation(settings: Settings): WorkshopError | null {
  const result = validateSettings(settings)
  if (result.ok) return null
  return { message: result.message, field: result.field, fixLength: result.fixLength }
}

export function PasswordWorkshop() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [sentence, setSentence] = useState('')
  const [hint, setHint] = useState(HINT_DEFAULT)
  const [error, setError] = useState<WorkshopError | null>(null)
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const passwordRef = useRef('')

  const dirty = sentence.trim().length > 0

  function clearResult() {
    passwordRef.current = ''
    setPassword('')
    setNotice('')
  }

  function applySettings(next: Settings, nextHint: string) {
    setSettings(next)
    setSentence('')
    setHint(nextHint)
    clearResult()
    setError(errorFromValidation(next))
  }

  function handleSettingsChange(next: Settings) {
    applySettings(next, 'Using the options you selected below.')
  }

  function handleSentenceChange(value: string) {
    setSentence(value)
    clearResult()
    setError(null)
    setHint(value.trim() ? 'Apply your typed rules before generating.' : HINT_DEFAULT)
  }

  function handleApply() {
    const parsed = parseRuleText(sentence)
    if (!parsed.ok) {
      setError({ message: parsed.message })
      return
    }
    applySettings(parsed.settings, 'Applied. Check your choices below.')
  }

  function handleFix(length: number) {
    handleSettingsChange({ ...settings, length: String(length) })
  }

  function handleGenerate() {
    if (dirty) return
    const result = validateSettings(settings)
    if (!result.ok) {
      clearResult()
      setError(errorFromValidation(settings))
      return
    }
    try {
      const next = generatePassword(result.length, result.rules)
      passwordRef.current = next
      setPassword(next)
      setError(null)
      setNotice('Your new password is ready.')
    } catch {
      clearResult()
      setError({ message: 'This browser could not generate a password. Its random number feature may be unavailable.' })
    }
  }

  async function handleCopy() {
    const value = passwordRef.current
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      if (passwordRef.current === value) setNotice('Copied to clipboard.')
    } catch {
      if (passwordRef.current === value) setNotice('Copying was blocked. Select the password and copy it manually.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[20px] bg-pw-bg p-3 text-pw-ink min-[381px]:p-[18px] md:p-[26px]">
      <header className="flex flex-col items-start justify-between gap-3 border-b border-pw-line pb-[18px] min-[381px]:flex-row min-[381px]:items-center">
        <div className="flex flex-wrap items-center gap-2 font-bold">
          <KeyRound className="size-5 text-pw-green" aria-hidden="true" />
          Password Workshop
        </div>
        <span className="whitespace-nowrap rounded-full border border-pw-line px-2.5 py-0.5 text-xs tracking-wider text-pw-sub">
          {'PROTOTYPE · 01'}
        </span>
      </header>

      <div className="pb-6 pt-[26px]">
        <h1 className="mb-2 text-balance text-[25px] font-bold leading-snug tracking-tight md:text-[28px]">
          Your rules.
          <br />A password that fits.
        </h1>
        <p className="text-[15px] text-pw-sub">{'Pick what you need. We’ll check every box.'}</p>
      </div>

      <div className="grid items-start gap-[18px] md:grid-cols-[1.15fr_1fr]">
        <RulesPanel
          settings={settings}
          sentence={sentence}
          hint={hint}
          error={error}
          generateDisabled={dirty}
          onSentenceChange={handleSentenceChange}
          onApply={handleApply}
          onSettingsChange={handleSettingsChange}
          onFix={handleFix}
          onGenerate={handleGenerate}
        />
        <ResultPanel
          settings={settings}
          password={password}
          notice={notice}
          onCopy={handleCopy}
          onRegenerate={handleGenerate}
        />
      </div>

      <p className="mt-[18px] text-center text-xs text-pw-sub">
        {'Choose → Create → Check · One password, made to fit'}
      </p>
    </div>
  )
}
