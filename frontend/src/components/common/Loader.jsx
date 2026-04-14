import React from 'react';
import clsx from 'clsx';

const Loader = ({ size = 'md', color = 'blue', className }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colors = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600'
  };

  return (
    <div className={clsx('flex justify-center items-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-b-2',
          sizes[size],
          colors[color]
        )}
      />
    </div>
  );
};

export default Loader;