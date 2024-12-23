import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Code, Plus, Save, Play, X, Settings, Layout, Eye, EyeOff } from 'lucide-react';
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
}

export default function EnhancedVisualEditor() {
  const [components, setComponents] = useState<ComponentBlock[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
    // Add more component types
  ];

  const addComponent = (type: string) => {
    const componentType = availableComponents.find(c => c.type === type);
    if (!componentType) return;

    const newComponent: ComponentBlock = {
      id: `component_${Date.now()}`,
      type: componentType.type,
      name: componentType.name,
      props: componentType.defaultProps,
      children: [],
      position: { x: 100, y: 100 },
      dimensions: componentType.defaultDimensions,
      styles: {}
    };

    setComponents([...components, newComponent]);
  };

  const updateComponentPosition = (id: string, position: { x: number; y: number }) => {
    setComponents(components.map(component =>
      component.id === id ? { ...component, position } : component
    ));
  };

  const updateComponentDimensions = (id: string, dimensions: { width: number; height: number }) => {
    setComponents(components.map(component =>
      component.id === id ? { ...component, dimensions } : component
    ));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      addComponent(componentType);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            icon={previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
          >
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Save layout configuration
              localStorage.setItem('layoutConfig', JSON.stringify(components));
            }}
            icon={<Save size={16} />}
          >
            Save Layout
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Component Palette */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 border-r">
          <h3 className="font-medium mb-4">Components</h3>
          <div className="space-y-2">
            {availableComponents.map(component => (
              <div
                key={component.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('componentType', component.type);
                }}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow cursor-move hover:shadow-md"
              >
                {component.name}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
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
              className="absolute"
              style={{
                left: component.position.x,
                top: component.position.y,
                width: component.dimensions.width,
                height: component.dimensions.height
              }}
            >
              {/* Component content */}
            </motion.div>
          ))}
        </div>

        {/* Properties Panel */}
        {selectedComponent && (
          <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 border-l">
            <h3 className="font-medium mb-4">Properties</h3>
            {/* Add property controls */}
          </div>
        )}
      </div>
    </div>
  );
} 
