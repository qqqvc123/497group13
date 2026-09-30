import { WandSparkles } from 'lucide-react'
import {
  type CharType,
  type Settings,
  CHAR_META,
  CHAR_TYPES,
  COUNT_MAX,
  COUNT_MIN,
  LENGTH_MAX,
  LENGTH_MIN,
} from '@/lib/password'
import { StepNumber } from './step-number'

export type WorkshopError = { message: string; field?: 'length' | CharType; fixLength?: number }

type RulesPanelProps = {
  settings: Settings
  sentence: string
  hint: string
  error: WorkshopError | null
  generateDisabled: boolean
  onSentenceChange: (value: string) => void
  onApply: () => void
  onSettingsChange: (settings: Settings) => void
  onFix: (length: number) => void
  onGenerate: () => void
}

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-pw-green'
const numberInput = `h-[42px] w-[62px] rounded-[9px] border border-pw-line bg-pw-paper text-center text-base text-pw-ink tabular-nums aria-invalid:border-2 aria-invalid:border-pw-warnink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
export const secondaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-pw-line bg-pw-paper px-3.5 py-2 text-sm font-semibold text-pw-ink transition-colors hover:bg-pw-mint disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-pw-paper ${focusRing}`

export function RulesPanel({
  settings,
  sentence,
  hint,
  error,
  generateDisabled,
  onSentenceChange,
  onApply,
  onSettingsChange,
  onFix,
  onGenerate,
}: RulesPanelProps) {
  function updateType(type: CharType, patch: Partial<Settings['types'][CharType]>) {
    onSettingsChange({ ...settings, types: { ...settings.types, [type]: { ...settings.types[type], ...patch } } })
  }

  return (
    <section
      aria-labelledby="rules-title"
      className="min-w-0 rounded-[20px] border border-pw-line bg-pw-paper p-3.5 min-[381px]:p-[18px] md:p-[22px]"
    >
      <h2 id="rules-title" className="mb-[18px] flex flex-wrap items-center gap-2.5 text-lg font-bold tracking-tight">
        <StepNumber value="01" />
        Choose your rules
      </h2>

      <label htmlFor="pw-sentence" className="mb-2 block text-sm font-semibold">
        Type your requirements
      </label>
      <textarea
        id="pw-sentence"
        value={sentence}
        onChange={(e) => onSentenceChange(e.target.value)}
        placeholder="12 characters minimum, 1 uppercase, 1 number, 1 symbol"
        aria-describedby="pw-syntax"
        className={`min-h-[84px] w-full resize-y rounded-[10px] border border-pw-line bg-pw-paper p-3 text-base text-pw-ink placeholder:text-pw-sub ${focusRing}`}
      />
      <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-2">
        <span id="pw-syntax" className="text-xs text-pw-sub" aria-live="polite">
          {hint}
        </span>
        <button type="button" onClick={onApply} className={secondaryButton}>
          {'Apply rules ↓'}
        </button>
      </div>

      <div className="my-4 flex items-center gap-2.5 text-xs text-pw-sub before:h-px before:flex-1 before:bg-pw-line after:h-px after:flex-1 after:bg-pw-line">
        or choose below
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="pw-length" className="text-[15px] font-semibold">
          Password length
        </label>
        <span className="flex items-center gap-2 text-[15px]">
          <input
            id="pw-length"
            type="number"
            inputMode="numeric"
            min={LENGTH_MIN}
            max={LENGTH_MAX}
            value={settings.length}
            onChange={(e) => onSettingsChange({ ...settings, length: e.target.value })}
            aria-invalid={error?.field === 'length' && error.fixLength === undefined ? true : undefined}
            className={numberInput}
          />
          characters
        </span>
      </div>

      <ul className="grid gap-2">
        {CHAR_TYPES.map((type) => {
          const meta = CHAR_META[type]
          const setting = settings.types[type]
          return (
            <li
              key={type}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pw-line px-2 py-2 min-[381px]:px-2.5 ${setting.checked ? 'bg-pw-mint' : 'bg-pw-paper'}`}
            >
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-1.5 text-[15px] min-[381px]:gap-2">
                <input
                  type="checkbox"
                  checked={setting.checked}
                  onChange={(e) => updateType(type, { checked: e.target.checked })}
                  className={`size-[18px] shrink-0 accent-pw-green ${focusRing}`}
                />
                <span
                  aria-hidden="true"
                  className="inline-block w-5 text-center font-mono text-xl font-bold text-pw-green min-[381px]:w-6"
                >
                  {meta.icon}
                </span>
                {meta.label}
              </label>
              <label className="flex items-center gap-1.5 text-xs text-pw-sub">
                Min.
                <input
                  type="number"
                  inputMode="numeric"
                  min={COUNT_MIN}
                  max={COUNT_MAX}
                  value={setting.min}
                  disabled={!setting.checked}
                  onChange={(e) => updateType(type, { min: e.target.value })}
                  aria-label={`Minimum ${meta.plural}${type === 'uppercase' || type === 'lowercase' ? ' letters' : ''}`}
                  aria-invalid={error?.field === type ? true : undefined}
                  className={`${numberInput} h-9 w-[54px]`}
                />
              </label>
            </li>
          )
        })}
      </ul>
      <p className="mt-2.5 text-xs text-pw-sub">{'Symbols used: ! @ # $ % & * ?'}</p>

      {error && (
        <div role="alert" className="mt-3 break-words rounded-xl bg-pw-warn p-3 text-sm text-pw-warnink">
          <p>{`! ${error.message}`}</p>
          {error.fixLength !== undefined && (
            <button type="button" onClick={() => onFix(error.fixLength!)} className={`${secondaryButton} mt-2`}>
              {`Use ${error.fixLength} characters`}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={generateDisabled}
        className={`mt-4 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[10px] border border-pw-green bg-pw-green px-3.5 text-base font-semibold text-pw-on transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      >
        <WandSparkles className="size-[18px]" aria-hidden="true" />
        Make my password
      </button>
    </section>
  )
}
