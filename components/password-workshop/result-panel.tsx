import { Check, Copy, RefreshCw } from 'lucide-react'
import { type Settings, CHAR_META, CHAR_TYPES, countByType, parseWholeNumber, LENGTH_MAX, LENGTH_MIN } from '@/lib/password'
import { StepNumber } from './step-number'
import { secondaryButton } from './rules-panel'

type ResultPanelProps = {
  settings: Settings
  password: string
  notice: string
  onCopy: () => void
  onRegenerate: () => void
}

type CheckRow = { label: string; pass: boolean }

function buildChecks(settings: Settings, password: string): { rows: CheckRow[]; summary: string } {
  const length = parseWholeNumber(settings.length, LENGTH_MIN, LENGTH_MAX)
  const selected = CHAR_TYPES.filter((t) => settings.types[t].checked)
  const counts = countByType(password)

  const rows: CheckRow[] = [
    {
      label: length !== null ? `At least ${length} characters` : 'Check the length setting',
      pass: !!password && length !== null && password.length >= length,
    },
    ...selected.map((type) => {
      const min = Number(settings.types[type].min)
      const noun = type === 'uppercase' || type === 'lowercase' ? `${CHAR_META[type].plural} letter` : CHAR_META[type].label.toLowerCase()
      return {
        label: `At least ${min} ${noun}${min === 1 ? '' : 's'}`,
        pass: !!password && counts[type] >= min,
      }
    }),
  ]

  const summary = `${length !== null ? `${length} characters` : 'Check the length'} · ${selected.length} character type${selected.length === 1 ? '' : 's'}`
  return { rows, summary }
}

export function ResultPanel({ settings, password, notice, onCopy, onRegenerate }: ResultPanelProps) {
  const { rows, summary } = buildChecks(settings, password)

  return (
    <section
      aria-labelledby="result-title"
      className="min-w-0 rounded-[20px] border border-pw-line bg-pw-mint p-3.5 min-[381px]:p-[18px] md:p-[22px]"
    >
      <h2 id="result-title" className="mb-[18px] flex flex-wrap items-center gap-2.5 text-lg font-bold tracking-tight">
        <StepNumber value="02" />
        Your password
      </h2>
      <p className="mb-2.5 text-[13px] text-pw-sub">{summary}</p>

      <div
        aria-live="polite"
        className="flex min-h-[126px] flex-col justify-center gap-2 rounded-[14px] border border-dashed border-pw-line bg-pw-paper px-4 py-[22px]"
      >
        {password ? (
          <code className="select-all break-all font-mono text-2xl leading-relaxed tracking-wider text-pw-ink">
            {password}
          </code>
        ) : (
          <>
            <strong className="text-base font-semibold">Your password will appear here</strong>
            <span className="text-xs text-pw-sub">Choose your rules, then select Make my password.</span>
          </>
        )}
      </div>

      <div className="mb-2 mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onCopy} disabled={!password} className={`${secondaryButton} flex-1 whitespace-nowrap`}>
          <Copy className="size-4" aria-hidden="true" />
          Copy password
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={!password}
          className={`${secondaryButton} flex-1 whitespace-nowrap`}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Make another
        </button>
      </div>
      <p role="status" className="min-h-[22px] break-words text-[13px] text-pw-sub">
        {notice}
      </p>

      <h3 className="mb-3 mt-5 text-[15px] font-bold">{password ? 'All your rules are met' : 'Your rule checklist'}</h3>
      <ul className="grid gap-3" aria-label="Rule checklist">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-wrap items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className={`inline-flex size-[22px] shrink-0 items-center justify-center rounded-full text-[13px] ${row.pass ? 'bg-pw-green text-pw-on' : 'bg-pw-paper text-pw-sub'}`}
            >
              {row.pass ? <Check className="size-3.5" strokeWidth={3} /> : '·'}
            </span>
            <span>
              {row.label}
              {row.pass ? <span className="sr-only"> met</span> : ' · pending'}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-[22px] border-t border-pw-line pt-3 text-xs text-pw-sub">
        Your password stays on this screen.
        <br />
        {'We don’t save generated passwords.'}
      </p>
    </section>
  )
}
