'use client';

import type { ReactNode } from 'react';

export function DiamondShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div
      className="relative w-full h-full [filter:drop-shadow(0_1px_2px_rgb(0_0_0/0.1))] hover:[filter:drop-shadow(0_4px_6px_rgb(0_0_0/0.1))] transition-[filter]"
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
        <path
          d="M100 2L198 60L100 118L2 60Z"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center w-full h-full px-6 py-4">
        {children}
      </div>
    </div>
  );
}
