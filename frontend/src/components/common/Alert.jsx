import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Alert = ({
  type = 'info',
  title,
  children,
  onClose,
  className
}) => {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: CheckCircleIcon,
      iconColor: 'text-green-400'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: XCircleIcon,
      iconColor: 'text-red-400'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-400'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-400'
    }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={clsx(
      'rounded-lg border p-4',
      style.bg,
      style.border,
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', style.iconColor)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-medium', style.text)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={clsx('text-sm', style.text, title && 'mt-2')}>
              {children}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                type === 'info' ? 'focus:ring-blue-500' : 
                type === 'success' ? 'focus:ring-green-500' :
                type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-red-500'
              )}
            >
              <XMarkIcon className={clsx('h-5 w-5', style.iconColor)} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;