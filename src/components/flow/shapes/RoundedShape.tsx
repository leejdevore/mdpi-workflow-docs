'use client';

import type { ReactNode } from 'react';

export function RoundedShape({ children, bgColor, borderColor }: { children: ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div
      className="w-full h-full border-2 flex items-center justify-center px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
      style={{
        borderRadius: '9999px',
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      {children}
    </div>
  );
}
