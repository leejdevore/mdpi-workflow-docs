'use client';

import type { ReactNode } from 'react';

export function ParallelogramShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 border-2"
        style={{
          clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
          backgroundColor: bgColor,
          borderColor: borderColor,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
        }}
      >
        <div className="flex items-center justify-center w-full h-full px-8 py-2">
          {children}
        </div>
      </div>
    </div>
  );
}
