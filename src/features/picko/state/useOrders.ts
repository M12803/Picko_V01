import { useContext } from 'react'
import { OrdersContext } from './orders-context.ts'

export function useOrders() {
  const value = useContext(OrdersContext)
  if (!value) {
    throw new Error('useOrders must be used within OrdersProvider')
  }
  return value
}
