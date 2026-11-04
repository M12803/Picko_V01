import type { Order } from '../../types/order.ts'

/**
 * The only order API the UI should call.
 * localStorage implements it today. A Firebase implementation can replace
 * that later without changing pages or components.
 */
export interface OrderRepository {
  listOrders(): Promise<Order[]>
  getOrder(id: string): Promise<Order | null>
  getOrderByTrackingToken(token: string): Promise<Order | null>
  saveOrder(order: Order): Promise<Order>
  replaceOrders(orders: Order[]): Promise<void>
}
