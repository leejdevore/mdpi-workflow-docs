'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentHeader } from './AgentHeader';
import { ExportSelector } from './ExportSelector';
import { MessageBubble } from './MessageBubble';
import { AgentInput } from './AgentInput';
import { ConversationHistory } from './ConversationHistory';
import type { UUID } from '@/types/workflow';

interface AgentPanelProps {
  onClose: () => void;
}

// =========================================================
// Suggested prompts for empty state
// =========================================================

const SUGGESTED_PROMPTS = [
  'Analyze this workflow and suggest improvements',
  'Generate a database schema for this process',
  'Identify bottlenecks and pain points',
  'Create a React component for the first phase',
];

export function AgentPanel({ onClose }: AgentPanelProps) {
  const { activeWorkflow } = useWorkflowContext();
  const [selectedExportId, setSelectedExportId] = useState<UUID | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    conversationId,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    stopStreaming,
  } = useAgentChat({
    workflowId: activeWorkflow?.id ?? '',
    exportId: selectedExportId,
  });

  // -------------------------------------------------------
  // Auto-create a conversation on mount
  // -------------------------------------------------------
  useEffect(() => {
    if (!activeWorkflow || isInitialized) return;
    setIsInitialized(true);
    startNewConversation();
  }, [activeWorkflow, isInitialized, startNewConversation]);

  // -------------------------------------------------------
  // Auto-scroll to bottom on new messages
  // -------------------------------------------------------
  useEffect(() => {
    const el = messageListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // -------------------------------------------------------
  // Handle new conversation
  // -------------------------------------------------------
  const handleNewConversation = useCallback(async () => {
    await startNewConversation();
    setShowHistory(false);
  }, [startNewConversation]);

  // -------------------------------------------------------
  // Handle loading a conversation from history
  // -------------------------------------------------------
  const handleSelectConversation = useCallback(
    async (id: UUID) => {
      await loadConversation(id);
    },
    [loadConversation],
  );

  // -------------------------------------------------------
  // Handle export selection change
  // -------------------------------------------------------
  const handleExportSelect = useCallback((exportId: UUID | null) => {
    setSelectedExportId(exportId);
  }, []);

  if (!activeWorkflow) return null;

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed top-0 right-0 h-screen w-[480px] z-40 flex flex-col bg-white border-l border-slate-200 shadow-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <AgentHeader
        onClose={onClose}
        onToggleHistory={() => setShowHistory((prev) => !prev)}
        onNewConversation={handleNewConversation}
        showingHistory={showHistory}
      />

      {/* Export context selector */}
      <ExportSelector
        workflowId={activeWorkflow.id}
        selectedExportId={selectedExportId}
        onSelect={handleExportSelect}
      />

      {/* Message area (relative container for history overlay) */}
      <div className="relative flex-1 min-h-0">
        {/* Conversation history overlay */}
        {showHistory && (
          <ConversationHistory
            workflowId={activeWorkflow.id}
            activeConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Messages list */}
        <div
          ref={messageListRef}
          className="h-full overflow-y-auto px-4 py-4 space-y-4"
        >
          {!hasMessages && !isStreaming ? (
            <EmptyState onSuggest={sendMessage} />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={'id' in msg ? msg.id : `streaming-${i}`} message={msg} />
            ))
          )}

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <AgentInput
        onSend={sendMessage}
        disabled={!conversationId}
        isStreaming={isStreaming}
        onStop={stopStreaming}
      />
    </div>
  );
}

// =========================================================
// Empty state with suggested prompts
// =========================================================

function EmptyState({ onSuggest }: { onSuggest: (content: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-4">
        <Bot className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Workflow AI Agent
      </h3>
      <p className="text-xs text-slate-500 mb-6 max-w-[280px]">
        Ask questions about your workflow, generate code, or get architecture
        recommendations.
      </p>
      <div className="w-full space-y-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggest(prompt)}
            className="w-full flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
