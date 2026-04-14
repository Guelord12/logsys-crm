import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="logsys-footer">
      <div className="container mx-auto px-6">
        <p>
          © {currentYear} LogSys CRM. Tous droits réservés.
          <span className="mx-2">•</span>
          <span className="font-medium text-blue-600">From G-tech</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;