import React, { useState } from 'react';
import clsx from 'clsx';

const Tooltip = ({ children, content, position = 'top', className }) => {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div className={clsx(
          'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap',
          positions[position],
          className
        )}>
          {content}
          <div className={clsx(
            'absolute w-0 h-0 border-4 border-transparent',
            arrows[position]
          )} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;