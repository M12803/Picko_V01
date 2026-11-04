import { QRCodeSVG } from 'qrcode.react'

const SLIP_SENTENCE = 'تابع حالة الأوردر من هنا'

/** Quiet zone is included in `size` via marginSize, plus CSS padding around the SVG. */
const QR_SIZE_PX = 168

export function ThermalSlip({
  orderCode,
  trackingUrl,
}: {
  orderCode: string
  trackingUrl: string
}) {
  return (
    <article className="thermal-slip">
      <p className="thermal-slip-code" dir="ltr">
        {orderCode}
      </p>
      <p className="thermal-slip-sentence">{SLIP_SENTENCE}</p>
      <div className="thermal-slip-qr">
        <QRCodeSVG
          value={trackingUrl}
          size={QR_SIZE_PX}
          level="M"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#000000"
          title={`رمز تتبع الأوردر ${orderCode}`}
        />
      </div>
    </article>
  )
}
