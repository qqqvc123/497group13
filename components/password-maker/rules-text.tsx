import { ArrowDown } from 'lucide-react'
import { ErrorMessage } from './error-message'
import { StepBadge } from './step-badge'

type RulesTextProps = {
  value: string
  onChange: (value: string) => void
  onApply: () => void
  error: string | null
  status: string
}

export function RulesText({ value, onChange, onApply, error, status }: RulesTextProps) {
  return (
    <section
      aria-labelledby="step-1-title"
      className="rounded-[20px] border border-border bg-card p-5 text-card-foreground sm:p-6"
    >
      <h2 id="step-1-title" className="flex items-center gap-3 text-lg font-semibold">
        <StepBadge number={1} />
        Paste the website&apos;s rules
        <span className="text-sm font-normal text-muted-foreground">(optional)</span>
      </h2>

      <label htmlFor="rule-text" className="mt-4 block font-medium">
        Password requirements
      </label>
      <p id="rule-text-hint" className="mt-1 text-sm text-muted-foreground">
        Example: 12 characters minimum, 1 uppercase, 1 number, 1 symbol
      </p>
      <textarea
        id="rule-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-describedby="rule-text-hint"
        aria-invalid={error ? true : undefined}
        placeholder="12 characters minimum, 1 uppercase, 1 number, 1 symbol"
        className="mt-2 w-full resize-y rounded-[10px] border-2 border-input bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-error-foreground"
      />

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={onApply}
          disabled={!value.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[10px] border-2 border-primary px-4 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply rules
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
        {error && <ErrorMessage message={error} />}
        <p role="status" className="text-sm font-medium text-primary empty:hidden">
          {status}
        </p>
      </div>
    </section>
  )
}
