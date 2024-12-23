import React, { useState, useRef, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Code, Save, Eye, EyeOff, Grid as GridIcon, Settings, X, Keyboard, Plus, Link, Layers, Move, Play, Zap, Undo2, Redo2, Search, Command, Sun, Moon, RotateCw, AlignLeft, AlignCenter, AlignRight, AlignJustify, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Group, Ungroup, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown, List } from 'lucide-react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useVisualEditor } from '../../contexts/VisualEditorContext';
import { toast } from 'react-toastify';
import { Editor } from '@monaco-editor/react';

interface EditableComponent {
  id: string;
  element: HTMLElement;
  originalStyles: Partial<CSSStyleDeclaration>;
  currentStyles: Partial<CSSStyleDeclaration>;
  bounds: DOMRect;
  connections: string[];
  events: { [key: string]: Function }; // Event name -> function
  customFunctions: { [key: string]: string }; // Function name -> code
  eventConnections: Array<{
    event: string;
    targetId: string;
    functionName: string;
  }>;
  isLocked: boolean;
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

interface SnapGuide {
  position: number;
  type: 'horizontal' | 'vertical';
  strength: number;
}

interface HistoryState {
  components: EditableComponent[];
  connections: Connection[];
  timestamp: number;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'component' | 'action' | 'style' | 'function';
}

interface ResizeHandle {
  position: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  cursor: string;
}

interface AlignmentAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: (components: EditableComponent[]) => void;
}

interface ComponentGroup {
  id: string;
  name: string;
  components: EditableComponent[];
  bounds: DOMRect;
}

const EXAMPLE_FUNCTIONS = {
  toggleVisibility: `// Toggle element visibility
element.style.display = element.style.display === 'none' ? 'block' : 'none';`,

  updateText: `// Update element text content
const newText = prompt('Enter new text:');
if (newText) {
  setValue(newText);
}`,

  toggleTheme: `// Toggle between light and dark theme
const isDark = element.classList.contains('dark');
if (isDark) {
  element.classList.remove('dark', 'bg-gray-800', 'text-white');
  element.classList.add('light', 'bg-white', 'text-gray-800');
} else {
  element.classList.remove('light', 'bg-white', 'text-gray-800');
  element.classList.add('dark', 'bg-gray-800', 'text-white');
}`,

  counter: `// Simple counter with state
const count = getState('count') || 0;
setState('count', count + 1);
setValue(\`Count: \${count + 1}\`);`,

  fetchData: `// Fetch data from an API
async function getData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    setValue(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
getData();`,

  animation: `// Add a simple animation
element.style.transition = 'all 0.3s ease';
element.style.transform = 'scale(1.1)';
setTimeout(() => {
  element.style.transform = 'scale(1)';
}, 300);`,

  formValidation: `// Basic form validation
if (element.tagName === 'FORM') {
  event.preventDefault();
  const inputs = element.querySelectorAll('input');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value) {
      isValid = false;
      input.style.borderColor = 'red';
    } else {
      input.style.borderColor = '';
    }
  });
  
  if (isValid) {
    alert('Form is valid!');
  }
}`,

  dataBinding: `// Two-way data binding example
if (event.type === 'input') {
  const targets = document.querySelectorAll('[data-bind="' + element.id + '"]');
  targets.forEach(target => {
    target.textContent = getValue();
  });
}`,

  responsiveDesign: `// Toggle responsive classes
const sizes = ['sm', 'md', 'lg', 'xl'];
const currentSize = sizes.find(size => element.classList.contains(size)) || 'md';
const currentIndex = sizes.indexOf(currentSize);
const nextSize = sizes[(currentIndex + 1) % sizes.length];

sizes.forEach(size => element.classList.remove(size));
element.classList.add(nextSize);
setValue(\`Size: \${nextSize}\`);`,
};

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
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [currentFunctionName, setCurrentFunctionName] = useState('');
  const [isConnectingEvent, setIsConnectingEvent] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    componentId: string;
    event: string;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [snapThreshold] = useState(5); // pixels
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [lastSavedState, setLastSavedState] = useState<string>('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 });
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [selectedComponents, setSelectedComponents] = useState<EditableComponent[]>([]);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [groups, setGroups] = useState<ComponentGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ComponentGroup | null>(null);
  const [lockedComponents, setLockedComponents] = useState<Set<string>>(new Set());
  const [maxZIndex, setMaxZIndex] = useState(1000);
  const [showComponentSearch, setShowComponentSearch] = useState(false);
  const [componentSearchQuery, setComponentSearchQuery] = useState('');
  const [highlightedComponents, setHighlightedComponents] = useState<EditableComponent[]>([]);

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

  // Export current state - Move this before quickActions
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

  // Define quick actions - Now exportState is defined before being used
  const quickActions: QuickAction[] = [
    // Component Actions
    ...componentTemplates.map(template => ({
      id: `component-${template.type}`,
      name: `Add ${template.name}`,
      description: `Create a new ${template.name.toLowerCase()} component`,
      icon: template.icon,
      action: () => createComponent(template),
      category: 'component' as const
    })),

    // Editor Actions
    {
      id: 'toggle-grid',
      name: 'Toggle Grid',
      description: 'Show or hide the alignment grid',
      icon: <GridIcon size={16} />,
      shortcut: 'G',
      action: () => setShowGrid(!showGrid),
      category: 'action'
    },
    {
      id: 'toggle-snap',
      name: 'Toggle Snap to Grid',
      description: 'Enable or disable grid snapping',
      icon: <Move size={16} />,
      action: () => setSnapToGrid(!snapToGrid),
      category: 'action'
    },
    {
      id: 'export-state',
      name: 'Export Layout',
      description: 'Save the current layout to a file',
      icon: <Save size={16} />,
      action: exportState,
      category: 'action'
    },

    // Style Actions
    {
      id: 'apply-theme-light',
      name: 'Apply Light Theme',
      description: 'Set light theme styles to selected component',
      icon: <Sun size={16} />,
      action: () => {
        if (!selectedComponent) return;
        updateComponentStyles({
          backgroundColor: '#ffffff',
          color: '#1f2937'
        });
      },
      category: 'style'
    },
    {
      id: 'apply-theme-dark',
      name: 'Apply Dark Theme',
      description: 'Set dark theme styles to selected component',
      icon: <Moon size={16} />,
      action: () => {
        if (!selectedComponent) return;
        updateComponentStyles({
          backgroundColor: '#1f2937',
          color: '#ffffff'
        });
      },
      category: 'style'
    },

    // Function Actions
    ...Object.entries(EXAMPLE_FUNCTIONS).map(([name, code]) => ({
      id: `function-${name}`,
      name: `Add ${name} Function`,
      description: `Add the ${name} function to selected component`,
      icon: <Code size={16} />,
      action: () => {
        if (!selectedComponent) return;
        addFunction(selectedComponent, name, code);
      },
      category: 'function' as const
    }))
  ];

  // Filter actions based on search query
  const filteredActions = quickActions.filter(action => {
    const search = searchQuery.toLowerCase();
    return (
      action.name.toLowerCase().includes(search) ||
      action.description.toLowerCase().includes(search) ||
      action.category.toLowerCase().includes(search)
    );
  });

  // Handle command palette keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showCommandPalette) {
        // Open command palette with Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setShowCommandPalette(true);
          setSearchQuery('');
          setSelectedActionIndex(0);
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedActionIndex(i => 
            i < filteredActions.length - 1 ? i + 1 : i
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedActionIndex(i => i > 0 ? i - 1 : i);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedActionIndex]) {
            filteredActions[selectedActionIndex].action();
            setShowCommandPalette(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowCommandPalette(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, selectedActionIndex, filteredActions]);

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
          customFunctions: { ...selectedComponent.customFunctions },
          eventConnections: [],
          isLocked: false
        };

        setEditableComponents(prev => [...prev, newComponent]);
        document.body.appendChild(newElement);
        setSelectedComponent(newComponent);
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedComponent, currentHistoryIndex, history]);

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
          customFunctions: {},
          eventConnections: [],
          isLocked: false
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
    if (component && !lockedComponents.has(component.id)) {
      if (isMultiSelecting) {
        setSelectedComponents(prev => {
          const isSelected = prev.some(c => c.id === component.id);
          if (isSelected) {
            return prev.filter(c => c.id !== component.id);
          } else {
            return [...prev, component];
          }
        });
      } else {
        setSelectedComponents([component]);
        setSelectedComponent(component);
      }
      element.style.outline = '2px solid rgb(59, 130, 246)';
    }
  };

  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('click', handleComponentClick, true);
    return () => document.removeEventListener('click', handleComponentClick, true);
  }, [isActive, editableComponents]);

  // Update component styles
  const updateComponentStyles = (
    styles: Partial<CSSStyleDeclaration>,
    component: EditableComponent = selectedComponent!
  ) => {
    if (!component) return;

    const updatedStyles = { ...component.currentStyles, ...styles };
    Object.assign(component.element.style, styles);

    setEditableComponents(components =>
      components.map(c =>
        c.id === component.id
          ? { ...c, currentStyles: updatedStyles }
          : c
      )
    );

    // Save state to history after a short delay to batch rapid changes
    debounce(() => saveToHistory(), 500);
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

  const findSnapGuides = (currentRect: DOMRect): SnapGuide[] => {
    if (!snapToGrid) return [];
    
    const guides: SnapGuide[] = [];
    const positions = new Set<number>();

    editableComponents.forEach(other => {
      if (other.element === selectedComponent?.element) return;
      
      const otherRect = other.element.getBoundingClientRect();
      
      // Vertical alignments
      const verticalAlignments = [
        { pos: otherRect.left, strength: 1 },
        { pos: otherRect.right, strength: 1 },
        { pos: otherRect.left + otherRect.width / 2, strength: 2 }
      ];

      verticalAlignments.forEach(({ pos, strength }) => {
        const distances = [
          { point: currentRect.left, offset: 0 },
          { point: currentRect.right, offset: currentRect.width },
          { point: currentRect.left + currentRect.width / 2, offset: currentRect.width / 2 }
        ];

        distances.forEach(({ point, offset }) => {
          const distance = Math.abs(point - pos);
          if (distance < snapThreshold && !positions.has(pos)) {
            guides.push({
              position: pos,
              type: 'vertical',
              strength
            });
            positions.add(pos);
          }
        });
      });

      // Horizontal alignments
      const horizontalAlignments = [
        { pos: otherRect.top, strength: 1 },
        { pos: otherRect.bottom, strength: 1 },
        { pos: otherRect.top + otherRect.height / 2, strength: 2 }
      ];

      horizontalAlignments.forEach(({ pos, strength }) => {
        const distances = [
          { point: currentRect.top, offset: 0 },
          { point: currentRect.bottom, offset: currentRect.height },
          { point: currentRect.top + currentRect.height / 2, offset: currentRect.height / 2 }
        ];

        distances.forEach(({ point, offset }) => {
          const distance = Math.abs(point - pos);
          if (distance < snapThreshold && !positions.has(pos)) {
            guides.push({
              position: pos,
              type: 'horizontal',
              strength
            });
            positions.add(pos);
          }
        });
      });
    });

    return guides;
  };

  const handleDrag = (e: React.PointerEvent, component: EditableComponent) => {
    if (!isDragging) return;
    
    const rect = component.element.getBoundingClientRect();
    let x = e.clientX - dragOffset.x;
    let y = e.clientY - dragOffset.y;
    
    // Find snap guides
    const guides = findSnapGuides(new DOMRect(x, y, rect.width, rect.height));
    setSnapGuides(guides);
    
    // Apply snapping
    guides.forEach(guide => {
      if (guide.type === 'vertical') {
        const distance = Math.abs(x - guide.position);
        if (distance < snapThreshold) {
          x = guide.position;
        }
      } else {
        const distance = Math.abs(y - guide.position);
        if (distance < snapThreshold) {
          y = guide.position;
        }
      }
    });
    
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
    setSnapGuides([]);
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
      customFunctions: {},
      eventConnections: [],
      isLocked: false
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

  // Common event types for different elements
  const getAvailableEvents = (element: HTMLElement) => {
    const commonEvents = ['click', 'mouseenter', 'mouseleave'];
    const tagSpecificEvents: { [key: string]: string[] } = {
      'input': ['change', 'input', 'focus', 'blur'],
      'select': ['change', 'focus', 'blur'],
      'button': ['click', 'mouseenter', 'mouseleave'],
      'form': ['submit', 'reset']
    };

    const tagName = element.tagName.toLowerCase();
    return [...commonEvents, ...(tagSpecificEvents[tagName] || [])];
  };

  // Add function to component
  const addFunction = (component: EditableComponent, name: string, code: string) => {
    try {
      // Create a safe function context with common utilities
      const functionBody = `
        const element = document.getElementById('${component.element.id}');
        const getValue = () => element.value || element.textContent;
        const setValue = (val) => {
          if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
            element.value = val;
          } else {
            element.textContent = val;
          }
        };
        const toggleClass = (className) => element.classList.toggle(className);
        const setState = (key, value) => {
          element.dataset[key] = JSON.stringify(value);
        };
        const getState = (key) => {
          try {
            return JSON.parse(element.dataset[key]);
          } catch {
            return element.dataset[key];
          }
        };
        ${code}
      `;

      const handler = new Function('event', functionBody);
      
      setEditableComponents(prev => prev.map(c => {
        if (c.id === component.id) {
          return {
            ...c,
            customFunctions: { 
              ...c.customFunctions, 
              [name]: code 
            }
          };
        }
        return c;
      }));

      toast.success(`Function "${name}" added successfully`);
      return handler;
    } catch (error) {
      console.error('Failed to create function:', error);
      toast.error('Failed to create function. Check the console for details.');
      return null;
    }
  };

  // Connect event to function
  const connectEventToFunction = (
    sourceComponent: EditableComponent,
    targetComponent: EditableComponent,
    eventName: string,
    functionName: string
  ) => {
    const handler = targetComponent.customFunctions[functionName];
    if (!handler) return;

    sourceComponent.element.addEventListener(eventName, (event) => {
      try {
        new Function('event', handler)(event);
      } catch (error) {
        console.error('Error executing event handler:', error);
      }
    });

    setEditableComponents(prev => prev.map(c => {
      if (c.id === sourceComponent.id) {
        return {
          ...c,
          eventConnections: [
            ...c.eventConnections,
            { event: eventName, targetId: targetComponent.id, functionName }
          ]
        };
      }
      return c;
    }));

    // Add visual connection
    createConnection(sourceComponent, targetComponent, 'event');
  };

  // Function to load example code
  const loadExampleFunction = (name: string, code: string) => {
    setCurrentFunctionName(name);
    setCurrentCode(code);
  };

  // Render code editor with examples
  const renderCodeEditor = () => {
    if (!showCodeEditor) return null;

    return (
      <div 
        className="fixed right-72 top-16 w-[600px] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg pointer-events-auto"
        data-visual-editor="code-editor"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Function Editor</h3>
          <button
            onClick={() => setShowCodeEditor(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4">
          {/* Examples Panel */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
              Example Functions
            </h4>
            {Object.entries(EXAMPLE_FUNCTIONS).map(([name, code]) => (
              <button
                key={name}
                onClick={() => loadExampleFunction(name, code)}
                className="w-full text-left p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {name}
              </button>
            ))}
          </div>

          {/* Editor Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Function Name
              </label>
              <input
                type="text"
                value={currentFunctionName}
                onChange={(e) => setCurrentFunctionName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="myFunction"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Code
              </label>
              <div className="h-[400px] border rounded-lg overflow-hidden">
                <Editor
                  language="javascript"
                  theme="vs-dark"
                  value={currentCode}
                  onChange={(value: string | undefined) => setCurrentCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentCode('');
                  setCurrentFunctionName('');
                  setShowCodeEditor(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!selectedComponent || !currentFunctionName || !currentCode) return;
                  addFunction(selectedComponent, currentFunctionName, currentCode);
                  setShowCodeEditor(false);
                }}
                icon={<Play size={16} />}
              >
                Save Function
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add event connection UI to properties panel
  const renderEventConnections = () => {
    if (!selectedComponent) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Events & Functions
          </label>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentCode('');
                setCurrentFunctionName('');
                setShowCodeEditor(true);
              }}
              icon={<Code size={14} />}
            >
              New Function
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConnectingEvent(!isConnectingEvent)}
              icon={<Link size={14} />}
            >
              {isConnectingEvent ? 'Cancel Connection' : 'Connect Event'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {getAvailableEvents(selectedComponent.element).map(eventName => (
            <div
              key={eventName}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <span className="text-sm">{eventName}</span>
              {isConnectingEvent ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConnectionStart({
                      componentId: selectedComponent.id,
                      event: eventName
                    });
                    toast.info('Now click another component to connect the event');
                  }}
                  icon={<Zap size={14} />}
                >
                  Select Source
                </Button>
              ) : (
                <div className="text-xs text-gray-500">
                  {selectedComponent.eventConnections.filter(c => c.event === eventName).length} connections
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Extend properties panel with event connections
  const extendedPropertiesPanel = () => {
    return (
      <>
        {renderPropertiesPanel()}
        {renderEventConnections()}
      </>
    );
  };

  // Add guide rendering after the grid overlay
  const renderSnapGuides = () => {
    return snapGuides.map((guide, index) => (
      <div
        key={`${guide.type}-${guide.position}-${index}`}
        className={`absolute pointer-events-none ${
          guide.type === 'vertical' ? 'h-screen w-px' : 'w-screen h-px'
        }`}
        style={{
          backgroundColor: `rgba(59, 130, 246, ${0.5 + (guide.strength * 0.25)})`,
          [guide.type === 'vertical' ? 'left' : 'top']: `${guide.position}px`,
          zIndex: 9999
        }}
      />
    ));
  };

  // Add history management functions
  const saveToHistory = () => {
    const newState: HistoryState = {
      components: editableComponents,
      connections,
      timestamp: Date.now()
    };

    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(newState);

    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);

    // Update last saved state
    setLastSavedState(JSON.stringify(newState));
  };

  const undo = () => {
    if (currentHistoryIndex <= 0) return;
    
    const previousState = history[currentHistoryIndex - 1];
    setEditableComponents(previousState.components);
    setConnections(previousState.connections);
    setCurrentHistoryIndex(currentHistoryIndex - 1);
  };

  const redo = () => {
    if (currentHistoryIndex >= history.length - 1) return;
    
    const nextState = history[currentHistoryIndex + 1];
    setEditableComponents(nextState.components);
    setConnections(nextState.connections);
    setCurrentHistoryIndex(currentHistoryIndex + 1);
  };

  // Add debounce utility
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Define resize handles
  const resizeHandles: ResizeHandle[] = [
    { position: 'top', cursor: 'ns-resize' },
    { position: 'right', cursor: 'ew-resize' },
    { position: 'bottom', cursor: 'ns-resize' },
    { position: 'left', cursor: 'ew-resize' },
    { position: 'top-left', cursor: 'nw-resize' },
    { position: 'top-right', cursor: 'ne-resize' },
    { position: 'bottom-left', cursor: 'sw-resize' },
    { position: 'bottom-right', cursor: 'se-resize' }
  ];

  // Handle resize start
  const handleResizeStart = (e: React.PointerEvent, handle: ResizeHandle) => {
    if (!selectedComponent) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    
    const rect = selectedComponent.element.getBoundingClientRect();
    setResizeStartPosition({ x: e.clientX, y: e.clientY });
    setResizeStartDimensions({
      width: rect.width,
      height: rect.height
    });
    
    document.body.style.cursor = handle.cursor;
  };

  // Handle resize move
  const handleResizeMove = (e: PointerEvent) => {
    if (!isResizing || !selectedComponent || !activeHandle) return;

    const deltaX = e.clientX - resizeStartPosition.x;
    const deltaY = e.clientY - resizeStartPosition.y;
    
    let newWidth = resizeStartDimensions.width;
    let newHeight = resizeStartDimensions.height;
    
    // Apply grid snapping if enabled
    const snapToGrid = (value: number) => {
      return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
    };

    // Update dimensions based on handle position
    switch (activeHandle.position) {
      case 'right':
      case 'bottom-right':
      case 'top-right':
        newWidth = snapToGrid(resizeStartDimensions.width + deltaX);
        break;
      case 'left':
      case 'bottom-left':
      case 'top-left':
        newWidth = snapToGrid(resizeStartDimensions.width - deltaX);
        break;
    }

    switch (activeHandle.position) {
      case 'bottom':
      case 'bottom-right':
      case 'bottom-left':
        newHeight = snapToGrid(resizeStartDimensions.height + deltaY);
        break;
      case 'top':
      case 'top-right':
      case 'top-left':
        newHeight = snapToGrid(resizeStartDimensions.height - deltaY);
        break;
    }

    // Ensure minimum dimensions
    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);

    // Update component styles
    updateComponentStyles({
      width: `${newWidth}px`,
      height: `${newHeight}px`
    });
  };

  // Handle resize end
  const handleResizeEnd = () => {
    if (!isResizing) return;
    
    setIsResizing(false);
    setActiveHandle(null);
    document.body.style.cursor = '';
    
    // Save state to history
    saveToHistory();
  };

  // Add resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('pointermove', handleResizeMove);
      window.addEventListener('pointerup', handleResizeEnd);
      
      return () => {
        window.removeEventListener('pointermove', handleResizeMove);
        window.removeEventListener('pointerup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStartPosition, resizeStartDimensions, activeHandle]);

  // Render resize handles for selected component
  const renderResizeHandles = () => {
    if (!selectedComponent || isDragging) return null;

    const handleSize = 8;
    const handleOffset = -handleSize / 2;

    return resizeHandles.map(handle => {
      let style: React.CSSProperties = {
        position: 'absolute',
        width: handleSize,
        height: handleSize,
        backgroundColor: 'rgb(59, 130, 246)',
        border: '2px solid white',
        borderRadius: '50%',
        cursor: handle.cursor,
        zIndex: 9999,
      };

      // Position handle
      switch (handle.position) {
        case 'top':
          style = {
            ...style,
            top: handleOffset,
            left: '50%',
            transform: 'translateX(-50%)',
          };
          break;
        case 'right':
          style = {
            ...style,
            top: '50%',
            right: handleOffset,
            transform: 'translateY(-50%)',
          };
          break;
        case 'bottom':
          style = {
            ...style,
            bottom: handleOffset,
            left: '50%',
            transform: 'translateX(-50%)',
          };
          break;
        case 'left':
          style = {
            ...style,
            top: '50%',
            left: handleOffset,
            transform: 'translateY(-50%)',
          };
          break;
        case 'top-left':
          style = {
            ...style,
            top: handleOffset,
            left: handleOffset,
          };
          break;
        case 'top-right':
          style = {
            ...style,
            top: handleOffset,
            right: handleOffset,
          };
          break;
        case 'bottom-left':
          style = {
            ...style,
            bottom: handleOffset,
            left: handleOffset,
          };
          break;
        case 'bottom-right':
          style = {
            ...style,
            bottom: handleOffset,
            right: handleOffset,
          };
          break;
      }

      return (
        <div
          key={handle.position}
          style={style}
          onPointerDown={(e) => handleResizeStart(e, handle)}
          className="shadow-sm hover:scale-125 transition-transform"
        />
      );
    });
  };

  // Add resize handles to selected component
  useEffect(() => {
    if (!selectedComponent) return;

    const element = selectedComponent.element;
    if (element.style.position !== 'absolute') {
      element.style.position = 'absolute';
    }

    // Create resize handle container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.dataset.visualEditor = 'resize-handles';
    
    element.appendChild(container);

    return () => {
      element.removeChild(container);
    };
  }, [selectedComponent]);

  // Calculate angle between points
  const calculateAngle = (center: { x: number; y: number }, point: { x: number; y: number }) => {
    return Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
  };

  // Handle rotation start
  const handleRotationStart = (e: React.PointerEvent) => {
    if (!selectedComponent) return;
    
    e.stopPropagation();
    setIsRotating(true);
    
    const rect = selectedComponent.element.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    setRotationCenter(center);
    setRotationStartAngle(
      calculateAngle(center, { x: e.clientX, y: e.clientY }) -
      (parseFloat(selectedComponent.element.style.transform?.match(/rotate\(([-\d.]+)deg\)/)?.[1] || '0'))
    );
  };

  // Handle rotation move
  const handleRotationMove = (e: PointerEvent) => {
    if (!isRotating || !selectedComponent) return;

    const currentAngle = calculateAngle(rotationCenter, { x: e.clientX, y: e.clientY });
    let rotation = currentAngle - rotationStartAngle;

    // Snap to 15-degree increments if grid snapping is enabled
    if (snapToGrid) {
      rotation = Math.round(rotation / 15) * 15;
    }

    // Update component transform
    const transform = selectedComponent.element.style.transform || '';
    const newTransform = transform.replace(/rotate\([^)]*\)|$/, `rotate(${rotation}deg)`);
    
    updateComponentStyles({
      transform: newTransform
    });
  };

  // Handle rotation end
  const handleRotationEnd = () => {
    if (!isRotating) return;
    
    setIsRotating(false);
    
    // Save state to history
    saveToHistory();
  };

  // Add rotation event listeners
  useEffect(() => {
    if (isRotating) {
      window.addEventListener('pointermove', handleRotationMove);
      window.addEventListener('pointerup', handleRotationEnd);
      
      return () => {
        window.removeEventListener('pointermove', handleRotationMove);
        window.removeEventListener('pointerup', handleRotationEnd);
      };
    }
  }, [isRotating, rotationStartAngle, rotationCenter]);

  // Render rotation handle
  const renderRotationHandle = () => {
    if (!selectedComponent || isDragging) return null;

    const handleSize = 24;
    const handleOffset = -40;

    return (
      <div
        style={{
          position: 'absolute',
          top: handleOffset,
          left: '50%',
          width: handleSize,
          height: handleSize,
          transform: 'translateX(-50%)',
          cursor: 'grab',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgb(59, 130, 246)',
          border: '2px solid white',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease',
        }}
        onPointerDown={handleRotationStart}
        className="hover:scale-110"
      >
        <RotateCw size={14} className="text-white" />
      </div>
    );
  };

  // Add rotation handle to selected component
  useEffect(() => {
    if (!selectedComponent) return;

    const element = selectedComponent.element;
    if (!element.style.transformOrigin) {
      element.style.transformOrigin = 'center center';
    }
  }, [selectedComponent]);

  // Define alignment actions
  const alignmentActions: AlignmentAction[] = [
    {
      id: 'align-left',
      name: 'Align Left',
      icon: <AlignLeft size={16} />,
      action: (components) => {
        if (components.length < 2) return;
        
        const leftmost = Math.min(...components.map(c => 
          c.element.getBoundingClientRect().left
        ));
        
        components.forEach(component => {
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            left: `${leftmost}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'align-center',
      name: 'Align Center',
      icon: <AlignCenter size={16} />,
      action: (components) => {
        if (components.length < 2) return;
        
        const bounds = components.map(c => c.element.getBoundingClientRect());
        const containerLeft = Math.min(...bounds.map(b => b.left));
        const containerRight = Math.max(...bounds.map(b => b.right));
        const containerCenter = containerLeft + (containerRight - containerLeft) / 2;
        
        components.forEach(component => {
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            left: `${containerCenter - rect.width / 2}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'align-right',
      name: 'Align Right',
      icon: <AlignRight size={16} />,
      action: (components) => {
        if (components.length < 2) return;
        
        const rightmost = Math.max(...components.map(c => 
          c.element.getBoundingClientRect().right
        ));
        
        components.forEach(component => {
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            left: `${rightmost - rect.width}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'distribute-horizontal',
      name: 'Distribute Horizontally',
      icon: <AlignHorizontalJustifyCenter size={16} />,
      action: (components) => {
        if (components.length < 3) return;
        
        const sorted = [...components].sort((a, b) => 
          a.element.getBoundingClientRect().left - b.element.getBoundingClientRect().left
        );
        
        const first = sorted[0].element.getBoundingClientRect();
        const last = sorted[sorted.length - 1].element.getBoundingClientRect();
        const totalSpace = last.right - first.left;
        const spacing = totalSpace / (sorted.length - 1);
        
        sorted.forEach((component, index) => {
          if (index === 0 || index === sorted.length - 1) return;
          
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            left: `${first.left + spacing * index - rect.width / 2}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'align-top',
      name: 'Align Top',
      icon: <AlignJustify size={16} className="rotate-90" />,
      action: (components) => {
        if (components.length < 2) return;
        
        const topmost = Math.min(...components.map(c => 
          c.element.getBoundingClientRect().top
        ));
        
        components.forEach(component => {
          updateComponentStyles({
            top: `${topmost}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'align-middle',
      name: 'Align Middle',
      icon: <AlignVerticalJustifyCenter size={16} />,
      action: (components) => {
        if (components.length < 2) return;
        
        const bounds = components.map(c => c.element.getBoundingClientRect());
        const containerTop = Math.min(...bounds.map(b => b.top));
        const containerBottom = Math.max(...bounds.map(b => b.bottom));
        const containerMiddle = containerTop + (containerBottom - containerTop) / 2;
        
        components.forEach(component => {
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            top: `${containerMiddle - rect.height / 2}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'align-bottom',
      name: 'Align Bottom',
      icon: <AlignJustify size={16} className="-rotate-90" />,
      action: (components) => {
        if (components.length < 2) return;
        
        const bottommost = Math.max(...components.map(c => 
          c.element.getBoundingClientRect().bottom
        ));
        
        components.forEach(component => {
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            top: `${bottommost - rect.height}px`
          }, component);
        });
        
        saveToHistory();
      }
    },
    {
      id: 'distribute-vertical',
      name: 'Distribute Vertically',
      icon: <AlignVerticalJustifyCenter size={16} className="rotate-90" />,
      action: (components) => {
        if (components.length < 3) return;
        
        const sorted = [...components].sort((a, b) => 
          a.element.getBoundingClientRect().top - b.element.getBoundingClientRect().top
        );
        
        const first = sorted[0].element.getBoundingClientRect();
        const last = sorted[sorted.length - 1].element.getBoundingClientRect();
        const totalSpace = last.bottom - first.top;
        const spacing = totalSpace / (sorted.length - 1);
        
        sorted.forEach((component, index) => {
          if (index === 0 || index === sorted.length - 1) return;
          
          const rect = component.element.getBoundingClientRect();
          updateComponentStyles({
            top: `${first.top + spacing * index - rect.height / 2}px`
          }, component);
        });
        
        saveToHistory();
      }
    }
  ];

  // Add alignment toolbar
  const renderAlignmentToolbar = () => {
    if (selectedComponents.length < 2) return null;

    return (
      <div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center space-x-1 pointer-events-auto"
        data-visual-editor="alignment-toolbar"
      >
        {alignmentActions.map(action => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => action.action(selectedComponents)}
            icon={action.icon}
            title={action.name}
          />
        ))}
      </div>
    );
  };

  // Create group from selected components
  const createGroup = () => {
    if (selectedComponents.length < 2) return;

    // Calculate group bounds
    const bounds = selectedComponents.reduce((acc, component) => {
      const rect = component.element.getBoundingClientRect();
      return {
        left: Math.min(acc.left, rect.left),
        top: Math.min(acc.top, rect.top),
        right: Math.max(acc.right, rect.right),
        bottom: Math.max(acc.bottom, rect.bottom)
      };
    }, {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity
    });

    const group: ComponentGroup = {
      id: `group_${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      components: selectedComponents,
      bounds: new DOMRect(
        bounds.left,
        bounds.top,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top
      )
    };

    setGroups(prev => [...prev, group]);
    setActiveGroup(group);

    // Create group container
    const container = document.createElement('div');
    container.id = group.id;
    container.style.position = 'absolute';
    container.style.left = `${bounds.left}px`;
    container.style.top = `${bounds.top}px`;
    container.style.width = `${bounds.right - bounds.left}px`;
    container.style.height = `${bounds.bottom - bounds.top}px`;
    container.style.border = '1px dashed rgb(59, 130, 246)';
    container.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    container.style.pointerEvents = 'none';
    container.dataset.visualEditor = 'group';

    document.body.appendChild(container);

    // Update component positions relative to group
    selectedComponents.forEach(component => {
      const rect = component.element.getBoundingClientRect();
      updateComponentStyles({
        position: 'absolute',
        left: `${rect.left - bounds.left}px`,
        top: `${rect.top - bounds.top}px`
      }, component);
    });

    saveToHistory();
  };

  // Ungroup components
  const ungroup = (group: ComponentGroup) => {
    // Remove group container
    const container = document.getElementById(group.id);
    if (container) {
      document.body.removeChild(container);
    }

    // Reset component positions to absolute coordinates
    group.components.forEach(component => {
      const rect = component.element.getBoundingClientRect();
      updateComponentStyles({
        position: 'absolute',
        left: `${rect.left}px`,
        top: `${rect.top}px`
      }, component);
    });

    setGroups(prev => prev.filter(g => g.id !== group.id));
    setActiveGroup(null);
    saveToHistory();
  };

  // Move group and its components
  const moveGroup = (group: ComponentGroup, deltaX: number, deltaY: number) => {
    const container = document.getElementById(group.id);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newLeft = rect.left + deltaX;
    const newTop = rect.top + deltaY;

    // Move group container
    container.style.left = `${newLeft}px`;
    container.style.top = `${newTop}px`;

    // Move all components in the group
    group.components.forEach(component => {
      const componentRect = component.element.getBoundingClientRect();
      updateComponentStyles({
        left: `${componentRect.left + deltaX}px`,
        top: `${componentRect.top + deltaY}px`
      }, component);
    });
  };

  // Add group controls to toolbar
  const renderGroupControls = () => {
    if (!isActive) return null;

    return (
      <div className="fixed bottom-4 right-4 flex items-center space-x-2 pointer-events-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={createGroup}
          disabled={selectedComponents.length < 2}
          icon={<Group size={16} />}
          title="Group Components"
        >
          Group
        </Button>
        {activeGroup && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => ungroup(activeGroup)}
            icon={<Ungroup size={16} />}
            title="Ungroup Components"
          >
            Ungroup
          </Button>
        )}
      </div>
    );
  };

  // Update group bounds when components move
  useEffect(() => {
    if (!activeGroup) return;

    const updateGroupBounds = () => {
      const bounds = activeGroup.components.reduce((acc, component) => {
        const rect = component.element.getBoundingClientRect();
        return {
          left: Math.min(acc.left, rect.left),
          top: Math.min(acc.top, rect.top),
          right: Math.max(acc.right, rect.right),
          bottom: Math.max(acc.bottom, rect.bottom)
        };
      }, {
        left: Infinity,
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity
      });

      const container = document.getElementById(activeGroup.id);
      if (container) {
        container.style.left = `${bounds.left}px`;
        container.style.top = `${bounds.top}px`;
        container.style.width = `${bounds.right - bounds.left}px`;
        container.style.height = `${bounds.bottom - bounds.top}px`;
      }
    };

    const observer = new MutationObserver(updateGroupBounds);
    activeGroup.components.forEach(component => {
      observer.observe(component.element, {
        attributes: true,
        attributeFilter: ['style']
      });
    });

    return () => observer.disconnect();
  }, [activeGroup]);

  // Toggle component lock
  const toggleComponentLock = (component: EditableComponent) => {
    const newLockedComponents = new Set(lockedComponents);
    
    if (newLockedComponents.has(component.id)) {
      newLockedComponents.delete(component.id);
      component.element.style.pointerEvents = '';
      component.isLocked = false;
    } else {
      newLockedComponents.add(component.id);
      component.element.style.pointerEvents = 'none';
      component.isLocked = true;
    }
    
    setLockedComponents(newLockedComponents);
    saveToHistory();
  };

  // Add lock indicator to components
  const renderLockIndicator = (component: EditableComponent) => {
    if (!component.isLocked) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgb(239, 68, 68)',
          borderRadius: '50%',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        <Lock size={12} />
      </div>
    );
  };

  // Add lock controls to properties panel
  const renderLockControls = () => {
    if (!selectedComponent) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Component Lock
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleComponentLock(selectedComponent)}
            icon={selectedComponent.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          >
            {selectedComponent.isLocked ? 'Unlock' : 'Lock'}
          </Button>
        </div>
        {selectedComponent.isLocked && (
          <p className="mt-2 text-xs text-red-500">
            This component is locked and cannot be edited
          </p>
        )}
      </div>
    );
  };

  // Z-index control functions
  const bringToFront = (component: EditableComponent) => {
    const newZIndex = maxZIndex + 1;
    updateComponentStyles({
      zIndex: `${newZIndex}`
    }, component);
    setMaxZIndex(newZIndex);
  };

  const sendToBack = (component: EditableComponent) => {
    const minZIndex = Math.min(
      ...editableComponents.map(c => 
        parseInt(c.element.style.zIndex || '0')
      ).filter(z => !isNaN(z))
    );
    
    updateComponentStyles({
      zIndex: `${minZIndex - 1}`
    }, component);
  };

  const moveForward = (component: EditableComponent) => {
    const currentZ = parseInt(component.element.style.zIndex || '0');
    const nextZ = Math.min(
      ...editableComponents
        .map(c => parseInt(c.element.style.zIndex || '0'))
        .filter(z => !isNaN(z) && z > currentZ)
    );
    
    if (nextZ === Infinity) {
      bringToFront(component);
    } else {
      updateComponentStyles({
        zIndex: `${nextZ + 1}`
      }, component);
    }
  };

  const moveBackward = (component: EditableComponent) => {
    const currentZ = parseInt(component.element.style.zIndex || '0');
    const prevZ = Math.max(
      ...editableComponents
        .map(c => parseInt(c.element.style.zIndex || '0'))
        .filter(z => !isNaN(z) && z < currentZ)
    );
    
    if (prevZ === -Infinity) {
      sendToBack(component);
    } else {
      updateComponentStyles({
        zIndex: `${prevZ - 1}`
      }, component);
    }
  };

  // Add z-index controls to properties panel
  const renderZIndexControls = () => {
    if (!selectedComponent) return null;

    const currentZ = parseInt(selectedComponent.element.style.zIndex || '0');

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Layer Position
          </span>
          <span className="text-sm text-gray-500">
            z-index: {currentZ}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => bringToFront(selectedComponent)}
            icon={<ArrowUpToLine size={14} />}
            title="Bring to Front"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveForward(selectedComponent)}
            icon={<ArrowUp size={14} />}
            title="Move Forward"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveBackward(selectedComponent)}
            icon={<ArrowDown size={14} />}
            title="Move Backward"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendToBack(selectedComponent)}
            icon={<ArrowDownToLine size={14} />}
            title="Send to Back"
          />
        </div>
      </div>
    );
  };

  // Initialize components with z-index
  useEffect(() => {
    if (!isActive) return;

    const elements = document.querySelectorAll('button, div, input, select, h1, h2, h3, p, span, a');
    const components: EditableComponent[] = Array.from(elements)
      .filter(element => {
        const isEditorElement = element.closest('[data-visual-editor]') !== null;
        const rect = element.getBoundingClientRect();
        const hasDimensions = rect.width > 0 && rect.height > 0;
        return !isEditorElement && hasDimensions;
      })
      .map((element, index) => {
        const bounds = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        const zIndex = parseInt(styles.zIndex) || index + 1;
        setMaxZIndex(prev => Math.max(prev, zIndex));
        
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
          zIndex: styles.zIndex,
        };

        // Set initial z-index
        (element as HTMLElement).style.zIndex = zIndex.toString();

        return {
          id: `component_${index}`,
          element: element as HTMLElement,
          originalStyles,
          currentStyles: { ...originalStyles },
          bounds,
          connections: [],
          events: {},
          customFunctions: {},
          eventConnections: [],
          isLocked: false
        };
      });

    setEditableComponents(components);
  }, [isActive]);

  // Search components
  const searchComponents = (query: string) => {
    if (!query.trim()) {
      setHighlightedComponents([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ');
    const matches = editableComponents.filter(component => {
      const element = component.element;
      const text = element.textContent?.toLowerCase() || '';
      const tagName = element.tagName.toLowerCase();
      const className = element.className?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';

      return searchTerms.every(term =>
        text.includes(term) ||
        tagName.includes(term) ||
        className.includes(term) ||
        id.includes(term)
      );
    });

    setHighlightedComponents(matches);
  };

  // Handle search input
  useEffect(() => {
    searchComponents(componentSearchQuery);
  }, [componentSearchQuery]);

  // Highlight matched components
  useEffect(() => {
    editableComponents.forEach(component => {
      const isHighlighted = highlightedComponents.includes(component);
      const element = component.element;
      
      if (isHighlighted) {
        element.style.outline = '2px solid rgb(234, 179, 8)';
        element.style.outlineOffset = '2px';
      } else if (!selectedComponent || element !== selectedComponent.element) {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }
    });

    return () => {
      editableComponents.forEach(component => {
        if (!selectedComponent || component.element !== selectedComponent.element) {
          component.element.style.outline = '';
          component.element.style.outlineOffset = '';
        }
      });
    };
  }, [highlightedComponents]);

  // Render component search panel
  const renderComponentSearch = () => {
    if (!showComponentSearch) return null;

    return (
      <div 
        className="fixed left-4 top-24 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden pointer-events-auto"
        data-visual-editor="component-search"
      >
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center space-x-2">
            <List size={20} className="text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
              value={componentSearchQuery}
              onChange={(e) => setComponentSearchQuery(e.target.value)}
              placeholder="Search components..."
                  className="w-full bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                <kbd className="hidden sm:block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded">
                  ESC
                </kbd>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
          {highlightedComponents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
              {componentSearchQuery
                ? 'No components found'
                : 'Type to search components'}
                </div>
              ) : (
                <div className="py-2">
              {highlightedComponents.map((component) => {
                const element = component.element;
                const text = element.textContent || '';
                const tagName = element.tagName.toLowerCase();
                const className = element.className || '';
                const id = element.id || '';

                return (
                    <button
                    key={component.id}
                    className="w-full px-4 py-2 flex items-start space-x-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      onClick={() => {
                      setSelectedComponent(component);
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 mt-1">
                      <List size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tagName}
                          </span>
                        {id && (
                          <span className="text-xs text-gray-500">
                            #{id}
                          </span>
                          )}
                        </div>
                      {className && (
                        <p className="text-xs text-gray-500 truncate">
                          {className}
                        </p>
                      )}
                      {text && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                          {text}
                        </p>
                      )}
                      </div>
                    </button>
                );
              })}
                </div>
              )}
            </div>
          </div>
    );
  };

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd/Ctrl + F
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowComponentSearch(true);
        setComponentSearchQuery('');
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }

      // Close search with Escape
      if (e.key === 'Escape' && showComponentSearch) {
        e.preventDefault();
        setShowComponentSearch(false);
        setComponentSearchQuery('');
        setHighlightedComponents([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showComponentSearch]);

  // Add search button to toolbar
  return (
    <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-[100]" data-visual-editor="root">
      {/* Modified Toolbar */}
      <div className="fixed top-4 right-4 flex items-center space-x-2 pointer-events-auto">
        <Button
          variant="outline"
          onClick={() => {
            setShowComponentSearch(true);
            setTimeout(() => searchInputRef.current?.focus(), 0);
          }}
          icon={<List size={16} />}
          title="Search Components (Ctrl+F)"
        >
          Search
        </Button>
        
        {/* ... existing toolbar buttons ... */}
      </div>

      {/* Add component search panel */}
      {renderComponentSearch()}
      
      {/* ... rest of the component ... */}
    </div>
  );
}

export default EnhancedVisualEditor; 