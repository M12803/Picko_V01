import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/features/picko/views/SettingsPage'
import { pickoHead } from '@/features/picko/page-head'
export const Route = createFileRoute('/settings')({ head: () => pickoHead('الإعدادات', 'اسم الكافيه وإعدادات ورق الطباعة في Picko.'), component: SettingsPage })