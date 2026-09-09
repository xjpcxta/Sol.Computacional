import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  startIcon?: ReactNode;
  trailing?: ReactNode;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    startIcon,
    trailing,
    error,
    hint,
    className = '',
    id,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        {hint ? (
          <span id={hintId} className="text-xs text-text-tertiary">
            {hint}
          </span>
        ) : null}
      </div>

      <div className="relative flex min-h-12 items-center">
        {startIcon ? (
          <span aria-hidden="true" className="pointer-events-none absolute left-4 text-text-tertiary">
            {startIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`min-h-12 w-full rounded-input border bg-input px-4 text-base text-text-primary caret-accent outline-none transition-[border-color,box-shadow,background-color] duration-fast ease-out placeholder:text-text-tertiary hover:border-line-strong focus:border-accent focus:shadow-focus sm:text-sm ${startIcon ? 'pl-11' : ''} ${trailing ? 'pr-12' : ''} ${error ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(239,140,126,0.14)]' : 'border-line'} ${className}`}
          {...props}
        />
        {trailing ? <span className="absolute right-2 flex items-center">{trailing}</span> : null}
      </div>

      {error ? (
        <p id={errorId} className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});

