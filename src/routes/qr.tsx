import { createFileRoute, redirect } from '@tanstack/react-router'
import { pickoHead } from '@/features/picko/page-head'
export const Route = createFileRoute('/qr')({ head: () => pickoHead('طباعة QR', 'إصدار وطباعة رموز تتبع طلبات Picko.'), beforeLoad: () => { throw redirect({ to: '/orders' }) } })