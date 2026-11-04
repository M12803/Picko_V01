import type { OrderRepository } from './orderRepository.ts'

export type { OrderRepository } from './orderRepository.ts'

function removed(): never {
  throw new Error('الأوردرات تُقرأ من خادم Picko، وليس من التخزين المحلي.')
}

/** Live orders come from the API. This binding refuses the old browser store. */
export const orderRepository: OrderRepository = {
  listOrders: async () => removed(),
  getOrder: async () => removed(),
  getOrderByTrackingToken: async () => removed(),
  saveOrder: async () => removed(),
  replaceOrders: async () => removed(),
}
