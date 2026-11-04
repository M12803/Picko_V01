import { X } from 'lucide-react'
import { CashierOrderList } from '../orders/CashierOrderList.tsx'
import { cn } from '../../utils/cn.ts'

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <aside
      id="app-sidebar"
      aria-label="الطلبات"
      className={cn(
        'fixed inset-y-0 start-0 z-40 w-72 flex-col border-e border-line bg-surface',
        mobileOpen ? 'flex' : 'hidden lg:flex',
      )}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        <h2 className="text-base font-semibold text-ink">الطلبات</h2>
        <button
          type="button"
          className="ms-auto rounded-lg p-2 text-muted hover:bg-elevated lg:hidden"
          aria-label="إغلاق الطلبات"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <CashierOrderList />
      </div>
    </aside>
  )
}
