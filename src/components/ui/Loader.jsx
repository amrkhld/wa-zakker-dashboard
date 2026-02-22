import React from 'react';

/**
 * Reusable Loader/Spinner Component
 * 
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} props.size - Spinner size
 * @param {'primary' | 'secondary' | 'danger'} props.variant - Spinner color variant
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Accessibility label
 */
const Loader = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // Color variants
  const colorClasses = {
    primary: 'text-[#11538C]',
    secondary: 'text-[#398CBF]',
    danger: 'text-[#ed5e5e]',
  };

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[variant]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export default Loader;
