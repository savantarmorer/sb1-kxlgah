import React, { useState, useRef, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Code, Save, Eye, EyeOff, Grid as GridIcon, Settings, X, Keyboard, Plus, Link, Layers, Move } from 'lucide-react';
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
  connections: string[];
  events: { [key: string]: Function }; // Event name -> function
  customFunctions: { [key: string]: string }; // Function name -> code
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'event' | 'data' | 'function';
}

interface ComponentTemplate {
  type: string;
  name: string;
  icon: React.ReactNode;
  defaultProps?: Record<string, any>;
  defaultStyles?: Partial<CSSStyleDeclaration>;
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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const dragControls = useDragControls();

  const componentTemplates: ComponentTemplate[] = [
    {
      type: 'container',
      name: 'Container',
      icon: <Layers size="sm" />,
      defaultStyles: {
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '0.5rem',
        minWidth: '200px',
        minHeight: '100px',
      }
    },
    {
      type: 'button',
      name: 'Button',
      icon: <Button size="sm" />,
      defaultProps: {
        innerHTML: 'New Button',
        className: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
      }
    },
    {
      type: 'input',
      name: 'Text Input',
      icon: <input className="w-4 h-4" />,
      defaultProps: {
        type: 'text',
        placeholder: 'Enter text...',
        className: 'px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500'
      }
    },
    {
      type: 'select',
      name: 'Dropdown',
      icon: <select className="w-4 h-4" />,
      defaultProps: {
        innerHTML: '<option>Select an option...</option>',
        className: 'px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500'
      }
    },
    {
      type: 'div',
      name: 'Card',
      icon: <Layers size="sm" />,
      defaultStyles: {
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: '200px',
      }
    }
  ];

  // Handle keyboard shortcuts with more features
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      // Toggle grid with 'G' key
      if (e.key.toLowerCase() === 'g' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowGrid(prev => !prev);
      }

      // Deselect component with Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedComponent) {
          setSelectedComponent(null);
        } else {
          setIsActive(false);
        }
      }

      // Delete selected component with Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponent) {
        e.preventDefault();
        selectedComponent.element.remove();
        setEditableComponents(prev => prev.filter(c => c.id !== selectedComponent.id));
        setSelectedComponent(null);
      }

      // Toggle component library with 'L' key
      if (e.key.toLowerCase() === 'l' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowComponentLibrary(prev => !prev);
      }

      // Copy component with Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedComponent) {
        e.preventDefault();
        const newElement = selectedComponent.element.cloneNode(true) as HTMLElement;
        const offset = 20; // Offset for the new component position
        
        Object.assign(newElement.style, {
          left: `${parseInt(selectedComponent.element.style.left || '0') + offset}px`,
          top: `${parseInt(selectedComponent.element.style.top || '0') + offset}px`,
        });

        const newComponent: EditableComponent = {
          id: `component_${Date.now()}`,
          element: newElement,
          originalStyles: { ...selectedComponent.originalStyles },
          currentStyles: { ...selectedComponent.currentStyles },
          bounds: newElement.getBoundingClientRect(),
          connections: [],
          events: { ...selectedComponent.events },
          customFunctions: { ...selectedComponent.customFunctions }
        };

        setEditableComponents(prev => [...prev, newComponent]);
        document.body.appendChild(newElement);
        setSelectedComponent(newComponent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedComponent]);

  // Initialize editable components with improved filtering
  useEffect(() => {
    if (!isActive) return;

    // Find all potential editable elements, excluding editor UI elements
    const elements = document.querySelectorAll('button, div, input, select, h1, h2, h3, p, span, a');
    const components: EditableComponent[] = Array.from(elements)
      .filter(element => {
        // Exclude editor UI elements
        const isEditorElement = element.closest('[data-visual-editor]') !== null;
        // Exclude elements with no dimensions
        const rect = element.getBoundingClientRect();
        const hasDimensions = rect.width > 0 && rect.height > 0;
        return !isEditorElement && hasDimensions;
      })
      .map((element, index) => {
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
          outline: styles.outline,
          outlineOffset: styles.outlineOffset,
        };

        return {
          id: `component_${index}`,
          element: element as HTMLElement,
          originalStyles,
          currentStyles: { ...originalStyles },
          bounds,
          connections: [],
          events: {},
          customFunctions: {}
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

  // Properties Panel content
  const renderPropertiesPanel = () => {
    if (!selectedComponent) return null;

    return (
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

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Element Info
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Tag: {selectedComponent.element.tagName.toLowerCase()}</p>
            <p>Classes: {selectedComponent.element.className || 'none'}</p>
            <p>ID: {selectedComponent.element.id || 'none'}</p>
          </div>
        </div>
      </div>
    );
  };

  // Handle component dragging
  const handleDragStart = (e: React.PointerEvent, component: EditableComponent) => {
    if (!isActive || e.target !== component.element) return;
    setIsDragging(true);
    const rect = component.element.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDrag = (e: React.PointerEvent, component: EditableComponent) => {
    if (!isDragging) return;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Apply grid snapping if enabled
    const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
    
    updateComponentStyles({
      position: 'absolute',
      left: `${snappedX}px`,
      top: `${snappedY}px`,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Create new component with improved positioning
  const createComponent = (template: ComponentTemplate) => {
    const element = document.createElement(template.type === 'button' ? 'button' : template.type);
    
    // Set default styles
    if (template.defaultStyles) {
      Object.assign(element.style, template.defaultStyles);
    }
    
    // Set default props
    if (template.defaultProps) {
      Object.entries(template.defaultProps).forEach(([key, value]) => {
        if (key === 'innerHTML') {
          element.innerHTML = value as string;
        } else if (key === 'className') {
          element.className = value as string;
        } else {
          element.setAttribute(key, value as string);
        }
      });
    }

    // Position in center of viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    element.style.position = 'absolute';
    element.style.left = `${viewportWidth / 2 - 100}px`; // Assuming default width of 200px
    element.style.top = `${viewportHeight / 2 - 50}px`; // Assuming default height of 100px
    
    const component: EditableComponent = {
      id: `component_${Date.now()}`,
      element,
      originalStyles: { ...template.defaultStyles },
      currentStyles: { ...template.defaultStyles },
      bounds: element.getBoundingClientRect(),
      connections: [],
      events: {},
      customFunctions: {}
    };

    setEditableComponents(prev => [...prev, component]);
    document.body.appendChild(element);
    
    // Select the new component
    setSelectedComponent(component);
  };

  // Create connection between components
  const createConnection = (from: EditableComponent, to: EditableComponent, type: Connection['type']) => {
    const connection: Connection = {
      id: `connection_${Date.now()}`,
      from: from.id,
      to: to.id,
      type
    };

    setConnections(prev => [...prev, connection]);
    setEditableComponents(prev => prev.map(c => {
      if (c.id === from.id) {
        return { ...c, connections: [...c.connections, to.id] };
      }
      return c;
    }));
  };

  // Add event handler with type safety
  const addEventHandler = (component: EditableComponent, eventName: string, code: string) => {
    try {
      const handler = new Function('event', code);
      setEditableComponents(prev => prev.map(c => {
        if (c.id === component.id) {
          return {
            ...c,
            events: { ...c.events, [eventName]: handler },
            customFunctions: { ...c.customFunctions, [`${eventName}_code`]: code }
          };
        }
        return c;
      }));

      // Attach event listener safely
      component.element.addEventListener(eventName, handler as EventListener);
    } catch (error) {
      console.error('Failed to create event handler:', error);
      toast.error('Failed to create event handler. Check the console for details.');
    }
  };

  // Render connections
  const renderConnections = () => {
    if (!showConnections) return null;

    return connections.map(connection => {
      const fromComponent = editableComponents.find(c => c.id === connection.from);
      const toComponent = editableComponents.find(c => c.id === connection.to);
      if (!fromComponent || !toComponent) return null;

      const fromRect = fromComponent.element.getBoundingClientRect();
      const toRect = toComponent.element.getBoundingClientRect();

      const startX = fromRect.left + fromRect.width / 2;
      const startY = fromRect.top + fromRect.height / 2;
      const endX = toRect.left + toRect.width / 2;
      const endY = toRect.top + toRect.height / 2;

      return (
        <svg
          key={connection.id}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 99 }}
        >
          <path
            d={`M ${startX} ${startY} C ${startX} ${endY}, ${endX} ${startY}, ${endX} ${endY}`}
            stroke={connection.type === 'event' ? '#3b82f6' : '#10b981'}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    });
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      data-visual-editor="root"
    >
      {/* Shortcuts Panel with more shortcuts */}
      <div 
        className={`fixed left-4 top-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg pointer-events-auto transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        data-visual-editor="shortcuts"
      >
        <div className="flex items-center gap-2 mb-2">
          <Keyboard size="sm" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Shortcuts</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Alt + E</kbd>
            <span>Toggle Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
            <span>Exit Editor / Deselect</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">G</kbd>
            <span>Toggle Grid</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">L</kbd>
            <span>Toggle Library</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Del</kbd>
            <span>Delete Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl + C</kbd>
            <span>Duplicate Selected</span>
          </div>
        </div>
      </div>

      {/* Component Library */}
      <div 
        className={`fixed left-4 top-24 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg pointer-events-auto transition-opacity duration-200 ${isActive && showComponentLibrary ? 'opacity-100' : 'opacity-0'}`}
        data-visual-editor="library"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Components</h3>
          <button
            onClick={() => setShowComponentLibrary(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {componentTemplates.map(template => (
            <button
              key={template.type}
              onClick={() => createComponent(template)}
              className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {template.icon}
              <span>{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Extended Toolbar */}
      <div 
        className={`fixed top-4 right-4 flex items-center space-x-2 pointer-events-auto transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        data-visual-editor="toolbar"
      >
        <Button
          variant="outline"
          onClick={() => setShowComponentLibrary(!showComponentLibrary)}
          icon={<Plus size={16} />}
        >
          Add Component
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowConnections(!showConnections)}
          icon={<Link size={16} />}
        >
          {showConnections ? 'Hide' : 'Show'} Connections
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

      {/* Render connections */}
      {renderConnections()}

      {/* Properties Panel */}
      <div 
        className={`fixed right-4 top-16 w-64 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg pointer-events-auto transition-opacity duration-200 ${isActive && showPropertiesPanel && selectedComponent ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
        data-visual-editor="properties"
        style={{ 
          transition: 'opacity 200ms ease, transform 200ms ease',
          visibility: isActive && showPropertiesPanel && selectedComponent ? 'visible' : 'hidden'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Properties</h3>
          <button
            onClick={() => setSelectedComponent(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        {renderPropertiesPanel()}
      </div>
    </div>
  );
}

export default EnhancedVisualEditor; 