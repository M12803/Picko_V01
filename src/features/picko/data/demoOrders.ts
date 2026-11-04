import {
  NOTIFICATION_STATUSES,
  ORDER_STATUSES,
  QR_STATUSES,
} from '../types/order.ts'
import type { Order, OrderItem } from '../types/order.ts'

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

function item(
  id: string,
  name: string,
  quantity: number,
  note?: string,
): OrderItem {
  return { id, name, quantity, note }
}

/** Realistic cafe orders for a first visit. Saved orders replace this list. */
export function createDemoOrders(): Order[] {
  return [
    {
      id: 'ord_1842',
      code: '1842',
      customerName: 'محمد أحمد',
      items: [
        item('item_1842_1', 'قهوة تركي', 1, 'سكر زيادة'),
        item('item_1842_2', 'كرواسون', 1),
      ],
      status: ORDER_STATUSES.pending,
      qrStatus: QR_STATUSES.missing,
      notificationStatus: NOTIFICATION_STATUSES.none,
      createdAt: minutesAgo(12),
      updatedAt: minutesAgo(12),
      note: 'طاولة جنب الشباك',
    },
    {
      id: 'ord_1843',
      code: '1843',
      customerName: 'سارة علي',
      items: [item('item_1843_1', 'لاتيه', 2)],
      status: ORDER_STATUSES.preparing,
      qrStatus: QR_STATUSES.waiting,
      notificationStatus: NOTIFICATION_STATUSES.none,
      createdAt: minutesAgo(25),
      updatedAt: minutesAgo(16),
    },
    {
      id: 'ord_1844',
      code: '1844',
      customerName: 'طاولة 7',
      items: [
        item('item_1844_1', 'شاي نعناع', 1),
        item('item_1844_2', 'مياه معدنية', 1),
      ],
      status: ORDER_STATUSES.preparing,
      qrStatus: QR_STATUSES.missing,
      notificationStatus: NOTIFICATION_STATUSES.none,
      createdAt: minutesAgo(18),
      updatedAt: minutesAgo(9),
    },
    {
      id: 'ord_1845',
      code: '1845',
      customerName: 'كريم حسن',
      items: [item('item_1845_1', 'إسبريسو', 2)],
      status: ORDER_STATUSES.ready,
      qrStatus: QR_STATUSES.waiting,
      notificationStatus: NOTIFICATION_STATUSES.demo,
      createdAt: minutesAgo(34),
      updatedAt: minutesAgo(4),
    },
    {
      id: 'ord_1846',
      code: '1846',
      customerName: 'نورا سعيد',
      items: [
        item('item_1846_1', 'كابتشينو', 1),
        item('item_1846_2', 'تشيز كيك', 1),
      ],
      status: ORDER_STATUSES.ready,
      qrStatus: QR_STATUSES.missing,
      notificationStatus: NOTIFICATION_STATUSES.demo,
      createdAt: minutesAgo(41),
      updatedAt: minutesAgo(7),
    },
    {
      id: 'ord_1847',
      code: '1847',
      customerName: 'يوسف محمود',
      items: [item('item_1847_1', 'أمريكانو', 1)],
      status: ORDER_STATUSES.completed,
      qrStatus: QR_STATUSES.waiting,
      notificationStatus: NOTIFICATION_STATUSES.demo,
      createdAt: minutesAgo(95),
      updatedAt: minutesAgo(48),
    },
    {
      id: 'ord_1848',
      code: '1848',
      customerName: 'ليلى عمر',
      items: [item('item_1848_1', 'موكا', 1)],
      status: ORDER_STATUSES.cancelled,
      qrStatus: QR_STATUSES.missing,
      notificationStatus: NOTIFICATION_STATUSES.none,
      createdAt: minutesAgo(150),
      updatedAt: minutesAgo(140),
      note: 'العميل غيّر رأيه',
    },
    {
      id: 'ord_1849',
      code: '1849',
      customerName: 'طاولة 2',
      items: [
        item('item_1849_1', 'آيس لاتيه', 1),
        item('item_1849_2', 'سموذي مانجا', 1),
      ],
      status: ORDER_STATUSES.pending,
      qrStatus: QR_STATUSES.waiting,
      notificationStatus: NOTIFICATION_STATUSES.none,
      createdAt: minutesAgo(6),
      updatedAt: minutesAgo(6),
    },
  ]
}
