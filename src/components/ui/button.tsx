import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]',
          {
            'bg-amber-700 text-white hover:bg-amber-800 focus-visible:ring-amber-600 shadow-md hover:shadow-lg':
              variant === 'primary',
            'bg-stone-200 text-stone-800 hover:bg-stone-300 focus-visible:ring-stone-400':
              variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-md':
              variant === 'danger',
            'bg-transparent text-stone-700 hover:bg-stone-100 focus-visible:ring-stone-400':
              variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
