import { cva, type VariantProps } from 'class-variance-authority';
import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const inputVariants = cva(
  // Базовые стили
  'w-full box-border transition-colors duration-200 focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'rounded-md border border-solid text-base border-[#444] bg-[#1e1e1e] py-2 px-3 text-[#f0f0f0] placeholder:text-gray-500 hover:border-gray-400 focus:border-blue-500',
        search:
          'rounded-md border-transparent bg-[#313131] py-2 pl-10 text-white placeholder:text-gray-400',
        unstyled:
          '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: VariantProps<typeof inputVariants>['variant'];
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, ...props }, ref) => {
    // Убираем div-обертку. Все стили применяются напрямую к input.
    return <input ref={ref} className={twMerge(inputVariants({ variant, className }))} {...props} />;
  }
);

Input.displayName = 'Input';