import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'border-accent bg-accent text-accent-foreground hover:bg-accent-hover hover:border-accent-hover',
  secondary: 'border-line bg-white/[0.025] text-text-primary hover:border-line-strong hover:bg-white/[0.05]',
  danger: 'border-error/35 bg-error/[0.06] text-error hover:border-error/60 hover:bg-error/[0.1]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    isLoading = false,
    fullWidth = false,
    icon,
    className = '',
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const unavailable = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={unavailable}
      aria-busy={isLoading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-button border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,transform,opacity] duration-fast ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border border-current border-r-transparent"
        />
      ) : icon ? (
        <span aria-hidden="true" className="flex shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
});
