import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Info, Power, Trash2 } from "lucide-react";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const showDialog = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        resolve,
      });
    });
  }, []);

  const confirm = useCallback(
    (title, message, options = {}) => {
      return showDialog({
        type: "confirm",
        title,
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        intent: options.intent || "danger", // danger, warning, primary, logout
        ...options,
      });
    },
    [showDialog],
  );

  const alert = useCallback(
    (title, message, options = {}) => {
      return showDialog({
        type: "alert",
        title,
        message,
        confirmText: options.confirmText || "OK",
        intent: options.intent || "primary",
        ...options,
      });
    },
    [showDialog],
  );

  const handleClose = useCallback(
    (value) => {
      if (dialog?.resolve) {
        dialog.resolve(value);
      }
      setDialog(null);
    },
    [dialog],
  );

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <AnimatePresence>
        {dialog && <CustomDialog key="custom-dialog" {...dialog} onClose={handleClose} />}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

// Internal visual component
function CustomDialog({
  type,
  title,
  message,
  confirmText,
  cancelText,
  intent,
  onClose,
}) {
  const getIntentConfig = () => {
    switch (intent) {
      case "danger":
        return {
          icon: <Trash2 size={24} className="text-[#dc2626]" />,
          iconBg: "bg-[#dc2626]/10",
          buttonBg: "bg-[#dc2626] hover:bg-[#b91c1c] shadow-[0_8px_24px_rgba(220,38,38,0.25)]",
          buttonStyle: {},
          ringColor: "focus:ring-red-500",
          accentColor: "bg-[#dc2626]"
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} className="text-[#d97706]" />,
          iconBg: "bg-[#d97706]/10",
          buttonBg: "bg-[#d97706] hover:bg-[#b45309] shadow-[0_8px_24px_rgba(217,119,6,0.25)]",
          buttonStyle: {},
          ringColor: "focus:ring-amber-500",
          accentColor: "bg-[#d97706]"
        };
      case "logout":
        return {
          icon: <Power size={24} className="text-[#f37338]" />,
          iconBg: "bg-[#f37338]/10",
          buttonBg: "bg-[#141413] hover:bg-[#1a1a18]",
          buttonStyle: {
            background: "linear-gradient(135deg, #141413 0%, #2d2d2b 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
          },
          ringColor: "focus:ring-[#f37338]",
          accentColor: "bg-[#f37338]"
        };
      default:
        return {
          icon: <Info size={24} className="text-[#141413]" />,
          iconBg: "bg-[#141413]/5",
          buttonBg: "bg-[#141413] hover:bg-[#2d2d2b] shadow-[0_8px_24px_rgba(20,20,19,0.2)]",
          buttonStyle: {},
          ringColor: "focus:ring-[#141413]",
          accentColor: "bg-[#141413]"
        };
    }
  };

  const config = getIntentConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-[#141413]/55 backdrop-blur-[8px]"
      onClick={() => onClose(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-white rounded-[32px] w-full max-w-[400px] overflow-hidden relative border border-[#141413]/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f37338]/20 to-transparent" />
        
        {/* Orbital Decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#f37338]/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#f37338]/8 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={() => onClose(false)}
          className="absolute top-6 right-6 p-2.5 text-[#696969]/60 hover:text-[#141413] hover:bg-[#141413]/5 rounded-full transition-all z-10"
        >
          <X size={18} />
        </button>

        <div className="px-6 py-10 pt-12">
          <div className="flex flex-col items-center text-center">
            {/* Icon Container */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              className={`w-16 h-16 flex items-center justify-center ${config.iconBg} rounded-[22px] mb-8 relative`}
            >
              {config.icon}
              {/* Subtle orbital ring */}
              <div className="absolute inset-0 border border-[#f37338]/20 rounded-[22px] scale-110" />
            </motion.div>

            <h3 className="text-[24px] font-[800] text-[#141413] mb-3 leading-tight tracking-tight font-display">
              {title}
            </h3>
            <p className="text-[#696969] font-[500] leading-relaxed text-[15px]">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-10">
            {type === "confirm" && (
              <button
                onClick={() => onClose(false)}
                className="flex-1 py-4 px-2 bg-[#f4f3f1] text-[#696969] font-[700] rounded-[20px] hover:bg-[#e9e7e2] hover:text-[#141413] transition-all border-none text-[13px] whitespace-nowrap"
              >
                {cancelText}
              </button>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClose(true)}
              style={config.buttonStyle}
              className={`flex-1 py-4 px-2 text-white font-[700] rounded-[20px] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${config.buttonBg} ${config.ringColor} tracking-tight text-[13px] whitespace-nowrap overflow-hidden relative group shadow-lg`}
            >
              <span className="relative z-10">{confirmText}</span>
              
              {/* Intent-specific effects */}
              {intent === "logout" && (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#f37338]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              
              {/* Subtle glass overlay for buttons with custom background styles */}
              {config.buttonStyle.background && (
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Brand Accent */}
        <div className={`h-1.5 w-1/3 mx-auto rounded-t-full ${config.accentColor} opacity-20`} />
      </motion.div>
    </motion.div>
  );
}
