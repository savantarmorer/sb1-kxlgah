import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface VisualEditorContextType {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const VisualEditorContext = createContext<VisualEditorContextType | undefined>(undefined);

export function VisualEditorProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Alt+E
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault(); // Prevent default browser behavior
        setIsActive(prev => !prev);
      }
      // Or escape to exit
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

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

// Import at the end to avoid circular dependency
import { EnhancedVisualEditor } from '../components/admin/EnhancedVisualEditor';
 