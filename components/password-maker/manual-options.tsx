import {
  type CharType,
  type Settings,
  CHAR_META,
  CHAR_SETS,
  CHAR_TYPES,
  COUNT_MAX,
  COUNT_MIN,
  LENGTH_MAX,
  LENGTH_MIN,
} from '@/lib/password'
import { StepBadge } from './step-badge'

type ManualOptionsProps = {
  settings: Settings
  onChange: (settings: Settings) => void
  invalidField?: 'length' | CharType
}

const inputClass =
  'w-20 rounded-[10px] border-2 border-input bg-background px-3 py-2 text-base tabular-nums focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error-foreground'

export function ManualOptions({ settings, onChange, invalidField }: ManualOptionsProps) {
  function updateType(type: CharType, patch: Partial<Settings['types'][CharType]>) {
    onChange({ ...settings, types: { ...settings.types, [type]: { ...settings.types[type], ...patch } } })
  }

  return (
    <>
      <h2 id="step-2-title" className="flex items-center gap-3 text-lg font-semibold">
        <StepBadge number={2} />
        Choose your rules
      </h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-muted px-4 py-3">
        <label htmlFor="length" className="font-medium">
          Password length
          <span className="block text-sm font-normal text-muted-foreground">
            {LENGTH_MIN}
            {'–'}
            {LENGTH_MAX} characters
          </span>
        </label>
        <input
          id="length"
          type="number"
          inputMode="numeric"
          min={LENGTH_MIN}
          max={LENGTH_MAX}
          step={1}
          value={settings.length}
          onChange={(e) => onChange({ ...settings, length: e.target.value })}
          aria-invalid={invalidField === 'length' ? true : undefined}
          className={inputClass}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="font-medium">Include these characters</legend>
        <ul className="mt-2 flex flex-col divide-y divide-border rounded-[10px] border border-border">
          {CHAR_TYPES.map((type) => {
            const meta = CHAR_META[type]
            const setting = settings.types[type]
            const checkboxId = `include-${type}`
            const minId = `min-${type}`
            return (
              <li key={type} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={setting.checked}
                    onChange={(e) => updateType(type, { checked: e.target.checked })}
                    className="size-5 shrink-0 accent-primary"
                  />
                  <label htmlFor={checkboxId} className="flex min-h-11 items-center gap-3 font-medium">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono font-bold text-accent-foreground"
                    >
                      {meta.icon}
                    </span>
                    {meta.label}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={minId} className="text-sm text-muted-foreground">
                    At least
                  </label>
                  <input
                    id={minId}
                    type="number"
                    inputMode="numeric"
                    min={COUNT_MIN}
                    max={COUNT_MAX}
                    step={1}
                    value={setting.min}
                    disabled={!setting.checked}
                    onChange={(e) => updateType(type, { min: e.target.value })}
                    aria-label={`Minimum ${meta.plural}`}
                    aria-invalid={invalidField === type ? true : undefined}
                    className={inputClass}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <p className="mt-3 text-sm text-muted-foreground">
        Symbols used: <span className="font-mono text-foreground">{CHAR_SETS.symbol.split('').join(' ')}</span>
      </p>
    </>
  )
}
