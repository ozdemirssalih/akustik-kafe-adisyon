import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'default'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase',
        {
          'bg-emerald-100 text-emerald-700': variant === 'success',
          'bg-amber-100 text-amber-700': variant === 'warning',
          'bg-red-100 text-red-700': variant === 'danger',
          'bg-stone-100 text-stone-600': variant === 'default',
        },
        className
      )}
      {...props}
    />
  )
}
