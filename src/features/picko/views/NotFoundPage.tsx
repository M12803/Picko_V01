import { Link } from '../router-adapter.tsx'
import { routes } from '../routes.ts'

export function NotFoundPage() {
  return (
    <section className="rounded-[1.6rem] border border-line bg-surface p-6">
      <h2 className="text-base font-semibold">الصفحة غير موجودة</h2>
      <p className="mt-2 text-sm text-muted">الرابط ده مش ضمن صفحات Picko.</p>
      <Link
        to={routes.orders}
        className="mt-4 inline-flex text-sm font-medium underline underline-offset-4"
      >
        الرجوع إلى اللوحة
      </Link>
    </section>
  )
}
