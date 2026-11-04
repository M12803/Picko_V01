import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ApiError,
  completeTrackedOrder,
  createTrackedOrder,
  fetchOrders,
  reopenTrackedOrder,
} from '../services/api/ordersApi.ts'
import type { Order, OrderStatus } from '../types/order.ts'
import type { NewOrderInput } from '../utils/orders.ts'
import { orderNumberError } from '../utils/orderNumber.ts'
import { OrdersContext, type IssueQrResult } from './orders-context.ts'

const LOAD_ERROR_MESSAGE = 'تعذر قراءة الأوردرات من الخادم.'

function unavailable(): Promise<never> {
  return Promise.reject(
    new Error('الأوردرات تُحفظ في قاعدة البيانات من شاشة توليد QR فقط.'),
  )
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState(LOAD_ERROR_MESSAGE)
  const [requestId, setRequestId] = useState(0)
  const requestRef = useRef(0)
  const completingRef = useRef(new Map<string, Promise<void>>())
  const reopeningRef = useRef(new Map<string, Promise<void>>())

  const reload = useCallback(() => {
    setRequestId((current) => current + 1)
  }, [])

  useEffect(() => {
    const request = requestRef.current + 1
    requestRef.current = request
    let active = true

    void (async () => {
      setStatus('loading')
      try {
        const next = await fetchOrders()
        if (!active || requestRef.current !== request) return
        setOrders(next)
        setStatus('ready')
      } catch (error) {
        if (!active || requestRef.current !== request) return
        setErrorMessage(error instanceof ApiError ? error.message : LOAD_ERROR_MESSAGE)
        setStatus('error')
      }
    })()

    return () => {
      active = false
    }
  }, [requestId])

  useEffect(() => {
    if (status !== 'ready') return
    const timer = window.setInterval(() => {
      const request = requestRef.current
      void fetchOrders()
        .then((next) => {
          if (requestRef.current === request) setOrders(next)
        })
        .catch(() => {
          // Keep the board the cashier already has if a refresh misses.
        })
    }, 4000)
    return () => window.clearInterval(timer)
  }, [status])

  const issueTrackingQr = useCallback(async (orderNumber: string): Promise<IssueQrResult> => {
    const formatError = orderNumberError(orderNumber, orders)
    if (formatError) return { ok: false, message: formatError }

    try {
      const created = await createTrackedOrder(orderNumber)
      const request = requestRef.current + 1
      requestRef.current = request
      const next = await fetchOrders()
      if (requestRef.current === request) {
        setOrders(next)
        setStatus('ready')
      }
      return { ok: true, order: created.order, trackingUrl: created.trackingUrl }
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, message: error.message }
      throw error
    }
  }, [orders])

  const completeOrder = useCallback(async (id: string) => {
    const existing = completingRef.current.get(id)
    if (existing) return existing

    const run = (async () => {
      const saved = await completeTrackedOrder(id)
      setOrders((items) => items.map((item) => (item.id === id ? saved : item)))
      setStatus('ready')
    })()

    completingRef.current.set(id, run)
    try {
      await run
    } finally {
      completingRef.current.delete(id)
    }
  }, [])

  const reopenOrder = useCallback(async (id: string) => {
    const existing = reopeningRef.current.get(id)
    if (existing) return existing

    const run = (async () => {
      const saved = await reopenTrackedOrder(id)
      setOrders((items) => items.map((item) => (item.id === id ? saved : item)))
      setStatus('ready')
    })()

    reopeningRef.current.set(id, run)
    try {
      await run
    } finally {
      reopeningRef.current.delete(id)
    }
  }, [])

  const value = useMemo(
    () => ({
      orders,
      status,
      errorMessage,
      reload,
      createOrder: (input: NewOrderInput) => {
        void input
        return unavailable()
      },
      issueTrackingQr,
      completeOrder,
      reopenOrder,
      updateStatus: (id: string, nextStatus: OrderStatus) => {
        void id
        void nextStatus
        return unavailable()
      },
      setDemoNotification: (id: string, recorded: boolean) => {
        void id
        void recorded
        return unavailable()
      },
      clearOrders: () => unavailable(),
      restoreDemoOrders: () => unavailable(),
    }),
    [orders, status, errorMessage, reload, issueTrackingQr, completeOrder, reopenOrder],
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}
