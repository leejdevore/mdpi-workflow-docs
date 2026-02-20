'use client';

import type { ReactNode } from 'react';

export function ValidationShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 110" preserveAspectRatio="none">
        <path
          d="M100 2L190 30L190 82L100 108L10 82L10 30Z"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="2"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center w-full h-full px-6 py-4">
        {children}
      </div>
    </div>
  );
}
