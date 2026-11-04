import { createFileRoute } from "@tanstack/react-router";
import { CashierBoardPage } from '@/features/picko/views/CashierBoardPage';
import { pickoHead } from '@/features/picko/page-head';
export const Route = createFileRoute("/")({
  head: () => pickoHead('لوحة الطلبات', 'إدارة طلبات Picko وإصدار رموز التتبع والطباعة.'),
  component: CashierBoardPage,
});
