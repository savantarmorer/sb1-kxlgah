import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnhancedVisualEditor } from '../components/admin/EnhancedVisualEditor';

interface VisualEditorContextType {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const VisualEditorContext = createContext<VisualEditorContextType | undefined>(undefined);

export function VisualEditorProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <VisualEditorContext.Provider value={{ isActive, setIsActive }}>
      {children}
      {isActive && <EnhancedVisualEditor />}
    </VisualEditorContext.Provider>
  );
}

export function useVisualEditor() {
  const context = useContext(VisualEditorContext);
  if (context === undefined) {
    throw new Error('useVisualEditor must be used within a VisualEditorProvider');
  }
  return context;
}
 