import { useState } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
}
