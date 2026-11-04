import { createFileRoute } from '@tanstack/react-router'
import { RatingsPage } from '@/features/picko/views/RatingsPage'
import { pickoHead } from '@/features/picko/page-head'
export const Route = createFileRoute('/ratings')({ head: () => pickoHead('التقييمات', 'تقييمات العملاء وتجاربهم في Picko.'), component: RatingsPage })