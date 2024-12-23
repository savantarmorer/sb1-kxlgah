import React, { useState, useRef, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Code, Plus, Save, Play, X, Settings, Layout, Eye, EyeOff, Grid as GridIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import Button from '../Button';

interface ComponentBlock {
  id: string;
  type: 'container' | 'component' | 'layout';
  name: string;
  props: Record<string, any>;
  children: string[];
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  styles: Record<string, any>;
  events?: Record<string, string>;
  dataBindings?: Record<string, string>;
  parentId?: string;
}

interface HistoryState {
  components: ComponentBlock[];
  selectedComponent: string | null;
}

export default function EnhancedVisualEditor() {
  const [components, setComponents] = useState<ComponentBlock[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(8);
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  const [theme, setTheme] = useState('light');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Extended component library with more UI elements
  const availableComponents = [
    {
      type: 'container',
      name: 'Container',
      defaultProps: { className: 'p-4' },
      defaultDimensions: { width: 300, height: 200 }
    },
    {
      type: 'component',
      name: 'Button',
      defaultProps: { variant: 'primary', label: 'Button' },
      defaultDimensions: { width: 100, height: 40 }
    },
    {
      type: 'component',
      name: 'Input',
      defaultProps: { type: 'text', placeholder: 'Enter text...' },
      defaultDimensions: { width: 200, height: 40 }
    },
    {
      type: 'layout',
      name: 'Grid',
      defaultProps: { columns: 2, gap: 16 },
      defaultDimensions: { width: 400, height: 300 }
    },
    {
      type: 'layout',
      name: 'Flex',
      defaultProps: { direction: 'row', gap: 16 },
      defaultDimensions: { width: 400, height: 100 }
    }
  ];

  // Save current state to undo stack
  const saveToHistory = () => {
    setUndoStack(prev => [...prev, { components, selectedComponent }]);
    setRedoStack([]);
  };

  // Undo last action
  const undo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { components, selectedComponent }]);
    setComponents(lastState.components);
    setSelectedComponent(lastState.selectedComponent);
    setUndoStack(prev => prev.slice(0, -1));
  };

  // Redo last undone action
  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { components, selectedComponent }]);
    setComponents(nextState.components);
    setSelectedComponent(nextState.selectedComponent);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const addComponent = (type: 'container' | 'component' | 'layout', position?: { x: number; y: number }) => {
    const componentType = availableComponents.find(c => c.type === type);
    if (!componentType) return;

    const newComponent: ComponentBlock = {
      id: `component_${Date.now()}`,
      type: componentType.type,
      name: componentType.name,
      props: componentType.defaultProps,
      children: [],
      position: position || { x: 100, y: 100 },
      dimensions: componentType.defaultDimensions,
      styles: {},
      events: {},
      dataBindings: {}
    };

    saveToHistory();
    setComponents([...components, newComponent]);
  };

  const updateComponentPosition = (id: string, position: { x: number; y: number }) => {
    if (snapToGrid) {
      position.x = Math.round(position.x / gridSize) * gridSize;
      position.y = Math.round(position.y / gridSize) * gridSize;
    }

    saveToHistory();
    setComponents(components.map(component =>
      component.id === id ? { ...component, position } : component
    ));
  };

  const updateComponentDimensions = (id: string, dimensions: { width: number; height: number }) => {
    if (snapToGrid) {
      dimensions.width = Math.round(dimensions.width / gridSize) * gridSize;
      dimensions.height = Math.round(dimensions.height / gridSize) * gridSize;
    }

    saveToHistory();
    setComponents(components.map(component =>
      component.id === id ? { ...component, dimensions } : component
    ));
  };

  const updateComponentStyles = (id: string, styles: Record<string, any>) => {
    saveToHistory();
    setComponents(components.map(component =>
      component.id === id ? { ...component, styles: { ...component.styles, ...styles } } : component
    ));
  };

  const updateComponentProps = (id: string, props: Record<string, any>) => {
    saveToHistory();
    setComponents(components.map(component =>
      component.id === id ? { ...component, props: { ...component.props, ...props } } : component
    ));
  };

  const updateComponentEvents = (id: string, events: Record<string, string>) => {
    saveToHistory();
    setComponents(components.map(component =>
      component.id === id ? { ...component, events: { ...component.events, ...events } } : component
    ));
  };

  const updateComponentDataBindings = (id: string, dataBindings: Record<string, string>) => {
    saveToHistory();
    setComponents(components.map(component =>
      component.id === id ? { ...component, dataBindings: { ...component.dataBindings, ...dataBindings } } : component
    ));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType') as 'container' | 'component' | 'layout';
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const position = {
        x: (e.clientX - rect.left) / zoomLevel,
        y: (e.clientY - rect.top) / zoomLevel
      };
      addComponent(componentType, position);
    }
  };

  const exportLayout = () => {
    const layout = {
      components,
      theme,
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLayout = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layout = JSON.parse(e.target?.result as string);
        setComponents(layout.components);
        setTheme(layout.theme);
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    reader.readAsText(file);
  };

  const generateCode = () => {
    // Generate React JSX code from the layout
    const generateComponentJSX = (component: ComponentBlock): string => {
      const props = Object.entries(component.props)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      
      const style = Object.entries(component.styles)
        .map(([key, value]) => `${key}: "${value}"`)
        .join(', ');

      return `<${component.name} ${props} style={{ ${style} }} />`;
    };

    const code = components.map(generateComponentJSX).join('\n');
    return code;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-50">
        <div className="flex items-center space-x-4 overflow-x-auto">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            icon={previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
          >
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowGrid(!showGrid)}
            icon={<GridIcon size={16} />}
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            {snapToGrid ? 'Disable Snap' : 'Enable Snap'}
          </Button>
          <Button
            variant="outline"
            onClick={undo}
            disabled={undoStack.length === 0}
          >
            Undo
          </Button>
          <Button
            variant="outline"
            onClick={redo}
            disabled={redoStack.length === 0}
          >
            Redo
          </Button>
          <Button
            variant="outline"
            onClick={exportLayout}
            icon={<Save size={16} />}
          >
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-layout')?.click()}
          >
            Import
          </Button>
          <input
            id="import-layout"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importLayout(e.target.files[0])}
          />
          <Button
            variant="outline"
            onClick={() => {
              const code = generateCode();
              navigator.clipboard.writeText(code);
            }}
            icon={<Code size={16} />}
          >
            Copy Code
          </Button>
        </div>
      </div>

      <div className="flex flex-1 h-[calc(100vh-4rem)]">
        {/* Component Library */}
        {showComponentLibrary && (
          <div className="w-64 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Components</h3>
            <div className="space-y-2">
              {availableComponents.map(component => (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('componentType', component.type);
                  }}
                  className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow cursor-move hover:shadow-md transition-shadow duration-200"
                >
                  {component.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto bg-gray-50 dark:bg-gray-800"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            backgroundImage: showGrid ? `
              linear-gradient(to right, rgba(156, 163, 175, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(156, 163, 175, 0.1) 1px, transparent 1px)
            ` : 'none',
            backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto',
            transform: `scale(${zoomLevel})`,
            transformOrigin: '0 0'
          }}
        >
          {components.map(component => (
            <motion.div
              key={component.id}
              drag={!previewMode}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                updateComponentPosition(component.id, {
                  x: component.position.x + info.offset.x,
                  y: component.position.y + info.offset.y
                });
              }}
              className={`absolute ${selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: component.position.x,
                top: component.position.y,
                width: component.dimensions.width,
                height: component.dimensions.height,
                ...component.styles
              }}
              onClick={() => setSelectedComponent(component.id)}
            >
              {/* Component content */}
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg">
                {component.name}
              </div>
              
              {/* Resize handles */}
              {!previewMode && selectedComponent === component.id && (
                <>
                  <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
                    onMouseDown={(e) => {
                      // Implement resize logic
                    }}
                  />
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && selectedComponent && (
          <div className="w-64 bg-gray-50 dark:bg-gray-800 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Properties</h3>
            <div className="space-y-4">
              {/* Basic properties */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={components.find(c => c.id === selectedComponent)?.name || ''}
                  onChange={(e) => {
                    const component = components.find(c => c.id === selectedComponent);
                    if (component) {
                      updateComponentProps(component.id, { name: e.target.value });
                    }
                  }}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Styles */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Styles</label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={components.find(c => c.id === selectedComponent)?.styles.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      const component = components.find(c => c.id === selectedComponent);
                      if (component) {
                        updateComponentStyles(component.id, { backgroundColor: e.target.value });
                      }
                    }}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600"
                  />
                  <select
                    value={components.find(c => c.id === selectedComponent)?.styles.borderStyle || 'none'}
                    onChange={(e) => {
                      const component = components.find(c => c.id === selectedComponent);
                      if (component) {
                        updateComponentStyles(component.id, { borderStyle: e.target.value });
                      }
                    }}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="none">No Border</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>

              {/* Events */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Events</label>
                <select
                  value={Object.keys(components.find(c => c.id === selectedComponent)?.events || {})[0] || ''}
                  onChange={(e) => {
                    const component = components.find(c => c.id === selectedComponent);
                    if (component) {
                      updateComponentEvents(component.id, { [e.target.value]: '' });
                    }
                  }}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select Event</option>
                  <option value="onClick">Click</option>
                  <option value="onHover">Hover</option>
                  <option value="onFocus">Focus</option>
                </select>
              </div>

              {/* Data Bindings */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data Binding</label>
                <input
                  type="text"
                  placeholder="data.property"
                  value={Object.values(components.find(c => c.id === selectedComponent)?.dataBindings || {})[0] || ''}
                  onChange={(e) => {
                    const component = components.find(c => c.id === selectedComponent);
                    if (component) {
                      updateComponentDataBindings(component.id, { value: e.target.value });
                    }
                  }}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 