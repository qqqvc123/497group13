'use client'

import { useRef, useState } from 'react'
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
  const [synced, setSynced] = useState(true)
  const passwordRef = useRef('')

  const dirty = !synced

  function clearResult() {
    passwordRef.current = ''
    setPassword('')
    setNotice('')
  }

  function applySettings(next: Settings, nextHint: string) {
    setSettings(next)
    setSentence('')
    setSynced(true)
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
    if (!value.trim()) {
      setSynced(true)
      setError(errorFromValidation(settings))
      setHint(HINT_DEFAULT)
      return
    }
    const parsed = parseRuleText(value, settings.length)
    if (parsed.ok) {
      setSettings(parsed.settings)
      setSynced(true)
      setError(errorFromValidation(parsed.settings))
      setHint('Your typed rules are applied below.')
    } else {
      setSynced(false)
      setError(null)
      setHint('Keep typing. Rules update below once they can be read.')
    }
  }

  function handleApply() {
    const parsed = parseRuleText(sentence, settings.length)
    if (!parsed.ok) {
      setError({ message: parsed.message })
      return
    }
    setSettings(parsed.settings)
    setSynced(true)
    setError(errorFromValidation(parsed.settings))
    setHint('Your typed rules are applied below.')
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
      <div className="pb-6 pt-2">
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
    </div>
  )
}
