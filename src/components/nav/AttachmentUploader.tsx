'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import type { PendingAttachment } from '@/types/export';

interface AttachmentUploaderProps {
  attachments: PendingAttachment[];
  onChange: (attachments: PendingAttachment[]) => void;
}

export function AttachmentUploader({ attachments, onChange }: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newAttachments: PendingAttachment[] = [...files].map((file, i) => ({
        file,
        displayOrder: attachments.length + i,
      }));
      onChange([...attachments, ...newAttachments]);
    },
    [attachments, onChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = attachments.filter((_, i) => i !== index);
      // Re-index display order
      onChange(updated.map((a, i) => ({ ...a, displayOrder: i })));
    },
    [attachments, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Reset input so the same file can be re-selected
        e.target.value = '';
      }
    },
    [addFiles],
  );

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        Attachments
      </label>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-1 px-4 py-5
          border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <Upload className="w-5 h-5 text-slate-400" />
        <span className="text-xs text-slate-500">
          Drop files here or <span className="text-blue-600">browse</span>
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* File list */}
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((att, index) => (
            <li
              key={`${att.file.name}-${index}`}
              className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded text-xs"
            >
              <FileIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="flex-1 truncate text-slate-700">{att.file.name}</span>
              <span className="text-slate-400 shrink-0">{formatSize(att.file.size)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                title="Remove file"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
