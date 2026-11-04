import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn.ts'

const variants = {
  primary:
    'bg-mint text-on-mint shadow-[0_0_24px_-6px_var(--color-mint)] hover:bg-mint-hover',
  secondary:
    'border border-line bg-elevated text-ink hover:bg-surface',
  ghost: 'text-muted hover:bg-elevated hover:text-ink',
  danger: 'bg-rose-700 text-white hover:bg-rose-800',
} as const

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
