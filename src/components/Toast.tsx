import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000); // Auto-cerrar después de 4 segundos

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${getBgColor()} border-2 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-md w-full pointer-events-auto`}
    >
      {getIcon()}
      <p className="flex-1 text-sm font-medium text-stone-800">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4 text-stone-600" />
      </button>
    </motion.div>
  );
};

// Hook personalizado para usar Toast
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = (type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    closeToast,
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    info: (message: string) => showToast('info', message),
  };
};
