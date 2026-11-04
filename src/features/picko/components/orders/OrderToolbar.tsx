import { Plus, Search } from 'lucide-react'
import { ORDER_STATUSES, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../types/order.ts'
import { fieldClassName } from '../ui/fieldClass.ts'
import { Button } from '../ui/Button.tsx'
import { parseStatusFilter, type OrderFilters, type StatusFilter } from '../../utils/orders.ts'

const statusOptions: StatusFilter[] = [
  'all',
  ...ORDER_STATUS_FLOW,
  ORDER_STATUSES.cancelled,
]

function statusLabel(status: StatusFilter): string {
  if (status === 'all') return 'كل الحالات'
  return ORDER_STATUS_LABELS[status]
}

export function OrderToolbar({
  filters,
  onFiltersChange,
  onCreate,
}: {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  onCreate?: (() => void) | undefined
}) {
  return (
    <div
      className={`grid gap-3 border-b border-line p-4 md:items-end ${
        onCreate
          ? 'md:grid-cols-[minmax(0,1fr)_12rem_auto]'
          : 'md:grid-cols-[minmax(0,1fr)_12rem]'
      }`}
    >
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-muted">بحث</span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={filters.query}
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="دور برقم الأوردر أو اسم العميل"
            autoComplete="off"
            className={`${fieldClassName} ps-9`}
          />
        </span>
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-muted">الحالة</span>
        <select
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: parseStatusFilter(event.target.value),
            })
          }
          className={fieldClassName}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      {onCreate ? (
        <Button onClick={onCreate} className="w-full md:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          أوردر جديد
        </Button>
      ) : null}
    </div>
  )
}
