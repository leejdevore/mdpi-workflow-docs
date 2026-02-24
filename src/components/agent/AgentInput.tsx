'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { SendHorizontal, Square } from 'lucide-react';

interface AgentInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  isStreaming: boolean;
  onStop: () => void;
}

export function AgentInput({
  onSend,
  disabled,
  isStreaming,
  onStop,
}: AgentInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 px-4 py-3 bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder={
          isStreaming ? 'Agent is responding...' : 'Ask about this workflow...'
        }
        disabled={isStreaming}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
      />
      {isStreaming ? (
        <button
          onClick={onStop}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Stop generating"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400"
          title="Send message"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
