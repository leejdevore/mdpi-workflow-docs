'use client';

import type { ReactNode } from 'react';

export function DocumentShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div
      className="relative w-full h-full [filter:drop-shadow(0_1px_2px_rgb(0_0_0/0.1))] hover:[filter:drop-shadow(0_4px_6px_rgb(0_0_0/0.1))] transition-[filter]"
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 110" preserveAspectRatio="none">
        <path
          d="M0 0 H220 V90 C183 78, 147 102, 110 90 C73 78, 37 102, 0 90 Z"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
      <div className="relative z-10 px-3 py-2 pb-6">
        {children}
      </div>
    </div>
  );
}
