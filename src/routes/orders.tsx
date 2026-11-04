import { createFileRoute } from '@tanstack/react-router'
import { CashierBoardPage } from '@/features/picko/views/CashierBoardPage'
import { pickoHead } from '@/features/picko/page-head'
export const Route = createFileRoute('/orders')({ head: () => pickoHead('الطلبات', 'متابعة تجهيز واستلام الطلبات في Picko.'), component: CashierBoardPage })