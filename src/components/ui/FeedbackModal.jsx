import React, { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircle, XCircle, AlertCircle, InfoCircle, X } from 'react-bootstrap-icons';

const FeedbackModal = ({
  isOpen = false,
  onClose,
  type = 'info', // success, error, warning, info
  title,
  message,
  autoCloseDuration = 5000,
  actionLabel,
  onAction,
  closable = true,
}) => {
  // Auto-close timer
  useEffect(() => {
    if (!isOpen || autoCloseDuration === 0) return;

    const timer = setTimeout(onClose, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [isOpen, autoCloseDuration, onClose]);

  // Type mapping constrained to the design palette
  const iconMap = {
    success: { icon: CheckCircle, color: 'text-[#11538C]' },
    error: { icon: XCircle, color: 'text-[#ed5e5e]' },
    warning: { icon: AlertCircle, color: 'text-[#ed5e5e]' },
    info: { icon: InfoCircle, color: 'text-[#11538C]' },
  };

  const { icon: IconComponent, color } = iconMap[type] || iconMap.info;

  return (
    <Transition show={isOpen} as={Fragment}>
      {/* Backdrop */}
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      </Transition.Child>

      {/* Modal */}
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-[22px] border border-[#F2F2F2] p-6">
            {/* Close button */}
            {closable && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[#11538C] hover:text-[#398CBF] transition-colors"
              >
                <X size={20} />
              </button>
            )}

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-[#9AC1D9] flex items-center justify-center mb-4">
              <IconComponent size={24} className={color} />
            </div>

            {/* Title */}
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
            )}

            {/* Message */}
            {message && (
              <p className="text-gray-600 mb-6">
                {message}
              </p>
            )}

            {/* Action button */}
            {actionLabel && (
              <button
                onClick={() => {
                  onAction?.();
                  onClose();
                }}
                className={
                  type === 'error' || type === 'warning'
                    ? 'w-full px-4 py-2 bg-[#ed5e5e] text-white rounded-[22px] hover:bg-[#d94a4a] transition-colors font-medium'
                    : 'w-full px-4 py-2 bg-[#11538C] text-white rounded-[22px] hover:bg-[#398CBF] transition-colors font-medium'
                }
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </Transition.Child>
    </Transition>
  );
};

export default FeedbackModal;
