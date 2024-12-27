import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Link2, Settings, X } from 'lucide-react';
import Button from '../Button';

interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'state' | 'mock';
  config: Record<string, any>;
}

interface DataBinding {
  id: string;
  sourceId: string;
  targetId: string;
  path: string;
  transform?: string;
}

interface DataBindingManagerProps {
  dataSources: DataSource[];
  bindings: DataBinding[];
  onAddDataSource: (source: DataSource) => void;
  onUpdateDataSource: (id: string, source: Partial<DataSource>) => void;
  onRemoveDataSource: (id: string) => void;
  onAddBinding: (binding: DataBinding) => void;
  onUpdateBinding: (id: string, binding: Partial<DataBinding>) => void;
  onRemoveBinding: (id: string) => void;
}

export default function DataBindingManager({
  dataSources,
  bindings,
  onAddDataSource,
  onUpdateDataSource,
  onRemoveDataSource,
  onAddBinding,
  onUpdateBinding,
  onRemoveBinding
}: DataBindingManagerProps) {
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false);
  const [showAddBindingDialog, setShowAddBindingDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [selectedBinding, setSelectedBinding] = useState<DataBinding | null>(null);

  const handleAddDataSource = (source: DataSource) => {
    onAddDataSource(source);
    setShowAddSourceDialog(false);
  };

  const handleAddBinding = (binding: DataBinding) => {
    onAddBinding(binding);
    setShowAddBindingDialog(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Data Sources */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Data Sources</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddSourceDialog(true)}
            icon={<Database size={16} />}
          >
            Add Source
          </Button>
        </div>
        <div className="space-y-2">
          {dataSources.map(source => (
            <div
              key={source.id}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md cursor-pointer"
              onClick={() => setSelectedSource(source)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{source.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {source.type}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDataSource(source.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bindings */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Data Bindings</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddBindingDialog(true)}
            icon={<Link2 size={16} />}
          >
            Add Binding
          </Button>
        </div>
        <div className="space-y-2">
          {bindings.map(binding => (
            <div
              key={binding.id}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md cursor-pointer"
              onClick={() => setSelectedBinding(binding)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {dataSources.find(s => s.id === binding.sourceId)?.name}
                    </span>
                    <Link2 size={16} className="text-gray-400" />
                    <span className="font-medium">
                      {binding.targetId}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Path: {binding.path}
                  </p>
                  {binding.transform && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Transform: {binding.transform}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBinding(binding.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Data Source Dialog */}
      {showAddSourceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Data Source</h3>
              <button
                onClick={() => setShowAddSourceDialog(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                  <option value="api">API</option>
                  <option value="state">State</option>
                  <option value="mock">Mock Data</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Configuration</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter JSON configuration..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddSourceDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleAddDataSource({
                      id: `source_${Date.now()}`,
                      name: 'New Source',
                      type: 'api',
                      config: {}
                    });
                  }}
                >
                  Add Source
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Binding Dialog */}
      {showAddBindingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Data Binding</h3>
              <button
                onClick={() => setShowAddBindingDialog(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                  {dataSources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Component</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Component ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Path</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="e.g., data.items[0].name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transform (Optional)</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter transform function..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddBindingDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleAddBinding({
                      id: `binding_${Date.now()}`,
                      sourceId: dataSources[0]?.id || '',
                      targetId: '',
                      path: ''
                    });
                  }}
                >
                  Add Binding
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Source Configuration Dialog */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Configure Data Source</h3>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={selectedSource.name}
                  onChange={(e) => {
                    onUpdateDataSource(selectedSource.id, { name: e.target.value });
                  }}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Configuration</label>
                <textarea
                  rows={4}
                  value={JSON.stringify(selectedSource.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      onUpdateDataSource(selectedSource.id, { config });
                    } catch (error) {
                      // Handle invalid JSON
                    }
                  }}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 font-mono"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSource(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 