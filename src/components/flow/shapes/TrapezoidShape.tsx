'use client';

import type { ReactNode } from 'react';

export function TrapezoidShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div
      className="relative w-full h-full [filter:drop-shadow(0_1px_2px_rgb(0_0_0/0.1))] hover:[filter:drop-shadow(0_4px_6px_rgb(0_0_0/0.1))] transition-[filter]"
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 100" preserveAspectRatio="none">
        <path
          d="M2 2L218 2L196 98L24 98Z"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center w-full h-full px-6 py-2">
        {children}
      </div>
    </div>
  );
}
