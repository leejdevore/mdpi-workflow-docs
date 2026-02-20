'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { ViewMode } from '@/types/comparison';

interface EditModeContextValue {
  isEditMode: boolean;
  toggleEditMode: () => void;
  canEdit: boolean;
}

const EditModeContext = createContext<EditModeContextValue>({
  isEditMode: false,
  toggleEditMode: () => {},
  canEdit: false,
});

export function EditModeProvider({
  viewMode,
  children,
}: {
  viewMode: ViewMode;
  children: ReactNode;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const canEdit = viewMode === 'tabs';

  // Auto-disable edit mode when switching away from tabs
  const effectiveEditMode = canEdit && isEditMode;

  const toggleEditMode = useCallback(() => {
    if (canEdit) setIsEditMode((prev) => !prev);
  }, [canEdit]);

  return (
    <EditModeContext.Provider
      value={{ isEditMode: effectiveEditMode, toggleEditMode, canEdit }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
