import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  is_open: boolean;
  on_close: () => void;
  title?: string;
  max_width?: string;
}

export const Modal = ({ is_open, on_close, title, children, max_width = 'max-w-lg' }: ModalProps) => {
  return (
    <AnimatePresence>
      {is_open && (
        <div className="modal-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={on_close}
          />

          {/* Modal Dialog */}
          <div className="modal-dialog">
            <div className="modal-content-wrapper">
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`modal-content ${max_width}`}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                  <button
                    onClick={on_close}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="modal-body">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}