import type { CSSProperties } from 'react';

export interface SkeletonProps {
  className?: string;
  shape?: 'line' | 'block' | 'circle';
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
}

const shapeClasses: Record<NonNullable<SkeletonProps['shape']>, string> = {
  line: 'h-4 rounded-input',
  block: 'h-28 rounded-panel',
  circle: 'h-10 w-10 rounded-full',
};

export function Skeleton({
  className = '',
  shape = 'line',
  width,
  height,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden bg-white/[0.055] before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent ${shapeClasses[shape]} ${className}`}
      style={{ width, height }}
    />
  );
}

