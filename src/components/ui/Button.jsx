import React from 'react';

/**
 * Reusable Button Component
 * 
 * @param {Object} props
 * @param {string} props.children - Button text/content
 * @param {React.ReactNode} props.icon - Icon from bootstrap-icons
 * @param {'primary' | 'secondary' | 'danger'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disable button
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullWidth - Make button full width
 * @param {boolean} props.loading - Show loading state
 */
const Button = ({
  children,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  fullWidth = false,
  loading = false,
  type = 'button',
  ...rest
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Color variants
  const variantClasses = {
    primary: 'bg-[#11538C] text-white hover:bg-[#398CBF]',
    secondary: 'bg-[#9AC1D9] text-[#11538C] hover:bg-[#639CBF]',
    danger: 'bg-[#ed5e5e] text-white hover:bg-[#d94a4a]',
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-[22px]
    font-medium
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11538C]
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={baseClasses}
      {...rest}
    >
      {loading && (
        <span className="inline-block animate-spin">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
};

export default Button;
