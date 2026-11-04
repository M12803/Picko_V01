/** Copies text from a click handler, including pages opened over plain HTTP. */
export async function copyText(
  value: string,
  field?: HTMLTextAreaElement | HTMLInputElement | null,
): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Permission can still fail inside a secure context. Try the legacy path.
    }
  }

  const area = field ?? document.createElement('textarea')
  const created = area !== field
  if (created) {
    area.value = value
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.left = '0'
    area.style.fontSize = '16px'
    document.body.appendChild(area)
  }

  area.focus()
  area.select()
  area.setSelectionRange(0, area.value.length)
  let copied = false
  try {
    copied = document.execCommand('copy')
  } finally {
    if (created) area.remove()
  }
  if (!copied) {
    if (field) {
      field.focus()
      field.select()
      field.setSelectionRange(0, field.value.length)
    }
    throw new Error('copy failed')
  }
}
