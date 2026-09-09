export interface BrandLockupProps {
  compact?: boolean;
  iconOnly?: boolean;
  descriptor?: string;
  className?: string;
}

export function BrandLockup({
  compact = false,
  iconOnly = false,
  descriptor,
  className = '',
}: BrandLockupProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <img
        src="/pricefunc-mark.svg"
        alt=""
        aria-hidden="true"
        width="40"
        height="40"
        className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 outline-none`}
      />
      {!iconOnly ? <span className="min-w-0">
        <span className={`${compact ? 'text-lg' : 'text-xl'} block whitespace-nowrap font-display font-medium tracking-[-0.035em] text-text-primary`}>
          Price<span className="text-accent">Func</span>
        </span>
        {descriptor ? (
          <span className="mt-0.5 block truncate text-xs text-text-tertiary">{descriptor}</span>
        ) : null}
      </span> : null}
    </span>
  );
}
