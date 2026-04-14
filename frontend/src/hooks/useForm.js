import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validationSchema = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({ ...prev, [name]: newValue }));
    
    if (touched[name] && validationSchema) {
      validateField(name, newValue);
    }
  }, [touched, validationSchema]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validationSchema) {
      validateField(name, values[name]);
    }
  }, [values, validationSchema]);

  const validateField = async (name, value) => {
    if (!validationSchema) return true;
    
    try {
      await validationSchema.validateAt(name, { ...values, [name]: value });
      setErrors(prev => ({ ...prev, [name]: null }));
      return true;
    } catch (err) {
      setErrors(prev => ({ ...prev, [name]: err.message }));
      return false;
    }
  };

  const validateForm = async () => {
    if (!validationSchema) return true;
    
    try {
      await validationSchema.validate(values, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const newErrors = {};
      err.inner.forEach(error => {
        if (!newErrors[error.path]) {
          newErrors[error.path] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isValid = await validateForm();
    
    if (isValid) {
      await onSubmit(values);
    }
    
    setIsSubmitting(false);
  };

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setValues
  };
};