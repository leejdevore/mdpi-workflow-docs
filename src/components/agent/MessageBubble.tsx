'use client';

import type { DisplayMessage } from '@/types/agent';
import { MarkdownPreview } from '@/components/nav/MarkdownPreview';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: DisplayMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = 'isStreaming' in message && message.isStreaming;

  if (isUser) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <User className="h-3.5 w-3.5 text-blue-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Bot className="h-3.5 w-3.5 text-slate-600" />
      </div>
      <div className="max-w-[85%] rounded-lg border border-slate-200 bg-white px-4 py-2.5">
        {message.content ? (
          <MarkdownPreview content={message.content} />
        ) : isStreaming ? (
          <div className="flex items-center gap-1 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
          </div>
        ) : null}
        {isStreaming && message.content && (
          <span className="inline-block h-4 w-0.5 animate-pulse bg-slate-400 ml-0.5 align-text-bottom" />
        )}
      </div>
    </div>
  );
}
