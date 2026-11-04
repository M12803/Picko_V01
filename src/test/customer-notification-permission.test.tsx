import { render, waitFor, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { EnableNotifications } from '@/features/picko/components/track/EnableNotifications'
import { fetchPushPublicKey } from '@/features/picko/services/api/ordersApi'

vi.mock('@/features/picko/services/api/ordersApi', () => ({ fetchPushPublicKey: vi.fn(), savePushSubscription: vi.fn() }))
vi.mock('@/features/picko/utils/pushCapability', () => ({ readPushCapability: vi.fn(), pushBlockReason: () => null }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })
it('does not request notification permission when the notification service is unavailable', async () => {
  const requestPermission = vi.fn()
  vi.stubGlobal('Notification', { permission: 'default', requestPermission })
  vi.mocked(fetchPushPublicKey).mockRejectedValue(new Error('unavailable'))
  const { container } = render(<EnableNotifications token="test-token" />)
  await waitFor(() => expect(fetchPushPublicKey).toHaveBeenCalledTimes(1))
  expect(requestPermission).not.toHaveBeenCalled()
  expect(container.childElementCount).toBe(0)
})