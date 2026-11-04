function configuredApiBase(): string {
  return (import.meta.env.VITE_API_BASE ?? '').trim().replace(/\/+$/u, '')
}

/** Same-origin `/api` unless a build explicitly sets VITE_API_BASE. */
export function apiUrl(path: string): string {
  const base = configuredApiBase()
  return base === '' ? path : `${base}${path}`
}

/** Undefined keeps Socket.IO on the page origin, which the dev proxy and the production proxy both serve. */
export function socketOrigin(): string | undefined {
  const base = configuredApiBase()
  return base === '' ? undefined : base
}
