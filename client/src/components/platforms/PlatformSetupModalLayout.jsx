import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function PlatformSetupModalLayout({
  isOpen,
  onClose,
  title,
  icon, // can be a lucide icon component or an image src
  iconBgColor = 'bg-gray-100',
  iconColor = 'text-gray-900',
  children,
  footer
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm ${iconBgColor} ${iconColor}`}>
                {typeof icon === 'string' ? (
                  <img src={icon} alt={title} className="w-6 h-6 object-contain" />
                ) : (
                  icon
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-white border-t border-gray-100 shrink-0">
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
