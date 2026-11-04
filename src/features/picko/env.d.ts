/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_BASE_URL?: string
  readonly VITE_API_BASE?: string
}

interface Window {
  webkitAudioContext?: typeof AudioContext
}
