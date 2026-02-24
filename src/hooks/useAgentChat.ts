'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  AgentMessage,
  StreamingMessage,
  DisplayMessage,
  AgentStreamEvent,
} from '@/types/agent';
import type { UUID } from '@/types/workflow';
import {
  createConversation,
  fetchMessages,
  updateConversationTitle,
} from '@/lib/supabase/agent-queries';

// =========================================================
// Hook interface
// =========================================================

interface UseAgentChatOptions {
  workflowId: UUID;
  exportId?: UUID | null;
}

interface UseAgentChatReturn {
  messages: DisplayMessage[];
  isStreaming: boolean;
  conversationId: UUID | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: UUID) => Promise<void>;
  startNewConversation: () => Promise<UUID>;
  stopStreaming: () => void;
}

// =========================================================
// Hook implementation
// =========================================================

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<UUID | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFirstMessageRef = useRef(true);

  // -------------------------------------------------------
  // Start a new conversation
  // -------------------------------------------------------
  const startNewConversation = useCallback(async (): Promise<UUID> => {
    const conv = await createConversation({
      workflowId: options.workflowId,
      exportId: options.exportId ?? undefined,
    });
    setConversationId(conv.id);
    setMessages([]);
    setError(null);
    isFirstMessageRef.current = true;
    return conv.id;
  }, [options.workflowId, options.exportId]);

  // -------------------------------------------------------
  // Load an existing conversation
  // -------------------------------------------------------
  const loadConversation = useCallback(async (id: UUID) => {
    const msgs = await fetchMessages(id);
    setMessages(msgs);
    setConversationId(id);
    setError(null);
    isFirstMessageRef.current = msgs.length === 0;
  }, []);

  // -------------------------------------------------------
  // Stop streaming
  // -------------------------------------------------------
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // -------------------------------------------------------
  // Send a message and stream the response
  // -------------------------------------------------------
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || isStreaming) return;

      setError(null);
      setIsStreaming(true);

      // Optimistically add user message to display
      const optimisticUser: AgentMessage = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content,
        tokenCount: null,
        model: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);

      // Start streaming placeholder
      setStreamingMessage({ role: 'assistant', content: '', isStreaming: true });

      try {
        abortRef.current = new AbortController();

        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: content,
            exportId: options.exportId ?? undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${res.status}: ${res.statusText}`,
          );
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            let event: AgentStreamEvent;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === 'delta') {
              fullContent += event.text;
              setStreamingMessage({
                role: 'assistant',
                content: fullContent,
                isStreaming: true,
              });
            } else if (event.type === 'done') {
              // Replace streaming message with the persisted one
              const finalMsg: AgentMessage = {
                id: event.messageId,
                conversationId,
                role: 'assistant',
                content: fullContent,
                tokenCount: event.tokenCount,
                model: event.model,
                createdAt: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, finalMsg]);
              setStreamingMessage(null);

              // Auto-title the conversation after the first message
              if (isFirstMessageRef.current) {
                isFirstMessageRef.current = false;
                const title =
                  content.length > 60
                    ? content.slice(0, 57) + '...'
                    : content;
                updateConversationTitle(conversationId, title).catch(
                  () => {},
                );
              }
            } else if (event.type === 'error') {
              setError(event.message);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
        setStreamingMessage(null);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [conversationId, isStreaming, options.exportId],
  );

  // -------------------------------------------------------
  // Combine persisted + streaming messages for display
  // -------------------------------------------------------
  const displayMessages: DisplayMessage[] = streamingMessage
    ? [...messages, streamingMessage]
    : messages;

  return {
    messages: displayMessages,
    isStreaming,
    conversationId,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    stopStreaming,
  };
}
