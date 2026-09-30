'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import {
  type CharType,
  type Rule,
  type Settings,
  DEFAULT_SETTINGS,
  generatePassword,
  parseRuleText,
  validateSettings,
} from '@/lib/password'
import { RulesText } from './rules-text'
import { ManualOptions } from './manual-options'
import { ResultPanel } from './result-panel'
import { ErrorMessage } from './error-message'

export type FormError = {
  message: string
  field?: 'length' | CharType
  fixLength?: number
}

export type GeneratedResult = { password: string; length: number; rules: Rule[] }

export function PasswordMaker() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [ruleText, setRuleText] = useState('')
  const [textPending, setTextPending] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [textStatus, setTextStatus] = useState('')
  const [formError, setFormError] = useState<FormError | null>(null)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [resultStatus, setResultStatus] = useState('')

  function clearResult() {
    setResult(null)
    setResultStatus('')
  }

  function handleTextChange(value: string) {
    setRuleText(value)
    setTextPending(value.trim().length > 0)
    setTextError(null)
    setTextStatus('')
    setFormError(null)
    clearResult()
  }

  function handleApply() {
    const parsed = parseRuleText(ruleText)
    if (!parsed.ok) {
      setTextError(parsed.message)
      setTextStatus('')
      return
    }
    setSettings(parsed.settings)
    setTextPending(false)
    setTextError(null)
    setFormError(null)
    setTextStatus('Applied. Check your choices below.')
    clearResult()
  }

  function handleSettingsChange(next: Settings) {
    setSettings(next)
    if (ruleText) setRuleText('')
    setTextPending(false)
    setTextError(null)
    setTextStatus('')
    setFormError(null)
    clearResult()
  }

  function handleGenerate() {
    if (textPending) {
      setFormError({ message: 'Apply your typed rules before generating.' })
      clearResult()
      return
    }
    const validation = validateSettings(settings)
    if (!validation.ok) {
      setFormError({ message: validation.message, field: validation.field, fixLength: validation.fixLength })
      clearResult()
      return
    }
    try {
      const password = generatePassword(validation.length, validation.rules)
      setFormError(null)
      setResult({ password, length: validation.length, rules: validation.rules })
      setResultStatus('All your rules are met')
    } catch {
      setFormError({ message: 'Something went wrong while making your password. Please try again.' })
      clearResult()
    }
  }

  function handleFixLength(length: number) {
    handleSettingsChange({ ...settings, length: String(length) })
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.password)
      setResultStatus('Copied to clipboard.')
    } catch {
      setResultStatus('Copying was blocked. Select the password and copy it manually.')
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <KeyRound className="size-5" />
        </span>
        <div>
          <h1 className="text-balance text-[28px] font-semibold leading-tight">Password Maker</h1>
          <p className="mt-1 text-pretty text-muted-foreground">
            Tell us what a website requires, and we&apos;ll make a password that follows every rule.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 min-[701px]:grid-cols-2">
        <div className="flex flex-col gap-6">
          <RulesText
            value={ruleText}
            onChange={handleTextChange}
            onApply={handleApply}
            error={textError}
            status={textStatus}
          />
          <section
            aria-labelledby="step-2-title"
            className="rounded-[20px] border border-border bg-card p-5 text-card-foreground sm:p-6"
          >
            <ManualOptions settings={settings} onChange={handleSettingsChange} invalidField={formError?.field} />

            <div className="mt-6 flex flex-col gap-3">
              {formError && (
                <ErrorMessage
                  message={formError.message}
                  action={
                    formError.fixLength
                      ? {
                          label: `Use ${formError.fixLength} characters`,
                          onClick: () => handleFixLength(formError.fixLength!),
                        }
                      : undefined
                  }
                />
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={textPending}
                aria-describedby={textPending ? 'apply-first-hint' : undefined}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="size-5" aria-hidden="true" />
                Make my password
              </button>
              {textPending && (
                <p id="apply-first-hint" className="text-sm text-muted-foreground">
                  Apply your typed rules before generating.
                </p>
              )}
            </div>
          </section>
        </div>

        <ResultPanel
          settings={settings}
          result={result}
          status={resultStatus}
          onCopy={handleCopy}
          onRegenerate={handleGenerate}
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Passwords are made in your browser and are never sent anywhere or saved.
      </p>
    </main>
  )
}
