import { ClientOnly, Outlet, useRouterState } from '@tanstack/react-router'
import { SettingsProvider } from './state/SettingsProvider'
import { OrdersProvider } from './state/OrdersProvider'
import { AppShell } from './components/layout/AppShell'

export function PickoLayout() {
  const tracking = useRouterState({ select: state => state.location.pathname.startsWith('/track/') })
  return (
    <ClientOnly fallback={<div className="min-h-svh bg-app" />}>
      <SettingsProvider>
        {tracking ? <Outlet /> : <OrdersProvider><AppShell /></OrdersProvider>}
      </SettingsProvider>
    </ClientOnly>
  )
}