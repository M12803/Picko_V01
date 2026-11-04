import type { ReactNode } from 'react'
import { Coffee } from 'lucide-react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="rounded-[1.6rem] border border-line bg-surface px-6 py-10 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-elevated text-muted">
        <Coffee className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  )
}
