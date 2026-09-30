import { Check, Circle, Copy, RefreshCw } from 'lucide-react'
import { type Settings, CHAR_META, CHAR_TYPES, countByType } from '@/lib/password'
import type { GeneratedResult } from './password-maker'
import { StepBadge } from './step-badge'

type ResultPanelProps = {
  settings: Settings
  result: GeneratedResult | null
  status: string
  onCopy: () => void
  onRegenerate: () => void
}

type ChecklistItem = { key: string; label: string; met: boolean }

function buildChecklist(settings: Settings, result: GeneratedResult | null): ChecklistItem[] {
  if (result) {
    const counts = countByType(result.password)
    return [
      { key: 'length', label: `${result.length} characters long`, met: result.password.length === result.length },
      ...result.rules.map((rule) => ({
        key: rule.type,
        label: `At least ${rule.min} ${CHAR_META[rule.type].plural}`,
        met: counts[rule.type] >= rule.min,
      })),
    ]
  }
  return [
    { key: 'length', label: `${settings.length || '?'} characters long`, met: false },
    ...CHAR_TYPES.filter((t) => settings.types[t].checked).map((type) => ({
      key: type,
      label: `At least ${settings.types[type].min || '?'} ${CHAR_META[type].plural}`,
      met: false,
    })),
  ]
}

const secondaryButton =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border-2 border-primary bg-card px-4 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-success-surface disabled:cursor-not-allowed disabled:opacity-50'

export function ResultPanel({ settings, result, status, onCopy, onRegenerate }: ResultPanelProps) {
  const checklist = buildChecklist(settings, result)
  const typeCount = result ? result.rules.length : CHAR_TYPES.filter((t) => settings.types[t].checked).length
  const length = result ? result.length : settings.length || '?'

  return (
    <section
      aria-labelledby="step-3-title"
      className="rounded-[20px] border border-border bg-success-surface p-5 text-foreground sm:p-6 min-[701px]:sticky min-[701px]:top-6"
    >
      <h2 id="step-3-title" className="flex items-center gap-3 text-lg font-semibold">
        <StepBadge number={3} />
        Your password
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        {length} characters {'·'} {typeCount} character {typeCount === 1 ? 'type' : 'types'}
      </p>

      <div className="mt-4 rounded-[10px] border-2 border-dashed border-primary/40 bg-card p-4">
        {result ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Check className="size-4" aria-hidden="true" />
              All your rules are met
            </p>
            <p
              className="mt-2 select-all break-all font-mono text-2xl leading-snug"
              aria-label={`Generated password: ${result.password}`}
            >
              {result.password}
            </p>
          </>
        ) : (
          <div className="py-2">
            <p className="font-semibold">Your password will appear here</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose your rules, then select Make my password.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onCopy} disabled={!result} className={secondaryButton}>
          <Copy className="size-4" aria-hidden="true" />
          Copy password
        </button>
        <button type="button" onClick={onRegenerate} disabled={!result} className={secondaryButton}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Make another
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm font-medium">
        {status === 'All your rules are met' ? <span className="sr-only">Password made. {status}.</span> : status}
      </p>

      <h3 className="mt-4 font-semibold">Checklist</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {checklist.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            {item.met ? (
              <Check className="size-5 shrink-0 rounded-full bg-primary p-0.5 text-primary-foreground" aria-hidden="true" />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span>{item.label}</span>
            <span className={item.met ? 'ml-auto text-sm font-semibold text-primary' : 'ml-auto text-sm text-muted-foreground'}>
              {item.met ? 'Met' : 'Pending'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
