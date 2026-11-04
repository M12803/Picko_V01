import { useState, type FormEvent } from 'react'
import { Link } from '../router-adapter.tsx'
import { Button } from '../components/ui/Button.tsx'
import { TextField } from '../components/ui/TextField.tsx'
import { routes } from '../routes.ts'
import { useSettings } from '../state/useSettings.ts'
import { PAPER_WIDTHS } from '../types/settings.ts'
import type { PaperWidth } from '../types/settings.ts'
import { cn } from '../utils/cn.ts'

const MAX_CAFE_NAME_LENGTH = 40

export function SettingsPage() {
  const { settings, saveSettings } = useSettings()
  const [cafeName, setCafeName] = useState(settings.cafeName)
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(settings.paperWidth)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextName = cafeName.trim()
    if (!nextName) {
      setFormError('اكتب اسم الكافيه.')
      setMessage(null)
      return
    }
    if (nextName.length > MAX_CAFE_NAME_LENGTH) {
      setFormError('اسم الكافيه لازم يكون 40 حرف أو أقل.')
      setMessage(null)
      return
    }
    if (!PAPER_WIDTHS.includes(paperWidth)) {
      setFormError('اختار عرض ورق 58mm أو 80mm.')
      setMessage(null)
      return
    }

    saveSettings({ ...settings, cafeName: nextName, paperWidth })
    setCafeName(nextName)
    setFormError('')
    setMessage('اتحفظت الإعدادات في المتصفح ده.')
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">الإعدادات</h1>
        <p className="mt-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted">
          النسخة دي تجريبية. الإعدادات بتتحفظ في المتصفح ده بس، ومش بتظهر على جهاز تاني.
        </p>
      </div>

      {message ? (
        <p role="status" className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      <form onSubmit={save} className="space-y-4 rounded-[1.6rem] border border-line bg-surface p-4 sm:p-5">
        <TextField
          label="اسم الكافيه"
          name="cafeName"
          value={cafeName}
          maxLength={MAX_CAFE_NAME_LENGTH}
          onChange={(event) => setCafeName(event.target.value)}
          autoComplete="organization"
        />

        <fieldset>
          <legend className="text-sm font-medium">عرض ورق الطباعة</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PAPER_WIDTHS.map((width) => {
              const selected = paperWidth === width
              return (
                <label
                  key={width}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium',
                    selected
                      ? 'border-ink bg-ink text-app'
                      : 'border-line bg-elevated text-ink',
                  )}
                >
                  <input
                    type="radio"
                    name="paperWidth"
                    value={width}
                    checked={selected}
                    className="sr-only"
                    onChange={() => setPaperWidth(width)}
                  />
                  {width}mm
                </label>
              )
            })}
          </div>
        </fieldset>

        {formError ? (
          <p role="alert" className="text-sm text-rose-400">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit">حفظ الإعدادات</Button>
          <Link
            to={routes.orders}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-elevated px-3.5 text-sm font-medium hover:bg-surface"
          >
            الرجوع إلى اللوحة
          </Link>
        </div>
      </form>
    </div>
  )
}
