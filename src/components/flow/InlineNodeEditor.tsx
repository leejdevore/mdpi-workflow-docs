'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface InlineNodeEditorProps {
  nodeId: string;
  initialTitle: string;
  onSave: (nodeId: string, title: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

export function InlineNodeEditor({
  nodeId,
  initialTitle,
  onSave,
  onCancel,
  position,
}: InlineNodeEditorProps) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialTitle) {
      onSave(nodeId, trimmed);
    } else {
      onCancel();
    }
  }, [value, initialTitle, nodeId, onSave, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    },
    [handleSave, onCancel]
  );

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="text-xs font-semibold bg-white border-2 border-blue-400 rounded px-2 py-1 shadow-lg focus:outline-none min-w-[180px]"
      />
    </div>
  );
}
