import { createDemoOrders } from '../../data/demoOrders.ts'
import { parseOrder } from '../../types/order.ts'
import type { Order } from '../../types/order.ts'
import { hasStorage, readStorage, writeStorage } from '../../utils/storage.ts'
import { isTrackingToken } from '../../utils/trackingToken.ts'
import type { OrderRepository } from './orderRepository.ts'

const ORDERS_KEY = 'orders'

function readOrders(): Order[] {
  const stored = readStorage<unknown>(ORDERS_KEY, [])
  if (!Array.isArray(stored)) return []

  return stored.flatMap((item) => {
    const order = parseOrder(item)
    return order ? [order] : []
  })
}

export const localOrderRepository: OrderRepository = {
  async listOrders() {
    if (!hasStorage(ORDERS_KEY)) {
      const seeded = createDemoOrders()
      writeStorage(ORDERS_KEY, seeded)
      return seeded
    }

    return readOrders()
  },

  async getOrder(id) {
    return readOrders().find((order) => order.id === id) ?? null
  },

  async getOrderByTrackingToken(token) {
    if (!isTrackingToken(token)) return null
    return readOrders().find((order) => order.trackingToken === token) ?? null
  },

  async saveOrder(order) {
    const orders = readOrders()
    const exists = orders.some((item) => item.id === order.id)
    const next = exists
      ? orders.map((item) => (item.id === order.id ? order : item))
      : [...orders, order]

    writeStorage(ORDERS_KEY, next)
    return order
  },

  async replaceOrders(orders) {
    writeStorage(ORDERS_KEY, orders)
  },
}
