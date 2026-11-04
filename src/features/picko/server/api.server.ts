// Picko order API on Lovable Cloud. Mirrors the original Express routes and JSON
// contracts (server/src/app.ts) so the imported frontend works unchanged.
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const READY_UNDO_MS = 3_000
const ORDER_NUMBER_PATTERN = /^(?=.*\d)(?!-)(?!.*--)(?!.*-$)[A-Za-z0-9-]{1,20}$/u
const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u
const STATUSES = ['pending', 'preparing', 'ready', 'completed', 'picked_up', 'cancelled'] as const
type OrderStatus = (typeof STATUSES)[number]

const DUPLICATE_CODE_MESSAGE =
  'فيه أوردر شغّال بنفس الرقم ده، ومش مسموح تكراره دلوقتي. استخدم رقم جديد من نقطة البيع، أو استنى لما الأوردر الحالي يبقى جاهز للاستلام. بعد التسليم ينفع تستخدم نفس الرقم تاني.'

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

type OrderRow = {
  id: string
  code: string
  customer_name: string
  status: string
  qr_status: string
  notification_status: string
  note: string | null
  created_at: string
  updated_at: string
  tracking_tokens: { token: string } | { token: string }[] | null
  order_items: { id: string; name: string; quantity: number; note: string | null; sort_order: number }[]
}

const ORDER_SELECT =
  'id, code, customer_name, status, qr_status, notification_status, note, created_at, updated_at, tracking_tokens(token), order_items(id, name, quantity, note, sort_order)'

function db() {
  return supabaseAdmin
}

function iso(value: string): string {
  return new Date(value).toISOString()
}

function tokenOf(row: OrderRow): string | null {
  const t = row.tracking_tokens
  if (!t) return null
  if (Array.isArray(t)) return t[0]?.token ?? null
  return t.token
}

function toDto(row: OrderRow, origin: string) {
  const token = tokenOf(row)
  return {
    id: row.id,
    code: row.code,
    trackingToken: token,
    customerName: row.customer_name,
    items: [...row.order_items]
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, note: i.note })),
    status: row.status,
    qrStatus: row.qr_status,
    notificationStatus: row.notification_status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    note: row.note,
    trackingUrl: token ? `${origin}/track/${encodeURIComponent(token)}` : null,
  }
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

async function getOrder(id: string, origin: string) {
  const { data, error } = await db().from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle()
  fail(error)
  return data ? toDto(data as unknown as OrderRow, origin) : null
}

function remainingUndoMs(updatedAt: string, now = Date.now()): number {
  const at = Date.parse(updatedAt)
  return Number.isFinite(at) ? Math.max(0, at + READY_UNDO_MS - now) : 0
}

export function customerVisibleStatus(status: string, updatedAt: string, now = Date.now()): string {
  return status === 'completed' && remainingUndoMs(updatedAt, now) > 0 ? 'ready' : status
}

export function orderCodeError(rawCode: string): string | null {
  const code = rawCode.trim()
  if (code === '') return 'اكتب رقم الأوردر من نقطة البيع.'
  if (!ORDER_NUMBER_PATTERN.test(code)) {
    return 'رقم الأوردر لازم يكون أرقام، وممكن حروف لاتينية أو شرطة، من غير مسافات، وبحد أقصى 20 حرف.'
  }
  return null
}

function parseOrderId(value: string): string {
  const id = value.trim().toLowerCase()
  if (!ORDER_ID_PATTERN.test(id)) throw new HttpError(400, 'معرّف الأوردر غير صالح.')
  return id
}

function createTrackingToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '')
}

async function findTrackingTarget(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw new HttpError(400, 'رابط التتبع غير صالح.')
  const { data, error } = await db()
    .from('tracking_tokens')
    .select('orders(id, code, status, updated_at)')
    .eq('token', token)
    .maybeSingle()
  fail(error)
  const o = (data as { orders: { id: string; code: string; status: string; updated_at: string } | null } | null)
    ?.orders
  if (!o) return null
  return { id: o.id, code: o.code, status: o.status, updatedAt: iso(o.updated_at) }
}

async function readRatingState(orderId: string): Promise<'none' | 'submitted' | 'skipped'> {
  const { data, error } = await db().from('place_ratings').select('skipped').eq('order_id', orderId).maybeSingle()
  fail(error)
  if (!data) return 'none'
  return data.skipped ? 'skipped' : 'submitted'
}

function parseDay(value: string | null, label: string): string | null {
  if (value === null || value.trim() === '') return null
  const text = value.trim()
  if (!DAY_PATTERN.test(text)) throw new HttpError(400, `${label} لازم يكون بتاريخ بصيغة YYYY-MM-DD.`)
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(Date.UTC(y!, m! - 1, d!))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m! - 1 || date.getUTCDate() !== d) {
    throw new HttpError(400, `${label} غير صالح.`)
  }
  return text
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text()
  if (text.length > 32 * 1024) throw new HttpError(413, 'الطلب أكبر من المسموح.')
  if (text.trim() === '') return null
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'بيانات الطلب غير صالحة.')
  }
}

// Customer QR links must open without a Lovable login, so orders created from the
// editor preview (login-protected) still point customers at the public site.
const PUBLISHED_ORIGIN = 'https://emerald-glow-garden.lovable.app'

function publicOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = host
    ? `${proto.split(',')[0]!.trim()}://${host.split(',')[0]!.trim()}`
    : new URL(request.url).origin
  const hostname = new URL(origin).hostname
  const isPrivatePreview =
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.includes('id-preview--') ||
    hostname.endsWith('.lovableproject.com') ||
    hostname.endsWith('.sandbox.lovable.dev')
  return isPrivatePreview ? PUBLISHED_ORIGIN : origin
}

const json = (body: unknown, status = 200) => Response.json(body, { status })

type Handler = (ctx: { request: Request; origin: string; params: string[]; url: URL }) => Promise<Response>

const routes: { method: string; pattern: RegExp; handler: Handler }[] = [
  {
    method: 'GET',
    pattern: /^\/api\/health$/u,
    handler: async () => {
      const { error } = await db().from('orders').select('id', { head: true, count: 'exact' })
      fail(error)
      return json({ ok: true, database: 'Lovable Cloud' })
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/orders\/summary$/u,
    handler: async () => {
      const count = async (status?: string) => {
        let q = db().from('orders').select('id', { head: true, count: 'exact' })
        if (status) q = q.eq('status', status)
        const { count: n, error } = await q
        fail(error)
        return n ?? 0
      }
      const [total, completed, remaining] = await Promise.all([count(), count('completed'), count('ready')])
      return json({ total, completed, remaining })
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/orders\/archive$/u,
    handler: async ({ url }) => {
      const rawCode = url.searchParams.get('code')?.trim() ?? ''
      if (rawCode.length > 20) throw new HttpError(400, 'رقم الأوردر أطول من المسموح.')
      const from = parseDay(url.searchParams.get('from'), 'تاريخ البداية')
      const to = parseDay(url.searchParams.get('to'), 'تاريخ النهاية')
      if (from && to && from > to) {
        throw new HttpError(400, 'تاريخ البداية لازم يكون قبل تاريخ النهاية أو مساويًا له.')
      }
      const { data, error } = await db().rpc('picko_archive', {
        p_code: rawCode === '' ? (null as unknown as string) : rawCode,
        p_from: from as unknown as string,
        p_to: to as unknown as string,
      })
      fail(error)
      const now = Date.now()
      const orders = (data ?? []).map((row) => {
        const createdAt = iso(row.created_at)
        const readyAt = row.ready_at ? iso(row.ready_at) : null
        const created = Date.parse(createdAt)
        let waitMs: number | null
        if (row.status === 'completed') {
          const ready = Date.parse(readyAt ?? row.updated_at)
          waitMs = Number.isFinite(ready) ? Math.max(0, ready - created) : null
        } else {
          waitMs = Math.max(0, now - created)
        }
        return { id: row.id, code: row.code, status: row.status, createdAt, readyAt, pickedUpAt: null, waitMs }
      })
      return json({ orders, count: orders.length })
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/orders$/u,
    handler: async ({ url, origin }) => {
      const status = url.searchParams.get('status')?.trim() ?? ''
      if (status !== '' && !(STATUSES as readonly string[]).includes(status)) {
        throw new HttpError(
          400,
          'حالة الأوردر يجب أن تكون pending أو preparing أو ready أو completed أو cancelled.',
        )
      }
      let q = db().from('orders').select(ORDER_SELECT).order('created_at').order('id')
      if (status !== '') q = q.eq('status', status)
      const { data, error } = await q
      fail(error)
      return json({ orders: (data as unknown as OrderRow[]).map((r) => toDto(r, origin)) })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/orders$/u,
    handler: async ({ request, origin }) => {
      const body = await readJson(request)
      if (!body || typeof body !== 'object' || typeof (body as { code?: unknown }).code !== 'string') {
        throw new HttpError(400, 'اكتب رقم الأوردر من نقطة البيع.')
      }
      const rawCode = (body as { code: string }).code
      const formatError = orderCodeError(rawCode)
      if (formatError) throw new HttpError(400, formatError)
      const code = rawCode.trim()

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data: id, error } = await db().rpc('picko_create_order', {
          p_code: code,
          p_token: createTrackingToken(),
        })
        if (error) {
          if (error.message.includes('orders_active_code_key')) throw new HttpError(409, DUPLICATE_CODE_MESSAGE)
          if (error.message.includes('tracking_tokens')) continue
          if (error.code === '23514') throw new HttpError(400, 'رقم الأوردر غير صالح.')
          throw new Error(error.message)
        }
        const order = await getOrder(id as string, origin)
        if (!order) throw new Error('Created order could not be read back.')
        return json({ order, trackingUrl: order.trackingUrl }, 201)
      }
      throw new Error('Could not create a unique tracking token.')
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/orders\/([^/]+)$/u,
    handler: async ({ params, origin }) => {
      const order = await getOrder(parseOrderId(params[0]!), origin)
      if (!order) return json({ error: 'الأوردر غير موجود.' }, 404)
      return json({ order })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/orders\/([^/]+)\/complete$/u,
    handler: async ({ params, origin }) => {
      const id = parseOrderId(params[0]!)
      const { data: previous, error } = await db().rpc('picko_complete_order', { p_id: id })
      fail(error)
      const order = await getOrder(id, origin)
      if (!order) throw new HttpError(404, 'الأوردر غير موجود.')
      const delayed = previous !== null && previous === 'ready'
      return json({ order, notifications: { sent: 0, removed: 0, failed: 0, skipped: true, delayed } })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/orders\/([^/]+)\/reopen$/u,
    handler: async ({ params, origin }) => {
      const id = parseOrderId(params[0]!)
      const { data: reopened, error } = await db().rpc('picko_reopen_order', {
        p_id: id,
        p_window_ms: READY_UNDO_MS,
      })
      fail(error)
      const order = await getOrder(id, origin)
      if (!order) throw new HttpError(404, 'الأوردر غير موجود.')
      if (reopened) return json({ order })
      if (order.status === 'ready') throw new HttpError(409, 'الأوردر أصلًا قيد التحضير.')
      if (order.status === 'completed') {
        throw new HttpError(409, 'انتهى وقت التراجع. إشعار الجاهزية بيتبعت للزبون، ومش هينفع نرجّع الأوردر.')
      }
      throw new HttpError(409, 'لا يمكن إرجاع الأوردر للحالة دي.')
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/track\/([^/]+)$/u,
    handler: async ({ params }) => {
      const order = await findTrackingTarget(params[0]!)
      if (!order) return json({ error: 'الأوردر غير موجود.' }, 404)
      const rating = await readRatingState(order.id)
      return json({
        order: { code: order.code, status: customerVisibleStatus(order.status, order.updatedAt), rating },
      })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/track\/([^/]+)\/pickup$/u,
    handler: async ({ params }) => {
      const token = params[0]!
      const current = await findTrackingTarget(token)
      if (!current) throw new HttpError(404, 'الأوردر غير موجود.')
      const visible = customerVisibleStatus(current.status, current.updatedAt)
      if (visible !== 'picked_up') {
        if (visible !== 'completed') throw new HttpError(409, 'الرنين بيتفتح لما الأوردر يبقى جاهز للاستلام.')
        const { data: done, error } = await db().rpc('picko_pickup_order', {
          p_id: current.id,
          p_window_ms: READY_UNDO_MS,
        })
        fail(error)
        if (!done) {
          const again = await findTrackingTarget(token)
          if (!again || customerVisibleStatus(again.status, again.updatedAt) !== 'picked_up') {
            throw new HttpError(409, 'لسه مينفعش تقفل الرنين. استنى لحد ما الأوردر يبقى جاهز للاستلام.')
          }
        }
      }
      const rating = await readRatingState(current.id)
      return json({ order: { code: current.code, status: 'picked_up', rating } })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/track\/([^/]+)\/rating$/u,
    handler: async ({ params, request }) => {
      const order = await findTrackingTarget(params[0]!)
      if (!order) return json({ error: 'الأوردر غير موجود.' }, 404)
      const visible = customerVisibleStatus(order.status, order.updatedAt)
      if (visible !== 'completed' && visible !== 'picked_up') {
        throw new HttpError(409, 'التقييم بيتفتح لما الأوردر يبقى جاهز للاستلام.')
      }
      if ((await readRatingState(order.id)) !== 'none') {
        throw new HttpError(409, 'التقييم اتسجل قبل كده لهذا الأوردر.')
      }
      const input = readRatingBody(await readJson(request))
      const { error } = await db().from('place_ratings').insert({ order_id: order.id, ...input })
      if (error) {
        if (error.code === '23505') throw new HttpError(409, 'التقييم اتسجل قبل كده لهذا الأوردر.')
        throw new Error(error.message)
      }
      return json({ rating: input.skipped ? 'skipped' : 'submitted' }, 201)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/ratings$/u,
    handler: async () => {
      const [list, summary] = await Promise.all([
        db()
          .from('place_ratings')
          .select('id, stars, note, created_at, orders(code)')
          .eq('skipped', false)
          .order('created_at', { ascending: false })
          .limit(200),
        db().rpc('picko_rating_summary'),
      ])
      fail(list.error)
      fail(summary.error)
      const totals = (Array.isArray(summary.data) ? summary.data[0] : summary.data) as
        | { rating_count: number | null; average_stars: number | null }
        | null
        | undefined
      const count = Number(totals?.rating_count ?? 0)
      const avg = totals?.average_stars
      return json({
        count,
        average: count > 0 && typeof avg === 'number' ? Math.round(avg * 10) / 10 : null,
        ratings: (list.data ?? []).map((r) => ({
          id: r.id,
          orderCode: (r.orders as unknown as { code: string } | null)?.code ?? '',
          stars: Number(r.stars),
          note: r.note,
          createdAt: iso(r.created_at),
        })),
      })
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/daily-board$/u,
    handler: async ({ origin }) => {
      const { data, error } = await db().rpc('picko_daily_board')
      fail(error)
      return json({
        orders: (data ?? []).map((r) => ({
          id: r.id,
          code: r.code,
          trackingUrl: `${origin}/track/${encodeURIComponent(r.token)}`,
        })),
      })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/daily-board\/clear$/u,
    handler: async () => {
      const { data, error } = await db().rpc('picko_clear_daily_board')
      fail(error)
      return json({ hidden: data ?? 0 })
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/push\/public-key$/u,
    handler: async () => {
      const key = process.env['VAPID_PUBLIC_KEY']?.trim()
      if (!key) return json({ error: 'مفاتيح الإشعارات غير مضبوطة على الخادم.' }, 503)
      return json({ publicKey: key })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/push\/subscriptions$/u,
    handler: async ({ request }) => {
      const sub = readPushBody(await readJson(request))
      const target = await findTrackingTarget(sub.token)
      if (!target) throw new HttpError(404, 'الأوردر غير موجود.')
      const { error } = await db().from('push_subscriptions').upsert(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
          order_id: target.id,
          expiration_at: sub.expiration,
        },
        { onConflict: 'endpoint' },
      )
      fail(error)
      return json({ ok: true }, 201)
    },
  },
]

function readRatingBody(body: unknown): { stars: number | null; note: string | null; skipped: boolean } {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'بيانات التقييم غير صالحة.')
  const record = body as Record<string, unknown>
  if (record['skipped'] === true) return { stars: null, note: null, skipped: true }
  const stars = Number(record['stars'])
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new HttpError(400, 'اختار تقييم من نجمة إلى خمس نجوم، أو تخطّ التقييم.')
  }
  let note: string | null = null
  if (record['note'] !== undefined && record['note'] !== null) {
    if (typeof record['note'] !== 'string') throw new HttpError(400, 'الملاحظة لازم تكون نص.')
    const trimmed = record['note'].trim()
    if (trimmed.length > 500) throw new HttpError(400, 'الملاحظة حدها 500 حرف.')
    note = trimmed === '' ? null : trimmed
  }
  return { stars, note, skipped: false }
}

function readPushBody(body: unknown) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'بيانات الاشتراك غير مكتملة.')
  const r = body as Record<string, unknown>
  const text = (k: string) => {
    const v = r[k]
    if (typeof v !== 'string' || v.trim() === '') throw new HttpError(400, 'بيانات الاشتراك غير مكتملة.')
    return v.trim()
  }
  const token = text('token')
  const endpoint = text('endpoint')
  const p256dh = text('p256dh')
  const auth = text('auth')
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw new HttpError(400, 'عنوان اشتراك الإشعار غير صالح.')
  }
  if (url.protocol !== 'https:') throw new HttpError(400, 'اشتراك الإشعار لازم يكون على HTTPS.')
  if (endpoint.length > 2048 || p256dh.length > 255 || auth.length > 255) {
    throw new HttpError(400, 'بيانات اشتراك الإشعار أطول من المسموح.')
  }
  let expiration: string | null = null
  if (typeof r['expiration'] === 'number' && Number.isFinite(r['expiration'])) {
    expiration = new Date(r['expiration']).toISOString()
  }
  return { token, endpoint, p256dh, auth, expiration }
}

export async function handleApi(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/u, '')
  const method = request.method.toUpperCase()
  let pathMatched = false
  for (const route of routes) {
    const match = route.pattern.exec(path)
    if (!match) continue
    pathMatched = true
    if (route.method !== method) continue
    try {
      return await route.handler({
        request,
        url,
        origin: publicOrigin(request),
        params: match.slice(1).map((p) => decodeURIComponent(p)),
      })
    } catch (error) {
      if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status)
      console.error('picko api failed', path, error instanceof Error ? error.message : error)
      return json({ ok: false, error: 'تعذر تنفيذ الطلب على الخادم.' }, 500)
    }
  }
  return json({ error: pathMatched ? 'الطريقة غير مدعومة.' : 'المسار غير موجود.' }, pathMatched ? 405 : 404)
}
