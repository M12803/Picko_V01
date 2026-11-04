const TOKEN_BYTES = 32

/**
 * 256-bit tracking id from the Web Crypto API.
 * Math.random() is intentionally not used.
 */
export function createTrackingToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return encodeBase64Url(bytes)
}

export function createUniqueTrackingToken(used: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = createTrackingToken()
    if (!used.has(token)) return token
  }

  throw new Error('Could not create a unique tracking token')
}

/** Matches tokens produced by createTrackingToken. */
export function isTrackingToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}
