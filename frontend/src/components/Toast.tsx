import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '350px'
    }}>
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastNotification: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <XCircle size={20} color="#ef4444" />;
      case 'info':
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
    }
  };

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.3s ease-out',
        backdropFilter: 'blur(10px)'
      }}
    >
      {getIcon()}
      <p style={{ flex: 1, margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
