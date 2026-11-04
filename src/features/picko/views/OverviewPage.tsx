import { useState } from 'react'
import { QrIssueForm } from '../components/qr/QrIssueForm.tsx'
import type { Order } from '../types/order.ts'

export function OverviewPage() {
  const [preview, setPreview] = useState<{ order: Order; trackingUrl: string } | null>(null)

  return (
    <QrIssueForm
      preview={preview?.order ?? null}
      trackingUrl={preview?.trackingUrl ?? null}
      onIssued={(order, trackingUrl) => {
        setPreview({ order, trackingUrl })
      }}
    />
  )
}
