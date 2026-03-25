import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm',
          'placeholder:text-stone-400',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
