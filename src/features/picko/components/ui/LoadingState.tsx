function Block({ className }: { className: string }) {
  return <div className={`rounded-lg bg-elevated ${className}`} />
}

export function LoadingState({ withCards = false }: { withCards?: boolean }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <p className="text-sm text-muted">بنحمّل الأوردرات...</p>
      {withCards ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Block key={index} className="h-24" />
          ))}
        </div>
      ) : null}
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <Block className="h-10" />
        {Array.from({ length: 5 }, (_, index) => (
          <Block key={index} className="h-12" />
        ))}
      </div>
    </div>
  )
}
