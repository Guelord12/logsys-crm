import React from 'react';
import clsx from 'clsx';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  padding = true,
  bordered = true,
  shadow = true,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl',
        bordered && 'border border-gray-200',
        shadow && 'shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b border-gray-200',
          headerClassName
        )}>
          <div>
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={clsx(
        padding && 'p-6',
        bodyClassName
      )}>
        {children}
      </div>
      
      {footer && (
        <div className={clsx(
          'px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl',
          footerClassName
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;