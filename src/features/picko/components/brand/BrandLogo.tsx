import logo from '@/assets/picko-logo.png.asset.json'
import { cn } from '../../utils/cn.ts'

// The site is locked to dark mode, so the dark-background logo is always shown.
export function BrandLogo({ className, alt = '' }: { className?: string; alt?: string }) {
  return (
    <span className={cn('inline-flex shrink-0', className)}>
      <img src={logo.url} alt={alt} className="size-full object-contain" />
    </span>
  )
}
