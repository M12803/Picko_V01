import readyAlertAsset from '@/assets/picko-ready-alert-loop.mp3.asset.json'

type RingControl = {
  unlock: () => Promise<boolean>
  prime: () => void
  start: () => Promise<'playing' | 'blocked'>
  stop: () => void
  close: () => void
}

/**
 * Looping ready-alert tone played through an <audio> element (works with the iPhone silent
 * switch, unlike Web Audio). Browsers only allow it after the customer taps the page once.
 */
export function createReadyRing(): RingControl {
  let audio: HTMLAudioElement | null = null
  let unlocked = false
  let running = false
  let vibrateTimer = 0
  let previewTimer = 0

  function element(): HTMLAudioElement | null {
    if (audio) return audio
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null
    audio = new Audio(readyAlertAsset.url)
    audio.loop = true
    audio.preload = 'auto'
    audio.setAttribute('playsinline', '')
    return audio
  }

  function pulse() {
    if (!running || !navigator.vibrate) return
    navigator.vibrate([90, 140, 90])
    vibrateTimer = window.setTimeout(pulse, 3200)
  }

  async function unlock() {
    const el = element()
    if (!el) return false
    if (unlocked || running) return true
    try {
      el.muted = false
      el.volume = 1
      await el.play()
      unlocked = true
      previewTimer = window.setTimeout(() => {
        if (running) return
        el.pause()
        el.currentTime = 0
      }, 500)
      return true
    } catch {
      return false
    }
  }

  function stop() {
    running = false
    window.clearTimeout(vibrateTimer)
    window.clearTimeout(previewTimer)
    navigator.vibrate?.(0)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  return {
    prime() {
      void unlock()
    },
    unlock,
    async start() {
      const el = element()
      if (!el) return 'blocked'
      if (running && !el.paused) return 'playing'
      running = true
      window.clearTimeout(previewTimer)
      el.muted = false
      el.volume = 1
      try {
        await el.play()
      } catch {
        running = false
        return 'blocked'
      }
      unlocked = true
      window.clearTimeout(vibrateTimer)
      pulse()
      return 'playing'
    },
    stop,
    close() {
      stop()
      audio = null
      unlocked = false
    },
  }
}
