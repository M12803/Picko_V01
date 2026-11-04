import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReadyRing } from '@/features/picko/components/track/readyRing'
import asset from '@/assets/picko-ready-alert-loop.mp3.asset.json'

describe('Customer sound activation', () => {
  let audio: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; setAttribute: ReturnType<typeof vi.fn>; muted: boolean; paused: boolean; currentTime: number; loop: boolean; volume: number }
  beforeEach(() => {
    vi.useFakeTimers()
    audio = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), setAttribute: vi.fn(), muted: false, paused: true, currentTime: 0, loop: false, volume: 0 }
    vi.stubGlobal('Audio', vi.fn(function () { return audio }))
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
  it('enables only after successful unmuted playback of the uploaded original MP3', async () => {
    const ring = createReadyRing()
    expect(await ring.unlock()).toBe(true)
    expect(Audio).toHaveBeenCalledWith(asset.url)
    expect(audio.muted).toBe(false)
    expect(audio.play).toHaveBeenCalledTimes(1)
    ring.close()
  })
  it('keeps activation retryable when the browser rejects playback', async () => {
    audio.play.mockRejectedValueOnce(new Error('NotAllowedError'))
    const ring = createReadyRing()
    expect(await ring.unlock()).toBe(false)
    expect(await ring.unlock()).toBe(true)
    expect(audio.play).toHaveBeenCalledTimes(2)
    ring.close()
  })
  it('keeps the ready alert running after the activation preview and stops on pickup', async () => {
    const ring = createReadyRing()
    await ring.unlock()
    expect(await ring.start()).toBe('playing')
    vi.advanceTimersByTime(500)
    expect(audio.pause).not.toHaveBeenCalled()
    ring.stop()
    expect(audio.pause).toHaveBeenCalledTimes(1)
    expect(audio.currentTime).toBe(0)
    ring.close()
  })
})