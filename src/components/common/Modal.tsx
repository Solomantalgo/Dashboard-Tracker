import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm animate-fade-in sm:p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`w-full ${maxWidth} max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] shadow-2xl sm:max-h-[90vh]`}>
        <div className="flex items-center justify-between border-b border-[#262A36] bg-[#1A1D26] px-4 py-3.5 sm:px-6 sm:py-4">
          <h3 id="modal-title" className="text-lg font-bold font-heading text-[#F5F6F8]">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-10 min-w-10 rounded-lg p-2 text-[#9AA1AE] transition-colors hover:bg-[#262A36] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
