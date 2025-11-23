
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onDismiss: () => void;
}

export const StatusToast: React.FC<StatusToastProps> = ({ message, type, visible, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  const icons = {
    success: <CheckCircle size={18} className="text-green-500 mr-2" />,
    error: <XCircle size={18} className="text-red-500 mr-2" />,
    info: <AlertCircle size={18} className="text-blue-500 mr-2" />
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg flex items-center transform transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'} ${styles[type]}`}>
      {icons[type]}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};
