import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2, Info, Power, Trash2 } from "lucide-react";

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

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (...args) => {
      const [first, second, options] = args;
      if (typeof second === "string") {
        alert(String(first || "Notice"), second, options || {});
      } else {
        alert("Notice", String(first || ""), { intent: "primary" });
      }
    };
    return () => {
      window.alert = nativeAlert;
    };
  }, [alert]);

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
          icon: <Trash2 className="h-5 w-5" />,
          iconClass: "bg-red-50 text-red-600",
          confirmClass: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          iconClass: "bg-amber-50 text-amber-600",
          confirmClass: "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500",
        };
      case "logout":
        return {
          icon: <Power className="h-5 w-5" />,
          iconClass: "bg-blue-50 text-blue-700",
          confirmClass: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          iconClass: "bg-emerald-50 text-emerald-600",
          confirmClass: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          iconClass: "bg-blue-50 text-blue-700",
          confirmClass: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        };
    }
  };

  const config = getIntentConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/35 p-4 backdrop-blur-md"
      onClick={() => onClose(false)}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] overflow-hidden rounded-[24px] border border-black/5 bg-[var(--canvas-lifted)] text-[var(--ink)] shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onClose(false)}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[var(--slate)] transition hover:bg-black/[0.04] hover:text-[var(--ink)]"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4 pr-8">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}>
              {config.icon}
            </div>
            <div className="min-w-0">
              <h3 id="app-dialog-title" className="text-lg font-semibold leading-7 tracking-[-0.02em] text-[var(--ink)]">
                {title}
              </h3>
              {message ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--slate)]">
                  {message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {type === "confirm" && (
              <button
                type="button"
                onClick={() => onClose(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:bg-black/[0.04] focus:outline-none"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={() => onClose(true)}
              className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition focus:outline-none ${config.confirmClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
