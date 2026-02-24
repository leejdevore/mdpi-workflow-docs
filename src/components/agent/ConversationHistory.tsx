'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, X } from 'lucide-react';
import {
  fetchConversationsForWorkflow,
  deleteConversation,
} from '@/lib/supabase/agent-queries';
import type { AgentConversation } from '@/types/agent';
import type { UUID } from '@/types/workflow';

interface ConversationHistoryProps {
  workflowId: UUID;
  activeConversationId: UUID | null;
  onSelectConversation: (id: UUID) => void;
  onClose: () => void;
}

export function ConversationHistory({
  workflowId,
  activeConversationId,
  onSelectConversation,
  onClose,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchConversationsForWorkflow(workflowId)
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  const handleDelete = async (id: UUID, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // Silently fail — toast could be added here
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">
          Conversation History
        </h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            No conversations yet
          </div>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors group ${
                  conv.id === activeConversationId
                    ? 'bg-blue-50 border-r-2 border-blue-500'
                    : ''
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(conv.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="shrink-0 rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
