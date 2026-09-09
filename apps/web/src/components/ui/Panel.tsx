import type { HTMLAttributes, ReactNode } from 'react';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'plain' | 'raised' | 'accent';
  crosshair?: boolean;
  children: ReactNode;
}

const toneClasses: Record<NonNullable<PanelProps['tone']>, string> = {
  plain: 'line-panel',
  raised: 'line-panel line-panel-raised',
  accent: 'line-panel line-panel-accent',
};

export function Panel({
  tone = 'plain',
  crosshair = false,
  className = '',
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={`${toneClasses[tone]} ${crosshair ? 'technical-crosshair' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

