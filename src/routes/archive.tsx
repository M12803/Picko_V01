import { createFileRoute } from '@tanstack/react-router'
import { ArchivePage } from '@/features/picko/views/ArchivePage'
import { pickoHead } from '@/features/picko/page-head'
export const Route = createFileRoute('/archive')({ head: () => pickoHead('الأرشيف', 'البحث في سجل الطلبات وتواريخها في Picko.'), component: ArchivePage })