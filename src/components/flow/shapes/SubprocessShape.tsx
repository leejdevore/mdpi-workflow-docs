'use client';

import type { ReactNode } from 'react';

export function SubprocessShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div className="w-full h-full shadow-sm hover:shadow-md transition-shadow">
      <div
        className="w-full h-full border-2 px-5 py-2 flex items-start"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          boxShadow: `inset 8px 0 0 -4px ${borderColor}, inset -8px 0 0 -4px ${borderColor}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
