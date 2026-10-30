import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4.2 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4200);

    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title) => addToast('success', message, title),
    error: (message, title) => addToast('error', message, title),
    info: (message, title) => addToast('info', message, title),
    warning: (message, title) => addToast('warning', message, title),
    dismiss: removeToast,
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />;
      case 'error':
        return <AlertCircle className="text-rose-400 flex-shrink-0" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-400 flex-shrink-0" size={20} />;
      default:
        return <Info className="text-blue-400 flex-shrink-0" size={20} />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/40 shadow-emerald-950/50';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/40 shadow-rose-950/50';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/40 shadow-amber-950/50';
      default:
        return 'border-blue-500/30 bg-slate-900/90 shadow-blue-950/50';
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* FIXED TOAST NOTIFICATION CONTAINER */}
      <div
        className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${getToastBorder(
              t.type
            )}`}
          >
            {getToastIcon(t.type)}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <p className="text-xs font-semibold text-white mb-0.5 tracking-wide">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-gray-200 leading-relaxed font-normal break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/10"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      success: (msg) => console.log('Toast [success]:', msg),
      error: (msg) => console.error('Toast [error]:', msg),
      info: (msg) => console.log('Toast [info]:', msg),
      warning: (msg) => console.warn('Toast [warning]:', msg),
      dismiss: () => {},
    };
  }
  return context;
}
