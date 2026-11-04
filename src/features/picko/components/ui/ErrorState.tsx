import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-rose-400/40 bg-surface px-6 py-10 text-center"
    >
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-rose-500/10 text-rose-300">
        <CircleAlert className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  )
}
