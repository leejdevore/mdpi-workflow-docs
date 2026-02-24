'use client';

import { Bot, History, Plus, X } from 'lucide-react';

interface AgentHeaderProps {
  onClose: () => void;
  onToggleHistory: () => void;
  onNewConversation: () => void;
  showingHistory: boolean;
}

export function AgentHeader({
  onClose,
  onToggleHistory,
  onNewConversation,
  showingHistory,
}: AgentHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">AI Agent</h2>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onNewConversation}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleHistory}
          className={`rounded-md p-1.5 transition-colors ${
            showingHistory
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
          title="Conversation history"
        >
          <History className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
