import { createClient } from './client';
import type { AgentConversation, AgentMessage } from '@/types/agent';
import type { UUID } from '@/types/workflow';

// =========================================================
// DB row types (snake_case from Supabase)
// =========================================================

interface DbAgentConversation {
  id: string;
  workflow_id: string;
  export_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

interface DbAgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_count: number | null;
  model: string | null;
  created_at: string;
}

// =========================================================
// DB → Domain transforms
// =========================================================

function toConversation(row: DbAgentConversation): AgentConversation {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    exportId: row.export_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row: DbAgentMessage): AgentMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    tokenCount: row.token_count,
    model: row.model,
    createdAt: row.created_at,
  };
}

// =========================================================
// Conversation CRUD
// =========================================================

/** Create a new agent conversation */
export async function createConversation(params: {
  workflowId: UUID;
  exportId?: UUID;
  title?: string;
}): Promise<AgentConversation> {
  if (!params.workflowId) throw new Error('workflowId is required');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({
      workflow_id: params.workflowId,
      export_id: params.exportId ?? null,
      title: params.title ?? 'New Conversation',
    })
    .select()
    .single();

  if (error) throw error;
  return toConversation(data);
}

/** Fetch all conversations for a workflow, newest first */
export async function fetchConversationsForWorkflow(
  workflowId: UUID,
): Promise<AgentConversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toConversation);
}

/** Fetch a single conversation by ID */
export async function fetchConversation(
  conversationId: UUID,
): Promise<AgentConversation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) return null;
  return toConversation(data);
}

/** Update a conversation's title */
export async function updateConversationTitle(
  conversationId: UUID,
  title: string,
): Promise<AgentConversation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .update({ title })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return toConversation(data);
}

/** Delete a conversation and all its messages (cascade) */
export async function deleteConversation(conversationId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('agent_conversations')
    .delete()
    .eq('id', conversationId);
  if (error) throw error;
}

// =========================================================
// Message CRUD
// =========================================================

/** Fetch all messages for a conversation, oldest first */
export async function fetchMessages(
  conversationId: UUID,
): Promise<AgentMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toMessage);
}

/** Create a single message record */
export async function createMessage(params: {
  conversationId: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
  model?: string;
}): Promise<AgentMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      token_count: params.tokenCount ?? null,
      model: params.model ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toMessage(data);
}
