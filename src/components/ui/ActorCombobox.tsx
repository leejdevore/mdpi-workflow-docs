'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronDown } from 'lucide-react';
import type { ActorDefinition } from '@/types/workflow';

interface ActorComboboxProps {
  actors: ActorDefinition[];
  value: string;
  onChange: (actorId: string) => void;
  onCreateNew?: (name: string) => string | void;
  placeholder?: string;
  className?: string;
}

export function ActorCombobox({
  actors,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Select actor...',
  className = '',
}: ActorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedActor = actors.find((a) => a.id === value);

  const filtered = query.trim()
    ? actors.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.shortLabel.toLowerCase().includes(query.toLowerCase()) ||
        a.id.toLowerCase().includes(query.toLowerCase())
      )
    : actors;

  const showCreateOption =
    onCreateNew &&
    query.trim() &&
    !actors.some(
      (a) => a.label.toLowerCase() === query.trim().toLowerCase()
    );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (actorId: string) => {
      onChange(actorId);
      setIsOpen(false);
      setQuery('');
    },
    [onChange]
  );

  const handleCreate = useCallback(() => {
    if (!onCreateNew || !query.trim()) return;
    const result = onCreateNew(query.trim());
    if (typeof result === 'string') {
      onChange(result);
    }
    setIsOpen(false);
    setQuery('');
  }, [onCreateNew, query, onChange]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white hover:bg-slate-50 transition-colors text-left"
        >
          <span className={selectedActor ? 'text-slate-900' : 'text-slate-400'}>
            {selectedActor ? selectedActor.label : placeholder}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-1 border border-blue-400 rounded px-2 py-1.5 bg-white ring-1 ring-blue-400">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actors..."
            className="flex-1 text-sm outline-none bg-transparent min-w-0"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
              } else if (e.key === 'Enter') {
                if (filtered.length === 1) {
                  handleSelect(filtered[0].id);
                } else if (showCreateOption) {
                  handleCreate();
                }
              }
            }}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 && !showCreateOption && (
            <div className="px-3 py-2 text-sm text-slate-400">No matches found</div>
          )}

          {filtered.map((actor) => (
            <button
              key={actor.id}
              type="button"
              onClick={() => handleSelect(actor.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                actor.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                style={{ backgroundColor: actor.color }}
              />
              <span className="truncate">{actor.label}</span>
              {actor.shortLabel && actor.shortLabel !== actor.label && (
                <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                  {actor.shortLabel}
                </span>
              )}
            </button>
          ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 border-t border-slate-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create &ldquo;{query.trim()}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
