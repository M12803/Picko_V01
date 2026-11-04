import { useState, type FormEvent } from 'react'
import { MENU_SUGGESTIONS } from '../../data/menu.ts'
import { useOrders } from '../../state/useOrders.ts'
import type { Order } from '../../types/order.ts'
import { Button } from '../ui/Button.tsx'
import { Modal } from '../ui/Modal.tsx'
import { TextArea, TextField } from '../ui/TextField.tsx'
import { fieldClassName } from '../ui/fieldClass.ts'

type DraftItem = {
  key: string
  name: string
  quantity: number
}

function emptyItem(): DraftItem {
  return { key: crypto.randomUUID(), name: '', quantity: 1 }
}

export function CreateOrderDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (order: Order) => void
}) {
  const { createOrder } = useOrders()
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<DraftItem[]>([emptyItem()])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setCustomerName('')
    setItems([emptyItem()])
    setNote('')
    setError('')
    setSaving(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    )
  }

  function addSuggestion(name: string) {
    setItems((current) => {
      const empty = current.find((item) => item.name.trim() === '')
      if (empty) {
        return current.map((item) => (item.key === empty.key ? { ...item, name } : item))
      }
      if (current.length >= 6) return current
      return [...current, { key: crypto.randomUUID(), name, quantity: 1 }]
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prepared = items
      .map((item) => ({ name: item.name.trim(), quantity: item.quantity }))
      .filter((item) => item.name !== '')

    if (customerName.trim() === '') {
      setError('اكتب اسم العميل أو رقم الطاولة.')
      return
    }
    if (prepared.length === 0) {
      setError('اكتب صنف واحد على الأقل.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const order = await createOrder({
        customerName,
        items: prepared,
        note,
      })
      onCreated(order)
      handleClose()
    } catch {
      setError('متعذر حفظ الأوردر على الجهاز.')
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title="أوردر جديد" onClose={handleClose}>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <TextField
          label="اسم العميل أو الطاولة"
          name="customerName"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="مثلاً: أحمد، أو طاولة 4"
          autoComplete="off"
          autoFocus
        />
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-muted">الأصناف</legend>
          <div className="flex flex-wrap gap-2">
            {MENU_SUGGESTIONS.map((name) => (
              <button
                key={name}
                type="button"
                className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:bg-elevated"
                onClick={() => addSuggestion(name)}
              >
                {name}
              </button>
            ))}
          </div>
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_5rem_auto] gap-2">
              <input
                value={item.name}
                onChange={(event) => updateItem(item.key, { name: event.target.value })}
                placeholder="اسم الصنف"
                aria-label="اسم الصنف"
                className={fieldClassName}
              />
              <input
                type="number"
                min={1}
                max={20}
                inputMode="numeric"
                value={item.quantity}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  updateItem(item.key, {
                    quantity: Number.isFinite(next)
                      ? Math.min(20, Math.max(1, Math.round(next)))
                      : 1,
                  })
                }}
                aria-label="الكمية"
                className={fieldClassName}
              />
              <button
                type="button"
                className="min-h-10 rounded-lg px-2 text-sm text-muted hover:bg-elevated disabled:opacity-40"
                disabled={items.length === 1}
                onClick={() =>
                  setItems((current) => current.filter((entry) => entry.key !== item.key))
                }
              >
                حذف
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-ink hover:text-ink disabled:opacity-40"
            disabled={items.length >= 6}
            onClick={() => setItems((current) => [...current, emptyItem()])}
          >
            إضافة صنف
          </button>
        </fieldset>
        <TextArea
          label="ملاحظة"
          name="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="مثلاً: سكر زيادة، أو من غير ثلج"
        />
        {error ? (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'بيتحفظ...' : 'حفظ الأوردر'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
