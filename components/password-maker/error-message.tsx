import { CircleAlert } from 'lucide-react'

type ErrorMessageProps = {
  message: string
  action?: { label: string; onClick: () => void }
}

export function ErrorMessage({ message, action }: ErrorMessageProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-[10px] bg-error-surface p-4 text-error-foreground">
      <p className="flex items-start gap-2 text-pretty">
        <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="sr-only">Error: </span>
          {message}
        </span>
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="min-h-11 self-start rounded-[10px] border-2 border-error-foreground/70 px-4 font-semibold transition-colors hover:bg-error-foreground/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
