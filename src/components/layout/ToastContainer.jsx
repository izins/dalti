import React, { useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useQueue();

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in-right ${styles[toast.type] || styles.info}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
