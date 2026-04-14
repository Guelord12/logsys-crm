import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, className }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={clsx(
              'text-sm mt-2 flex items-center',
              trend > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {trend > 0 ? (
                <ArrowUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;