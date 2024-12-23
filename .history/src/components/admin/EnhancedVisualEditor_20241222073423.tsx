import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Save, Eye, EyeOff, Grid as GridIcon, Settings, X, Keyboard } from 'lucide-react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useVisualEditor } from '../../contexts/VisualEditorContext';
import { toast } from 'react-toastify';

interface EditableComponent {
  id: string;
  element: HTMLElement;
  originalStyles: Partial<CSSStyleDeclaration>;
  currentStyles: Partial<CSSStyleDeclaration>;
  bounds: DOMRect;
}

export function EnhancedVisualEditor() {
  const navigate = useNavigate();
  const { isActive, setIsActive } = useVisualEditor();
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(8);
  const [selectedComponent, setSelectedComponent] = useState<EditableComponent | null>(null);
  const [editableComponents, setEditableComponents] = useState<EditableComponent[]>([]);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Initialize editable components
  useEffect(() => {
    if (!isActive) return;

    // Find all potential editable elements
    const elements = document.querySelectorAll('button, div, input, select, h1, h2, h3, p, span, a');
    const components: EditableComponent[] = Array.from(elements).map((element, index) => {
      const bounds = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      const originalStyles = {
        position: styles.position,
        border: styles.border,
        cursor: styles.cursor,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        padding: styles.padding,
        margin: styles.margin,
        width: styles.width,
        height: styles.height,
      };

      return {
        id: `component_${index}`,
        element: element as HTMLElement,
        originalStyles,
        currentStyles: { ...originalStyles },
        bounds,
      };
    });

    setEditableComponents(components);

    // Add highlight on hover
    const handleMouseOver = (e: MouseEvent) => {
      if (!isActive) return;
      const element = e.target as HTMLElement;
      if (element === overlayRef.current) return;
      
      element.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
      element.style.cursor = 'pointer';
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!isActive) return;
      const element = e.target as HTMLElement;
      if (element === overlayRef.current) return;
      
      if (!selectedComponent || element !== selectedComponent.element) {
        element.style.outline = 'none';
        element.style.cursor = '';
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      
      // Restore original styles
      components.forEach(component => {
        Object.assign(component.element.style, component.originalStyles);
      });
    };
  }, [isActive]);

  // Handle component selection
  const handleComponentClick = (e: MouseEvent) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();

    const element = e.target as HTMLElement;
    if (element === overlayRef.current) return;

    const component = editableComponents.find(c => c.element === element);
    if (component) {
      setSelectedComponent(component);
      element.style.outline = '2px solid rgb(59, 130, 246)';
    }
  };

  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('click', handleComponentClick, true);
    return () => document.removeEventListener('click', handleComponentClick, true);
  }, [isActive, editableComponents]);

  // Update component styles
  const updateComponentStyles = (styles: Partial<CSSStyleDeclaration>) => {
    if (!selectedComponent) return;

    const updatedStyles = { ...selectedComponent.currentStyles, ...styles };
    Object.assign(selectedComponent.element.style, styles);

    setEditableComponents(components =>
      components.map(c =>
        c.id === selectedComponent.id
          ? { ...c, currentStyles: updatedStyles }
          : c
      )
    );
  };

  // Export current state
  const exportState = () => {
    const state = editableComponents.map(component => ({
      id: component.id,
      selector: generateSelector(component.element),
      styles: component.currentStyles,
    }));

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-editor-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate unique selector for element
  const generateSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    
    let selector = element.tagName.toLowerCase();
    if (element.className) {
      selector += `.${element.className.split(' ').join('.')}`;
    }
    
    return selector;
  };

  // Show activation toast
  useEffect(() => {
    if (isActive) {
      toast.info(
        <div>
          <p className="font-medium">Visual Editor Activated</p>
          <p className="text-sm opacity-80">Press ESC to exit</p>
        </div>,
        { autoClose: 2000 }
      );
    }
  }, [isActive]);

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    >
      {/* Shortcuts Panel */}
      {isActive && (
        <div className="fixed left-4 top-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard size={16} />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Shortcuts</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Alt + E</kbd>
              <span>Toggle Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
              <span>Exit Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">G</kbd>
              <span>Toggle Grid</span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {isActive && (
        <div className="fixed top-4 right-4 flex items-center space-x-2 pointer-events-auto">
          <Button
            variant="outline"
            onClick={() => setShowGrid(!showGrid)}
            icon={<GridIcon size={16} />}
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </Button>
          <Button
            variant="outline"
            onClick={exportState}
            icon={<Save size={16} />}
          >
            Export
          </Button>
          {window.location.pathname === '/admin' && (
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              icon={<X size={16} />}
            >
              Back
            </Button>
          )}
        </div>
      )}

      {/* Grid Overlay */}
      {isActive && showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(156, 163, 175, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(156, 163, 175, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        />
      )}

      {/* Properties Panel */}
      {isActive && showPropertiesPanel && selectedComponent && (
        <div className="fixed right-4 top-16 w-64 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Properties</h3>
            <button
              onClick={() => setSelectedComponent(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Background Color
              </label>
              <input
                type="color"
                value={selectedComponent.currentStyles.backgroundColor?.toString() || '#ffffff'}
                onChange={(e) => updateComponentStyles({ backgroundColor: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Text Color
              </label>
              <input
                type="color"
                value={selectedComponent.currentStyles.color?.toString() || '#000000'}
                onChange={(e) => updateComponentStyles({ color: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Padding
              </label>
              <input
                type="text"
                value={selectedComponent.currentStyles.padding?.toString() || ''}
                onChange={(e) => updateComponentStyles({ padding: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., 1rem or 16px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Margin
              </label>
              <input
                type="text"
                value={selectedComponent.currentStyles.margin?.toString() || ''}
                onChange={(e) => updateComponentStyles({ margin: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., 1rem or 16px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Width
              </label>
              <input
                type="text"
                value={selectedComponent.currentStyles.width?.toString() || ''}
                onChange={(e) => updateComponentStyles({ width: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., 100% or 200px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Height
              </label>
              <input
                type="text"
                value={selectedComponent.currentStyles.height?.toString() || ''}
                onChange={(e) => updateComponentStyles({ height: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., auto or 200px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedVisualEditor; 