'use client';

import type { ReactNode } from 'react';

export function DiamondShape({ children, borderColor }: { children: ReactNode; borderColor: string }) {
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          backgroundColor: 'white',
          border: `2px solid ${borderColor}`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      >
        <div className="flex items-center justify-center w-full h-full px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
