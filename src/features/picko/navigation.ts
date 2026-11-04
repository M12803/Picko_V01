import {
  ClipboardList,
  LayoutDashboard,
  QrCode,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { routes } from './routes.ts'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: routes.overview, label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: routes.orders, label: 'الطلبات', icon: ClipboardList },
  { to: routes.qr, label: 'طباعة QR', icon: QrCode },
  { to: routes.settings, label: 'الإعدادات', icon: Settings },
]

export function titleForPath(pathname: string): string {
  return navItems.find((item) => item.to === pathname)?.label ?? 'الصفحة غير موجودة'
}
