import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { fieldClassName } from './fieldClass.ts'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name

  return (
    <label htmlFor={fieldId} className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input id={fieldId} className={fieldClassName} {...props} />
      {error ? <span className="block text-rose-400">{error}</span> : null}
      {hint && !error ? <span className="block text-muted">{hint}</span> : null}
    </label>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: ReactNode
}

export function TextArea({ label, hint, id, ...props }: TextAreaProps) {
  const fieldId = id ?? props.name

  return (
    <label htmlFor={fieldId} className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <textarea id={fieldId} className={fieldClassName} {...props} />
      {hint ? <span className="block text-muted">{hint}</span> : null}
    </label>
  )
}
