import { cva, type VariantProps } from 'class-variance-authority';
import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const buttonVariants = cva(
  // Базовые стили для всех кнопок
  'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 active:shadow-inner active:translate-y-px',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600',
        ghost: 'bg-transparent hover:bg-gray-500/20 focus-visible:outline-none focus-visible:bg-gray-500/20',
        // Удален w-11 h-11, размер теперь управляется вариантом size
        icon: 'relative isolate bg-transparent text-gray-400 rounded-full hover:text-white hover:bg-blue-500/20 focus-visible:outline-none after:absolute after:inset-0 after:-z-10 after:rounded-full focus-visible:after:bg-blue-500/20 focus-visible:after:animate-pulse-shadow overflow-visible',
        link: 'bg-transparent text-blue-400 hover:underline',
      },
      size: {
        default: 'px-4 py-2',
        // Добавляем специальный размер для кнопок-иконок
        // Он задает и размер кнопки, и CSS-переменную для размера иконки внутри
        icon: 'w-11 h-11 [--icon-size:24px]',
        lg: 'w-[45px] h-[45px] [--icon-size:27px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

type ButtonOwnProps<C extends React.ElementType> = VariantProps<
  typeof buttonVariants
> & {
  as?: C;
  children?: React.ReactNode;
  className?: string;
};

type ButtonProps<C extends React.ElementType> = ButtonOwnProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

const Button = forwardRef(
  <C extends React.ElementType = 'button'>(
    { as, variant, size, className, ...props }: ButtonProps<C>,
    ref: React.ForwardedRef<C>
  ) => {
    const Component = as || 'button';

    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={twMerge(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };