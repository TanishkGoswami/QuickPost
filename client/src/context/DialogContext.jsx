import React, { createContext, useContext, useState, useCallback } from "react";

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
        intent: options.intent || "danger", // danger, warning, primary
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
      {dialog && <CustomDialog {...dialog} onClose={handleClose} />}
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
import { X, AlertTriangle, Info, LogOut, Trash2 } from "lucide-react";

function CustomDialog({
  type,
  title,
  message,
  confirmText,
  cancelText,
  intent,
  onClose,
}) {
  const getIntentIcon = () => {
    switch (intent) {
      case "danger":
        return <Trash2 className="w-10 h-10 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-10 h-10 text-yellow-500" />;
      case "logout":
        return <LogOut className="w-10 h-10 text-blue-500" />;
      default:
        return <Info className="w-10 h-10 text-blue-500" />;
    }
  };

  const getButtonClass = () => {
    switch (intent) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl">{getIntentIcon()}</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="text-gray-500 mt-1">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {type === "confirm" && (
              <button
                onClick={() => onClose(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => onClose(true)}
              className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md active:scale-[0.98] ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
