import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Loader from './Loader';

export default function InputDialogModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  defaultValue = '',
  placeholder = '',
  confirmText = 'Confirm',
  icon: Icon,
  iconColor = 'text-blue-400',
  isDestructive = false,
  isPromptOnly = false, // If true, only confirmation button without text input
}) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPromptOnly && !value.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0e1628] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2.5 rounded-xl bg-white/10 ${iconColor} border border-white/10`}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              {description && (
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isPromptOnly && (
            <div>
              <input
                type="text"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/80 transition"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isPromptOnly && !value.trim())}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              }`}
            >
              {isSubmitting ? (
                <Loader variant="button" size="xs" text="Saving..." />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
