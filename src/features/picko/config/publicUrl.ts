import { routes } from '../routes.ts'

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, '')
}

/**
 * Origin embedded in customer QR codes.
 * Set VITE_PUBLIC_BASE_URL when the public site origin differs from the page
 * the cashier has open. Otherwise the origin of this running app is used.
 */
export function getPublicBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.trim()
  if (configured) return stripTrailingSlash(configured)
  return window.location.origin
}

export function trackingPath(token: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/u, '')
  return `${basePath}${routes.track}/${encodeURIComponent(token)}`
}

/** Full customer URL. This string is what the QR code encodes. */
export function buildTrackingUrl(token: string): string {
  return `${getPublicBaseUrl()}${trackingPath(token)}`
}
