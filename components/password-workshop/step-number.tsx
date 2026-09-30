export function StepNumber({ value }: { value: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-pw-green text-xs text-pw-on"
    >
      {value}
    </span>
  )
}
