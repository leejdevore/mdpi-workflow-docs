'use client';

import type { ReactNode } from 'react';

export function TrapezoidShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 border-2"
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          backgroundColor: bgColor,
          borderColor: borderColor,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
        }}
      >
        <div className="flex items-center justify-center w-full h-full px-6 py-2">
          {children}
        </div>
      </div>
    </div>
  );
}
