import { createFileRoute } from '@tanstack/react-router'
import { TrackOrderPage } from '@/features/picko/views/TrackOrderPage'
import { pickoHead } from '@/features/picko/page-head'
export const Route = createFileRoute('/track/$token')({ head: () => pickoHead('تتبع الأوردر', 'متابعة حالة طلبك واستلامه وتقييمه في Picko.'), component: TrackOrderPage })