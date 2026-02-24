'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NavWorkflowTree } from './NavWorkflowTree';
import { NavActions } from './NavActions';

export function LeftNav() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`relative flex flex-col border-r border-slate-200 bg-white transition-all duration-200 shrink-0 ${
        collapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {!collapsed && (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workflows
            </h2>
          </div>

          {/* Scrollable tree */}
          <div className="flex-1 overflow-y-auto">
            <NavWorkflowTree />
          </div>

          {/* Actions */}
          <NavActions />
        </>
      )}
    </div>
  );
}
