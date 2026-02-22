import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

/**
 * Reusable Modal Component using Headless UI
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Control modal visibility
 * @param {function} props.onClose - Callback when modal closes
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {Array} props.actions - Array of action buttons {label, onClick, variant}
 * @param {boolean} props.closeOnOverlayClick - Close on backdrop click
 * @param {string} props.size - Modal size: 'sm' | 'md' | 'lg'
 * @param {string} props.className - Additional CSS classes
 */
const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  actions = [],
  closeOnOverlayClick = true,
  size = 'md',
  className = '',
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeOnOverlayClick ? onClose : () => {}}>
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
          <div className="fixed inset-0 bg-black bg-opacity-20" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel
                className={`
                  w-full ${sizeClasses[size]}
                  bg-white
                  rounded-[22px]
                  p-6
                  border border-[#F2F2F2]
                  transition-opacity
                  ${className}
                `}
              >
                {/* Title */}
                {title && (
                  <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                    {title}
                  </Dialog.Title>
                )}

                {/* Content */}
                <div className="text-gray-600 mb-6">{children}</div>

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="flex gap-3 justify-end">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.onClick?.();
                          if (action.closeOnClick !== false) {
                            onClose();
                          }
                        }}
                        className={`
                          px-4 py-2
                          rounded-[22px]
                          font-medium
                          text-sm
                          transition-colors duration-200
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11538C]
                          ${
                            action.variant === 'danger'
                              ? 'bg-[#ed5e5e] text-white hover:bg-[#d94a4a]'
                              : action.variant === 'secondary'
                              ? 'bg-[#9AC1D9] text-[#11538C] border border-[#398CBF] hover:bg-[#639CBF]'
                              : 'bg-[#11538C] text-white hover:bg-[#398CBF]'
                          }
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
