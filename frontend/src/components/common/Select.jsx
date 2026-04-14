import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Select = forwardRef(({
  label,
  options = [],
  error,
  helper,
  required,
  disabled,
  className,
  placeholder,
  ...props
}, ref) => {
  // S'assurer que options est toujours un tableau
  const safeOptions = Array.isArray(options) ? options : [];
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2 rounded-lg border transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {safeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;