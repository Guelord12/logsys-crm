import React from 'react';
import Input from '@components/common/Input';
import Select from '@components/common/Select';

const FormField = ({ type = 'text', ...props }) => {
  switch (type) {
    case 'select':
      return <Select {...props} />;
    case 'textarea':
      return <Input as="textarea" rows={4} {...props} />;
    case 'checkbox':
      return (
        <label className="flex items-center">
          <input type="checkbox" className="rounded border-gray-300 text-blue-600" {...props} />
          <span className="ml-2 text-sm text-gray-700">{props.label}</span>
        </label>
      );
    case 'radio':
      return (
        <label className="flex items-center">
          <input type="radio" className="border-gray-300 text-blue-600" {...props} />
          <span className="ml-2 text-sm text-gray-700">{props.label}</span>
        </label>
      );
    default:
      return <Input type={type} {...props} />;
  }
};

export default FormField;