import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ComponentBlock } from '../components/admin/EnhancedVisualEditor';
import { DataSource, DataBinding } from '../components/admin/DataBindingManager';

interface EditorState {
  components: ComponentBlock[];
  selectedComponent: string | null;
  dataSources: DataSource[];
  dataBindings: DataBinding[];
  undoStack: HistoryState[];
  redoStack: HistoryState[];
  theme: string;
  gridSettings: {
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
  previewMode: boolean;
  zoomLevel: number;
}

interface HistoryState {
  components: ComponentBlock[];
  selectedComponent: string | null;
}

type Action =
  | { type: 'ADD_COMPONENT'; component: ComponentBlock }
  | { type: 'UPDATE_COMPONENT'; id: string; updates: Partial<ComponentBlock> }
  | { type: 'REMOVE_COMPONENT'; id: string }
  | { type: 'SELECT_COMPONENT'; id: string | null }
  | { type: 'ADD_DATA_SOURCE'; source: DataSource }
  | { type: 'UPDATE_DATA_SOURCE'; id: string; updates: Partial<DataSource> }
  | { type: 'REMOVE_DATA_SOURCE'; id: string }
  | { type: 'ADD_DATA_BINDING'; binding: DataBinding }
  | { type: 'UPDATE_DATA_BINDING'; id: string; updates: Partial<DataBinding> }
  | { type: 'REMOVE_DATA_BINDING'; id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'UPDATE_GRID_SETTINGS'; settings: Partial<EditorState['gridSettings']> }
  | { type: 'SET_PREVIEW_MODE'; enabled: boolean }
  | { type: 'SET_ZOOM_LEVEL'; level: number };

const initialState: EditorState = {
  components: [],
  selectedComponent: null,
  dataSources: [],
  dataBindings: [],
  undoStack: [],
  redoStack: [],
  theme: 'light',
  gridSettings: {
    showGrid: true,
    snapToGrid: true,
    gridSize: 8
  },
  previewMode: false,
  zoomLevel: 1
};

const VisualEditorContext = createContext<{
  state: EditorState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null
});

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'ADD_COMPONENT':
      return {
        ...state,
        components: [...state.components, action.component],
        undoStack: [...state.undoStack, { components: state.components, selectedComponent: state.selectedComponent }],
        redoStack: []
      };

    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: state.components.map(component =>
          component.id === action.id
            ? { ...component, ...action.updates }
            : component
        ),
        undoStack: [...state.undoStack, { components: state.components, selectedComponent: state.selectedComponent }],
        redoStack: []
      };

    case 'REMOVE_COMPONENT':
      return {
        ...state,
        components: state.components.filter(component => component.id !== action.id),
        selectedComponent: state.selectedComponent === action.id ? null : state.selectedComponent,
        undoStack: [...state.undoStack, { components: state.components, selectedComponent: state.selectedComponent }],
        redoStack: []
      };

    case 'SELECT_COMPONENT':
      return {
        ...state,
        selectedComponent: action.id
      };

    case 'ADD_DATA_SOURCE':
      return {
        ...state,
        dataSources: [...state.dataSources, action.source]
      };

    case 'UPDATE_DATA_SOURCE':
      return {
        ...state,
        dataSources: state.dataSources.map(source =>
          source.id === action.id
            ? { ...source, ...action.updates }
            : source
        )
      };

    case 'REMOVE_DATA_SOURCE':
      return {
        ...state,
        dataSources: state.dataSources.filter(source => source.id !== action.id),
        dataBindings: state.dataBindings.filter(binding => binding.sourceId !== action.id)
      };

    case 'ADD_DATA_BINDING':
      return {
        ...state,
        dataBindings: [...state.dataBindings, action.binding]
      };

    case 'UPDATE_DATA_BINDING':
      return {
        ...state,
        dataBindings: state.dataBindings.map(binding =>
          binding.id === action.id
            ? { ...binding, ...action.updates }
            : binding
        )
      };

    case 'REMOVE_DATA_BINDING':
      return {
        ...state,
        dataBindings: state.dataBindings.filter(binding => binding.id !== action.id)
      };

    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const lastState = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        components: lastState.components,
        selectedComponent: lastState.selectedComponent,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, { components: state.components, selectedComponent: state.selectedComponent }]
      };

    case 'REDO':
      if (state.redoStack.length === 0) return state;
      const nextState = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        components: nextState.components,
        selectedComponent: nextState.selectedComponent,
        undoStack: [...state.undoStack, { components: state.components, selectedComponent: state.selectedComponent }],
        redoStack: state.redoStack.slice(0, -1)
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.theme
      };

    case 'UPDATE_GRID_SETTINGS':
      return {
        ...state,
        gridSettings: {
          ...state.gridSettings,
          ...action.settings
        }
      };

    case 'SET_PREVIEW_MODE':
      return {
        ...state,
        previewMode: action.enabled
      };

    case 'SET_ZOOM_LEVEL':
      return {
        ...state,
        zoomLevel: action.level
      };

    default:
      return state;
  }
}

export function VisualEditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <VisualEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </VisualEditorContext.Provider>
  );
}

export function useVisualEditor() {
  const context = useContext(VisualEditorContext);
  if (!context) {
    throw new Error('useVisualEditor must be used within a VisualEditorProvider');
  }
  return context;
}

// Helper hooks for common operations
export function useEditorComponents() {
  const { state, dispatch } = useVisualEditor();

  const addComponent = useCallback((component: ComponentBlock) => {
    dispatch({ type: 'ADD_COMPONENT', component });
  }, [dispatch]);

  const updateComponent = useCallback((id: string, updates: Partial<ComponentBlock>) => {
    dispatch({ type: 'UPDATE_COMPONENT', id, updates });
  }, [dispatch]);

  const removeComponent = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', id });
  }, [dispatch]);

  const selectComponent = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_COMPONENT', id });
  }, [dispatch]);

  return {
    components: state.components,
    selectedComponent: state.selectedComponent,
    addComponent,
    updateComponent,
    removeComponent,
    selectComponent
  };
}

export function useEditorDataSources() {
  const { state, dispatch } = useVisualEditor();

  const addDataSource = useCallback((source: DataSource) => {
    dispatch({ type: 'ADD_DATA_SOURCE', source });
  }, [dispatch]);

  const updateDataSource = useCallback((id: string, updates: Partial<DataSource>) => {
    dispatch({ type: 'UPDATE_DATA_SOURCE', id, updates });
  }, [dispatch]);

  const removeDataSource = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DATA_SOURCE', id });
  }, [dispatch]);

  return {
    dataSources: state.dataSources,
    addDataSource,
    updateDataSource,
    removeDataSource
  };
}

export function useEditorDataBindings() {
  const { state, dispatch } = useVisualEditor();

  const addDataBinding = useCallback((binding: DataBinding) => {
    dispatch({ type: 'ADD_DATA_BINDING', binding });
  }, [dispatch]);

  const updateDataBinding = useCallback((id: string, updates: Partial<DataBinding>) => {
    dispatch({ type: 'UPDATE_DATA_BINDING', id, updates });
  }, [dispatch]);

  const removeDataBinding = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DATA_BINDING', id });
  }, [dispatch]);

  return {
    dataBindings: state.dataBindings,
    addDataBinding,
    updateDataBinding,
    removeDataBinding
  };
}

export function useEditorHistory() {
  const { state, dispatch } = useVisualEditor();

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  return {
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    undo,
    redo
  };
}

export function useEditorSettings() {
  const { state, dispatch } = useVisualEditor();

  const setTheme = useCallback((theme: string) => {
    dispatch({ type: 'SET_THEME', theme });
  }, [dispatch]);

  const updateGridSettings = useCallback((settings: Partial<EditorState['gridSettings']>) => {
    dispatch({ type: 'UPDATE_GRID_SETTINGS', settings });
  }, [dispatch]);

  const setPreviewMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_PREVIEW_MODE', enabled });
  }, [dispatch]);

  const setZoomLevel = useCallback((level: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', level });
  }, [dispatch]);

  return {
    theme: state.theme,
    gridSettings: state.gridSettings,
    previewMode: state.previewMode,
    zoomLevel: state.zoomLevel,
    setTheme,
    updateGridSettings,
    setPreviewMode,
    setZoomLevel
  };
} 