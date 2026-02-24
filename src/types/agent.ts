import type { UUID } from './workflow';

// =========================================================
// Agent domain entities
// =========================================================

/** A conversation between a user and the AI agent */
export interface AgentConversation {
  id: UUID;
  workflowId: UUID;
  exportId: UUID | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/** A single message within a conversation */
export interface AgentMessage {
  id: UUID;
  conversationId: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number | null;
  model: string | null;
  createdAt: string;
}

// =========================================================
// Streaming state (client-only, not persisted)
// =========================================================

/** Transient message displayed during streaming (before persisted) */
export interface StreamingMessage {
  role: 'assistant';
  content: string;
  isStreaming: true;
}

/** Union type for the message list display */
export type DisplayMessage = AgentMessage | StreamingMessage;

// =========================================================
// API request / response types
// =========================================================

/** Request body sent to POST /api/agent/chat */
export interface AgentChatRequest {
  conversationId: UUID;
  message: string;
  exportId?: UUID;
}

/** Streamed SSE event: text chunk */
export interface AgentStreamDelta {
  type: 'delta';
  text: string;
}

/** Streamed SSE event: completion metadata */
export interface AgentStreamDone {
  type: 'done';
  messageId: UUID;
  tokenCount: number;
  model: string;
}

/** Streamed SSE event: error */
export interface AgentStreamError {
  type: 'error';
  message: string;
}

/** Union of all SSE event types */
export type AgentStreamEvent = AgentStreamDelta | AgentStreamDone | AgentStreamError;
