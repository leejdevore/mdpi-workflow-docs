'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, FileText } from 'lucide-react';
import type { ManagedWorkflow } from '@/hooks/useWorkflowManager';

interface WorkflowSelectorProps {
  workflows: ManagedWorkflow[];
  activeWorkflowId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string, description?: string) => void;
  onDelete: (id: string) => void;
}

export function WorkflowSelector({
  workflows,
  activeWorkflowId,
  onSwitch,
  onCreate,
  onDelete,
}: WorkflowSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowNewForm(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when form opens
  useEffect(() => {
    if (showNewForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNewForm]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
    setShowNewForm(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
      >
        <FileText className="w-4 h-4 text-slate-400" />
        <span className="max-w-[200px] truncate">{activeWorkflow?.name ?? 'Select Workflow'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Workflow list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                  wf.id === activeWorkflowId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => {
                  onSwitch(wf.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    wf.id === activeWorkflowId ? 'text-blue-700' : 'text-slate-700'
                  }`}>
                    {wf.name}
                  </p>
                  {wf.description && (
                    <p className="text-[11px] text-slate-400 truncate">{wf.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {wf.isDefault && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  {!wf.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(wf.id);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200" />

          {/* New workflow form or button */}
          {showNewForm ? (
            <div className="p-3">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setShowNewForm(false);
                    setNewName('');
                  }
                }}
                placeholder="Workflow name..."
                className="w-full text-sm border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 mb-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewForm(false);
                    setNewName('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Workflow
            </button>
          )}
        </div>
      )}
    </div>
  );
}
