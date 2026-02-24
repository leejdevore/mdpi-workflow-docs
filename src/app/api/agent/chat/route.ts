import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AgentChatRequest } from '@/types/agent';

export const maxDuration = 60; // Allow up to 60s for streaming on Vercel

export async function POST(request: NextRequest) {
  // -------------------------------------------------------
  // 1. Validate API key
  // -------------------------------------------------------
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-api-key-here') {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 },
    );
  }

  const anthropic = new Anthropic({ apiKey });

  // -------------------------------------------------------
  // 2. Parse request body
  // -------------------------------------------------------
  let body: AgentChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { conversationId, message, exportId } = body;

  if (!conversationId || !message?.trim()) {
    return NextResponse.json(
      { error: 'conversationId and message are required' },
      { status: 400 },
    );
  }

  // -------------------------------------------------------
  // 3. Create server-side Supabase client
  // -------------------------------------------------------
  const supabase = await createServerSupabaseClient();

  // -------------------------------------------------------
  // 4. Load export markdown if exportId provided
  // -------------------------------------------------------
  let exportMarkdown = '';
  if (exportId) {
    const { data: exportData } = await supabase
      .from('workflow_exports')
      .select('title, markdown_content')
      .eq('id', exportId)
      .single();

    if (exportData) {
      exportMarkdown = exportData.markdown_content;
    }
  }

  // -------------------------------------------------------
  // 5. Load conversation history from DB
  // -------------------------------------------------------
  const { data: dbMessages } = await supabase
    .from('agent_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const history = [
    ...(dbMessages ?? [])
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    { role: 'user' as const, content: message },
  ];

  // -------------------------------------------------------
  // 6. Save user message to DB
  // -------------------------------------------------------
  await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: message,
  });

  // -------------------------------------------------------
  // 7. Build system prompt
  // -------------------------------------------------------
  const systemPrompt = buildSystemPrompt(exportMarkdown);

  // -------------------------------------------------------
  // 8. Stream from Claude
  // -------------------------------------------------------
  let fullContent = '';
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        stream.on('text', (text) => {
          fullContent += text;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'delta', text })}\n\n`,
            ),
          );
        });

        // Wait for stream to finish
        const finalMessage = await stream.finalMessage();
        const tokenCount =
          finalMessage.usage.input_tokens +
          finalMessage.usage.output_tokens;

        // Save assistant message to DB
        const { data: saved } = await supabase
          .from('agent_messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullContent,
            token_count: tokenCount,
            model: finalMessage.model,
          })
          .select('id')
          .single();

        // Send completion event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              messageId: saved?.id,
              tokenCount,
              model: finalMessage.model,
            })}\n\n`,
          ),
        );

        controller.close();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// =========================================================
// System prompt builder
// =========================================================

function buildSystemPrompt(exportMarkdown: string): string {
  const base = `You are an expert software architect and developer assistant specializing in building workflow application modules. You help users design and implement software based on workflow specifications.

Your capabilities:
- Analyze workflow specifications and suggest implementation approaches
- Generate code for workflow modules (React components, API routes, database schemas)
- Explain business logic and process flows
- Suggest improvements to workflow designs
- Help debug implementation issues

Guidelines:
- Be concise but thorough
- Use code blocks with language identifiers
- Reference specific steps, actors, and phases from the workflow spec when relevant
- Suggest practical, production-ready solutions
- Follow Next.js App Router patterns, React 19, Tailwind CSS v4, and Supabase conventions`;

  if (exportMarkdown) {
    return `${base}

---

## Workflow Specification Context

The following is the exported workflow specification that serves as the basis for this conversation:

${exportMarkdown}`;
  }

  return base;
}
