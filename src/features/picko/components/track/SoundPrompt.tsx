import * as Dialog from '@radix-ui/react-dialog'
import { LoaderCircle, Volume2, X } from 'lucide-react'
import { Button } from '../ui/Button'

export function SoundPrompt({ open, onOpenChange, code, busy, error, onEnable }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  busy: boolean
  error: string | null
  onEnable: () => void
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-app/80 backdrop-blur-md" />
      <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface px-6 py-8 text-center text-ink shadow-xl">
        <Dialog.Close asChild><Button variant="ghost" className="absolute left-3 top-3 size-9 min-h-9 p-0" aria-label="لاحقًا"><X className="size-4" /></Button></Dialog.Close>
        <div className="mx-auto flex size-16 items-center justify-center rounded-lg bg-mint-dim text-mint"><Volume2 className="size-8" /></div>
        <Dialog.Title className="mt-5 text-2xl font-bold">فعّل تنبيه الأوردر</Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-7 text-muted">هنشغّل رنتك أول ما أوردر <b className="text-ink" dir="ltr">{code}</b> يجهز.<br />خلّي الصفحة مفتوحة عشان تسمع التنبيه.</Dialog.Description>
        <Button className="mt-6 min-h-12 w-full text-base font-semibold" onClick={onEnable} disabled={busy}>{busy ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" /> : <Volume2 className="size-5" />}{busy ? 'جاري التفعيل…' : 'تفعيل الصوت'}</Button>
        {error ? <p role="alert" className="mt-3 text-sm leading-6 text-bad">{error}</p> : null}
        <p className="mt-4 text-xs text-muted">الصوت لا يحتاج إذن الميكروفون أو الإشعارات</p>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}