import { isActiveOrderStatus } from '../types/order.ts'
import type { Order } from '../types/order.ts'

const ORDER_NUMBER_PATTERN = /^(?=.*\d)(?!-)(?!.*--)(?!.*-$)[A-Za-z0-9-]{1,20}$/

export function orderNumberError(
  rawOrderNumber: string,
  existing: readonly Order[],
): string | null {
  const code = rawOrderNumber.trim()

  if (code === '') return 'اكتب رقم الأوردر من نقطة البيع.'

  if (!ORDER_NUMBER_PATTERN.test(code)) {
    return 'رقم الأوردر لازم يكون أرقام، وممكن حروف لاتينية أو شرطة، من غير مسافات، وبحد أقصى 20 حرف.'
  }

  const folded = code.toLocaleLowerCase('en')
  const duplicate = existing.some(
    (order) =>
      isActiveOrderStatus(order.status) &&
      order.code.toLocaleLowerCase('en') === folded,
  )

  if (duplicate) {
    return 'فيه أوردر شغّال بنفس الرقم ده، ومش مسموح تكراره دلوقتي. استخدم رقم جديد من نقطة البيع، أو استنى لما الأوردر الحالي يبقى جاهز للاستلام. بعد التسليم ينفع تستخدم نفس الرقم تاني.'
  }

  return null
}
