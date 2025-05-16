import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Configure axios with fixed backend URL
const API_URL = 'https://grant-api.onrender.com';

// Create a dedicated axios instance with consistent configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// Add token interceptor
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Validators
const validators = {
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  formatPhone: (phone) => phone.replace(/[^\d+]/g, ''),
  isValidPhone: (phone) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return /^\+?\d{1,4}\d{6,15}$/.test(cleaned);
  },
  isValidPassword: (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumber && isLongEnough;
  }
};

// Create context
export const RegisterContext = createContext();

// Create a provider component
export const RegisterProvider = ({ children }) => {
  // State variables
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    primaryPhone: '',
    mobilePhone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  
  const [adminLoginForm, setAdminLoginForm] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [adminLoginErrors, setAdminLoginErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Helper function to get user data from localStorage
  const getUserFromStorage = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
      return null;
    }
  };

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = getUserFromStorage();
      
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setIsAdmin(storedUser.role === 'ADMIN' || (storedUser.roles && storedUser.roles.includes('ADMIN')));
        
        // Optionally verify token with backend
        axiosInstance.get('/api/auth/verify-token')
          .catch(error => {
            console.warn('Token verification failed, but not logging out automatically');
          });
      } else {
        if (isAuthenticated) {
          logout();
        }
      }
      setLoading(false);
    };
    
    // Check auth immediately when component mounts
    checkAuth();
    
    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userData') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up interval to periodically check authentication status
    const authCheckInterval = setInterval(checkAuth, 60000); // Check every minute
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, [isAuthenticated]);

  // Update form data
  const updateForm = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  // Update login form
  const updateLoginForm = (updates) => {
    setLoginForm(prev => ({ ...prev, ...updates }));
  };
  
  // Update admin login form
  const updateAdminLoginForm = (updates) => {
    setAdminLoginForm(prev => ({ ...prev, ...updates }));
  };

  // Validate registration field
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          newErrors[name] = 'First name is required';
        } else if (value.trim().length < 2) {
          newErrors[name] = 'First name must be at least 2 characters long';
        } else {
          delete newErrors[name];
        }
        break;
        
      case 'lastName':
        if (!value.trim()) {
          newErrors[name] = 'Last name is required';
        } else if (value.trim().length < 2) {
          newErrors[name] = 'Last name must be at least 2 characters long';
        } else {
          delete newErrors[name];
        }
        break;
        
      case 'email':
        if (!value) {
          newErrors[name] = 'Email is required';
        } else if (!validators.isValidEmail(value)) {
          newErrors[name] = 'Please enter a valid email address';
        } else {
          delete newErrors[name];
        }
        break;
        
      case 'primaryPhone':
        if (!value) {
          newErrors[name] = 'Primary phone is required';
        } else if (!validators.isValidPhone(value)) {
          newErrors[name] = 'Please enter a valid phone number with country code (e.g., +234 for Nigeria)';
        } else {
          delete newErrors[name];
        }
        break;

      case 'mobilePhone':
        if (value && !validators.isValidPhone(value)) {
          newErrors[name] = 'Please enter a valid phone number with country code (e.g., +234 for Nigeria)';
        } else {
          delete newErrors[name];
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors[name] = 'Password is required';
        } else if (value.length < 8) {
          newErrors[name] = 'Password must be at least 8 characters long';
        } else if (!/[A-Z]/.test(value)) {
          newErrors[name] = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(value)) {
          newErrors[name] = 'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(value)) {
          newErrors[name] = 'Password must contain at least one number';
        } else {
          delete newErrors[name];
          
          // Check password match when password changes
          if (formData.confirmPassword && 
              formData.confirmPassword !== value) {
            newErrors['confirmPassword'] = 'Passwords must match exactly';
          }
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors[name] = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors[name] = 'Passwords must match exactly';
        } else {
          delete newErrors[name];
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Login form validation
  const validateLoginField = (name, value) => {
    const newErrors = { ...loginErrors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors[name] = 'Email is required';
        } else if (!validators.isValidEmail(value)) {
          newErrors[name] = 'Please enter a valid email address';
        } else {
          delete newErrors[name];
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors[name] = 'Password is required';
        } else if (value.length < 6) {
          newErrors[name] = 'Password must be at least 6 characters long';
        } else {
          delete newErrors[name];
        }
        break;
    }
    
    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Admin login form validation
  const validateAdminLoginField = (name, value) => {
    const newErrors = { ...adminLoginErrors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors[name] = 'Email is required';
        } else if (!validators.isValidEmail(value)) {
          newErrors[name] = 'Please enter a valid email address';
        } else {
          delete newErrors[name];
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors[name] = 'Password is required';
        } else if (value.length < 6) {
          newErrors[name] = 'Password must be at least 6 characters long';
        } else {
          delete newErrors[name];
        }
        break;
    }
    
    setAdminLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration submit
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
      
    // Reset previous states
    setError(null);
    setSuccess(false);
      
    // Field validation
    const fieldsToValidate = [
      'firstName', 'lastName', 'email', 'primaryPhone', 
      'password', 'confirmPassword'
    ];
      
    let isValid = true;
    const currentErrors = { ...errors };
      
    // Validate each field
    fieldsToValidate.forEach(field => {
      const fieldValue = formData[field];
      if (!validateField(field, fieldValue)) {
        isValid = false;
      }
    });
  
    // Explicit password matching validation
    if (formData.password !== formData.confirmPassword) {
      currentErrors.confirmPassword = 'Passwords must match exactly';
      isValid = false;
    }
  
    // Additional password complexity check
    if (!validators.isValidPassword(formData.password)) {
      currentErrors.password = 'Password does not meet complexity requirements';
      isValid = false;
    }
  
    // If validation fails, update errors and return
    if (!isValid) {
      setErrors(currentErrors);
      return false;
    }
  
    // Prepare submission data
    const submitData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      primaryPhone: validators.formatPhone(formData.primaryPhone),
      mobilePhone: formData.mobilePhone 
        ? validators.formatPhone(formData.mobilePhone) 
        : '',
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };
  
    try {
      setLoading(true);
      
      console.log('Submitting registration data to:', `${API_URL}/api/auth/register`);
      
      const response = await axiosInstance.post('/api/auth/register', submitData);
      
      // Handle successful registration
      clearRegistrationForm();
      setSuccess(true);
      
      return response.data;
    } catch (error) {
      console.error('Registration Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      setError(errorMessage);
      
      // Handle specific field errors from server
      if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          const serverErrors = error.response.data.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {});
      
          setErrors(serverErrors);
        } 
        else if (typeof error.response.data.errors === 'object') {
          setErrors(error.response.data.errors);
        }
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // User login function
  const login = async (e) => {
    if (e) e.preventDefault();
    
    // Reset previous error states
    setError(null);
    
    // Validate login form fields
    let isValid = true;
    const loginFields = ['email', 'password'];
    
    loginFields.forEach(field => {
      const fieldValue = loginForm[field];
      if (!validateLoginField(field, fieldValue)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      return false;
    }
    
    try {
      setLoading(true);
      
      // Prepare login data
      const loginData = {
        email: loginForm.email.toLowerCase(),
        password: loginForm.password
      };
      
      console.log('Attempting login to:', `${API_URL}/api/auth/login`);
      
      // Use a direct axios call with explicit configuration for maximum reliability
      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/auth/login`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: loginData
      });
      
      console.log('Login response received:', response.status);
      
      const userData = response.data;
      
      if (!userData || !userData.token) {
        throw new Error('Invalid response from server - missing authentication token');
      }
      
      // Store user data in localStorage
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userData', JSON.stringify({
        id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
      }));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.role === 'ADMIN' || (userData.roles && userData.roles.includes('ADMIN')));
      setSuccess(true);
      
      return true;
    } catch (error) {
      console.error('Login Error:', error);
      console.error('Login Response Data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      setError(errorMessage);
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Admin login function
  const adminLogin = async (e) => {
    if (e) e.preventDefault();
    
    // Reset previous states
    setError(null);
    
    // Validate admin login form fields
    let isValid = true;
    const adminLoginFields = ['email', 'password'];
    
    adminLoginFields.forEach(field => {
      const fieldValue = adminLoginForm[field];
      if (!validateAdminLoginField(field, fieldValue)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      return false;
    }
    
    try {
      setLoading(true);
      
      // Use direct axios call for admin login
      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/auth/admin/login`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {
          email: adminLoginForm.email.toLowerCase(),
          password: adminLoginForm.password
        }
      });
      
      const userData = response.data;
      
      if (!userData || !userData.token) {
        throw new Error('Invalid response from server - missing authentication token');
      }
      
      // Check if user is admin
      if (userData.role !== 'ADMIN') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Store admin data using the same keys as regular login
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userData', JSON.stringify({
        id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
      }));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(true);
      setSuccess(true);
      
      return true;
    } catch (error) {
      console.error('Admin Login Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Admin login failed. Please verify your credentials.';
      
      setError(errorMessage);
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Check admin status
  const checkAdminStatus = () => {
    console.log('Checking admin status in RegisterContext...');
    try {
      const storedUser = getUserFromStorage();
      
      // Check for admin role with flexible matching
      const adminRole = storedUser && (
        storedUser.role === 'ADMIN' || 
        storedUser.role === 'admin' || 
        (storedUser.roles && storedUser.roles.includes('ADMIN'))
      );
      
      // Update context state
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setIsAdmin(!!adminRole);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      
      console.log('Auth check result:', { 
        parsedUser: storedUser, 
        isAdmin: !!adminRole, 
        isAuthenticated: !!storedUser 
      });
      
      return !!adminRole;
    } catch (e) {
      console.error('Error checking authentication status:', e);
      setIsAdmin(false);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    return true;
  };

  // Clear registration form
  const clearRegistrationForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      primaryPhone: '',
      mobilePhone: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  // Value to be provided by the context
  const contextValue = {
    formData,
    loginForm,
    adminLoginForm,
    errors,
    loginErrors,
    adminLoginErrors,
    loading,
    error,
    success,
    user,
    isAuthenticated,
    isAdmin,
    updateForm,
    updateLoginForm,
    updateAdminLoginForm,
    validateField,
    validateLoginField,
    validateAdminLoginField,
    handleRegisterSubmit,
    login,
    adminLogin,
    logout,
    clearRegistrationForm,
    setError,
    checkAdminStatus
  };

  return (
    <RegisterContext.Provider value={contextValue}>
      {children}
    </RegisterContext.Provider>
  );
};

// Custom hook for using the register context
export const useRegister = () => {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegister must be used within a RegisterProvider');
  }
  return context;
};

export default RegisterContext;