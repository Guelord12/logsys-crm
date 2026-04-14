import React from 'react';
import { Link } from 'react-router-dom';

const LogoSys = ({ size = 'default', showText = true, asLink = true }) => {
  const sizes = {
    small: { icon: 'w-8 h-8', text: 'text-xl' },
    default: { icon: 'w-10 h-10', text: 'text-2xl' },
    large: { icon: 'w-12 h-12', text: 'text-3xl' }
  };

  const currentSize = sizes[size] || sizes.default;

  const LogoContent = () => (
    <div className="logsys-logo flex items-center space-x-2">
      <div className={`logsys-logo-icon ${currentSize.icon} rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center`}>
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3" />
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      {showText && (
        <span className={`logsys-logo-text ${currentSize.text} font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent`}>
          LogSys
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to="/dashboard" className="inline-block">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

export default LogoSys;