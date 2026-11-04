import { createContext } from 'react'
import type { Order, OrderStatus } from '../types/order.ts'
import type { NewOrderInput } from '../utils/orders.ts'

export type IssueQrResult =
  | { ok: true; order: Order; trackingUrl: string }
  | { ok: false; message: string }

export type OrdersContextValue = {
  orders: Order[]
  status: 'loading' | 'ready' | 'error'
  errorMessage: string
  reload: () => void
  createOrder: (input: NewOrderInput) => Promise<Order>
  issueTrackingQr: (orderNumber: string) => Promise<IssueQrResult>
  completeOrder: (id: string) => Promise<void>
  reopenOrder: (id: string) => Promise<void>
  updateStatus: (id: string, status: OrderStatus) => Promise<void>
  setDemoNotification: (id: string, recorded: boolean) => Promise<void>
  clearOrders: () => Promise<void>
  restoreDemoOrders: () => Promise<void>
}

export const OrdersContext = createContext<OrdersContextValue | null>(null)
