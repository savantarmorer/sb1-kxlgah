import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Plus, X } from 'lucide-react';
import Button from '../Button';

interface ExternalLibrary {
  id: string;
  name: string;
  description: string;
  components: ComponentDefinition[];
  version: string;
  isEnabled: boolean;
}

interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  description: string;
  defaultProps: Record<string, any>;
  defaultStyles: Record<string, any>;
  previewImage?: string;
  category: string;
  library: string;
}

interface ComponentLibraryProps {
  onSelectComponent: (component: ComponentDefinition) => void;
  onImportLibrary: (library: ExternalLibrary) => void;
}

export default function ComponentLibrary({ onSelectComponent, onImportLibrary }: ComponentLibraryProps) {
  const [libraries, setLibraries] = useState<ExternalLibrary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Mock data for demonstration
  const mockLibraries: ExternalLibrary[] = [
    {
      id: 'material-ui',
      name: 'Material UI',
      description: 'React components that implement Google\'s Material Design',
      version: '5.0.0',
      isEnabled: true,
      components: [
        {
          id: 'button',
          name: 'Button',
          type: 'component',
          description: 'Material Design button',
          defaultProps: { variant: 'contained', color: 'primary' },
          defaultStyles: {},
          category: 'inputs',
          library: 'material-ui'
        },
        // Add more components...
      ]
    },
    // Add more libraries...
  ];

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    setLibraries(mockLibraries);
  }, []);

  const filteredComponents = libraries
    .filter(lib => lib.isEnabled)
    .flatMap(lib => lib.components)
    .filter(component => 
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'all' || component.category === selectedCategory)
    );

  const categories = Array.from(new Set(
    libraries
      .flatMap(lib => lib.components)
      .map(component => component.category)
  ));

  const handleImportLibrary = (libraryUrl: string) => {
    // In a real implementation, this would fetch the library definition
    // and validate it before adding to the list
    console.log('Importing library from:', libraryUrl);
    setShowImportDialog(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and filters */}
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        
        <div className="mt-4 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Component grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredComponents.map(component => (
            <motion.div
              key={component.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:shadow-md"
              onClick={() => onSelectComponent(component)}
            >
              {component.previewImage ? (
                <img
                  src={component.previewImage}
                  alt={component.name}
                  className="w-full h-24 object-cover rounded-md mb-3"
                />
              ) : (
                <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-md mb-3 flex items-center justify-center">
                  <Package size={32} className="text-gray-400" />
                </div>
              )}
              <h4 className="font-medium">{component.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {component.description}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {component.library}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {component.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Library management */}
      <div className="p-4 border-t">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">External Libraries</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            icon={<Plus size={16} />}
          >
            Import Library
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {libraries.map(library => (
            <div
              key={library.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div>
                <h4 className="font-medium">{library.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  v{library.version}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={library.isEnabled}
                  onChange={() => {
                    setLibraries(libs =>
                      libs.map(lib =>
                        lib.id === library.id
                          ? { ...lib, isEnabled: !lib.isEnabled }
                          : lib
                      )
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Import dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Import Library</h3>
              <button
                onClick={() => setShowImportDialog(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Library URL or Package Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., @material-ui/core or https://..."
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleImportLibrary('example-url')}
                >
                  Import
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 