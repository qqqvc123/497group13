export function StepBadge({ number }: { number: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary font-mono text-sm font-bold text-primary"
    >
      {number}
    </span>
  )
}
