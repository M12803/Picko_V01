import { createRoot, type Root } from 'react-dom/client'
import { ThermalSlip } from './ThermalSlip.tsx'

const HOST_ID = 'thermal-print-host'

let root: Root | null = null
let printing = false
let session = 0

function hostElement(): HTMLElement {
  const existing = document.getElementById(HOST_ID)
  if (existing) return existing

  const host = document.createElement('div')
  host.id = HOST_ID
  host.className = 'thermal-print-host'
  host.setAttribute('aria-hidden', 'true')
  document.body.appendChild(host)
  return host
}

function reactRoot(): Root {
  if (!root) root = createRoot(hostElement())
  return root
}

/**
 * Prints the existing tracking QR. The token and URL are reused as given.
 * Cancelling the dialog does not write order data; afterprint only removes the slip.
 */
export type PrintSlipResult = 'opened' | 'busy' | 'invalid' | 'failed'

export function printTrackingSlip(slip: {
  orderCode: string
  trackingUrl: string
}): Promise<PrintSlipResult> {
  const orderCode = slip.orderCode.trim()
  const trackingUrl = slip.trackingUrl.trim()
  if (!orderCode || !trackingUrl) return Promise.resolve('invalid')
  if (printing) return Promise.resolve('busy')

  printing = true
  const current = session + 1
  session = current

  reactRoot().render(<ThermalSlip orderCode={orderCode} trackingUrl={trackingUrl} />)

  const finish = () => {
    if (current !== session) return
    window.removeEventListener('afterprint', finish)
    printing = false
    reactRoot().render(null)
  }

  window.addEventListener('afterprint', finish)

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (current !== session) {
          resolve('failed')
          return
        }
        try {
          window.print()
          resolve('opened')
        } catch {
          finish()
          resolve('failed')
        }
      })
    })
  })
}
