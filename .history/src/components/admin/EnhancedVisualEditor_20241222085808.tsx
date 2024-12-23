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
    const snapToGridValue = (value: number) => {
      return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
    };

    // Update dimensions based on handle position
    switch (activeHandle.position) {
      case 'right':
      case 'bottom-right':
      case 'top-right':
        newWidth = snapToGridValue(resizeStartDimensions.width + deltaX);
        break;
      case 'left':
      case 'bottom-left':
      case 'top-left':
        newWidth = snapToGridValue(resizeStartDimensions.width - deltaX);
        break;
    }

    switch (activeHandle.position) {
      case 'bottom':
      case 'bottom-right':
      case 'bottom-left':
        newHeight = snapToGridValue(resizeStartDimensions.height + deltaY);
        break;
      case 'top':
      case 'top-right':
      case 'top-left':
        newHeight = snapToGridValue(resizeStartDimensions.height - deltaY);
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

  // Handle component duplication
  const handleDuplicate = (component: EditableComponent, position?: { x: number; y: number }) => {
    const newElement = component.element.cloneNode(true) as HTMLElement;
    const offset = position ? 0 : 20; // Use offset only when no position is provided
    
    const rect = component.element.getBoundingClientRect();
    const newLeft = position ? position.x : rect.left + offset;
    const newTop = position ? position.y : rect.top + offset;
    
    Object.assign(newElement.style, {
      position: 'absolute',
      left: `${newLeft}px`,
      top: `${newTop}px`,
      zIndex: `${parseInt(component.element.style.zIndex || '0') + 1}`,
      opacity: '0',
      transform: 'scale(0.95)',
      transition: 'all 0.2s ease-out'
    });

    const newComponent: EditableComponent = {
      id: `component_${Date.now()}`,
      element: newElement,
      originalStyles: { ...component.originalStyles },
      currentStyles: { ...component.currentStyles },
      bounds: newElement.getBoundingClientRect(),
      connections: [],
      events: { ...component.events },
      customFunctions: { ...component.customFunctions },
      eventConnections: [],
      isLocked: false
    };

    document.body.appendChild(newElement);
    setEditableComponents(prev => [...prev, newComponent]);

    // Animate the new component
    requestAnimationFrame(() => {
      newElement.style.opacity = '1';
      newElement.style.transform = 'scale(1)';
    });

    // Select the new component after animation
    setTimeout(() => {
      setSelectedComponent(newComponent);
      saveToHistory();
    }, 200);

    return newComponent;
  };

  // Handle duplicate preview
  const handleDuplicatePreview = (e: MouseEvent) => {
    if (!isDuplicating || !selectedComponent) return;

    const previewPosition = {
      x: e.clientX - selectedComponent.bounds.width / 2,
      y: e.clientY - selectedComponent.bounds.height / 2
    };

    setDuplicatePreview({
      component: selectedComponent,
      position: previewPosition
    });
  };

  // Handle duplicate completion
  const handleDuplicateComplete = (e: MouseEvent) => {
    if (!isDuplicating || !selectedComponent) return;
    
    e.preventDefault();
    e.stopPropagation();

    if (duplicatePreview) {
      handleDuplicate(selectedComponent, duplicatePreview.position);
    }

    setIsDuplicating(false);
    setDuplicatePreview(null);
  };

  // Add duplication keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      // Start duplication with Alt + D
      if (e.altKey && e.key.toLowerCase() === 'd' && selectedComponent) {
        e.preventDefault();
        setIsDuplicating(true);
      }

      // Quick duplicate with Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedComponent) {
        e.preventDefault();
        handleDuplicate(selectedComponent);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsDuplicating(false);
        setDuplicatePreview(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive, selectedComponent, isDuplicating]);

  // Add mouse event listeners for duplication preview
  useEffect(() => {
    if (!isDuplicating) return;

    window.addEventListener('mousemove', handleDuplicatePreview);
    window.addEventListener('click', handleDuplicateComplete);

    return () => {
      window.removeEventListener('mousemove', handleDuplicatePreview);
      window.removeEventListener('click', handleDuplicateComplete);
    };
  }, [isDuplicating, selectedComponent]);

  // Render duplicate preview
  const renderDuplicatePreview = () => {
    if (!duplicatePreview) return null;

    const { component, position } = duplicatePreview;
    const rect = component.element.getBoundingClientRect();

    return (
      <div
        className="pointer-events-none absolute opacity-50 border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/20"
        style={{
          left: position.x,
          top: position.y,
          width: rect.width,
          height: rect.height,
          borderRadius: getComputedStyle(component.element).borderRadius
        }}
      />
    );
  };

  // Add duplicate button to toolbar
  const renderToolbar = () => (
    <div className="fixed top-4 right-4 flex items-center space-x-2 pointer-events-auto">
      {/* ... existing toolbar buttons ... */}
      {selectedComponent && (
        <Button
          variant="outline"
          onClick={() => handleDuplicate(selectedComponent)}
          icon={<Copy size={16} />}
          title="Duplicate Component (Ctrl+D)"
        >
          Duplicate
        </Button>
      )}
    </div>
  );

  return (
    <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-[100]" data-visual-editor="root">
      {/* Modified Toolbar */}
      <div className="fixed top-4 right-4 flex items-center space-x-2 pointer-events-auto">
        {selectedComponent && (
          <Button
            variant="outline"
            onClick={() => {
              const newElement = selectedComponent.element.cloneNode(true) as HTMLElement;
              const rect = selectedComponent.element.getBoundingClientRect();
              const offset = 20;
              
              Object.assign(newElement.style, {
                position: 'absolute',
                left: `${rect.left + offset}px`,
                top: `${rect.top + offset}px`,
                zIndex: `${parseInt(selectedComponent.element.style.zIndex || '0') + 1}`
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

              document.body.appendChild(newElement);
              setEditableComponents(prev => [...prev, newComponent]);
              setSelectedComponent(newComponent);
              saveToHistory();
            }}
            icon={<Copy size={16} />}
            title="Duplicate Component (Ctrl+D)"
          >
            Duplicate
          </Button>
        )}
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
      {renderToolbar()}
      {isDuplicating && renderDuplicatePreview()}
    </div>
  );
}

export default EnhancedVisualEditor; 