import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../../Context/RegisterGrantContext';
import axios from 'axios';
import './Login.css';

export const UserLogin = () => {
  const navigate = useNavigate();
  const { 
    state, 
    updateLoginForm, 
    validateLoginField, 
    login, 
    loading: contextLoading,
    setError: setContextError
  } = useRegister();
  
  // Create local state for user login form if it doesn't exist in the context state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // Initialize from context state if available
  useEffect(() => {
    if (state?.loginForm) {
      setLoginForm(state.loginForm);
    }
    if (state?.loginErrors) {
      setLoginErrors(state.loginErrors);
    }
  }, [state?.loginForm, state?.loginErrors]);
  
  // Clear errors when component mounts
  useEffect(() => {
    setLocalError(null);
    if (setContextError) {
      setContextError(null);
    }
  }, [setContextError]);

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Email is invalid';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      default:
        break;
    }
    
    setLoginErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update local state
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    setLoginErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    
    // If context functions exist, also update there
    if (updateLoginForm) {
      updateLoginForm({ [name]: value });
    }
    
    if (validateLoginField) {
      validateLoginField(name, value);
    } else {
      validateField(name, value);
    }
  };

  const handleDirectLogin = async () => {
    try {
      // API URL and endpoint
      const API_URL = 'https://grant-api.onrender.com';
      const endpoint = '/api/auth/login';
      
      console.log('Attempting direct login to:', `${API_URL}${endpoint}`);
      
      // Create request data
      const loginData = {
        email: loginForm.email.toLowerCase(),
        password: loginForm.password
      };
      
      // Make direct API call with explicit configuration
      const response = await axios({
        method: 'post',
        url: `${API_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: loginData
      });
      
      console.log('Login response received:', response.status);
      
      if (response.data && response.data.token) {
        // Store authentication data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify({
          id: response.data._id,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          role: response.data.role
        }));
        
        return true;
      } else {
        throw new Error('Invalid response from server - missing authentication token');
      }
    } catch (error) {
      console.error('Direct login error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    // Validate all fields before submission
    let isValid = true;
    const loginFields = ['email', 'password'];
    
    loginFields.forEach(field => {
      if (validateLoginField) {
        if (!validateLoginField(field, loginForm[field])) {
          isValid = false;
        }
      } else {
        if (!validateField(field, loginForm[field])) {
          isValid = false;
        }
      }
    });
    
    if (!isValid) {
      return false;
    }
    
    try {
      setLocalLoading(true);
      
      // Try both login methods for redundancy
      let success = false;
      let directLoginError = null;
      
      // First attempt: Try context login method if available
      if (login) {
        try {
          console.log('Attempting login via context function');
          success = await login(e);
        } catch (contextError) {
          console.warn('Context login failed:', contextError);
        }
      }
      
      // Second attempt: If context login fails or doesn't exist, try direct API call
      if (!success) {
        try {
          console.log('Attempting direct API login as fallback');
          success = await handleDirectLogin();
        } catch (error) {
          directLoginError = error;
          console.error('Direct login also failed:', error);
        }
      }
      
      if (success) {
        console.log('Login successful, redirecting to home page');
        // Redirect to home page on successful login instead of dashboard
        navigate('/');
        return;
      }
      
      // If we get here, both login attempts failed
      const errorMessage = directLoginError?.response?.data?.message || 
                          'Login failed. Please check your credentials and try again.';
      
      setLocalError(errorMessage);
      if (setContextError) {
        setContextError(errorMessage);
      }
      
    } catch (err) {
      console.error("Login processing error:", err);
      const errorMessage = err.response?.data?.message || 
                          'An unexpected error occurred. Please try again later.';
      
      setLocalError(errorMessage);
      if (setContextError) {
        setContextError(errorMessage);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Determine if any type of loading is happening
  const isLoading = localLoading || contextLoading;

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>User Login</h2>
        
        {/* Show error messages */}
        {(localError || state?.error) && (
          <div className="error-message">
            {localError || state?.error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginForm.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={loginErrors.email ? 'input-error' : ''}
              disabled={isLoading}
            />
            {loginErrors.email && <span className="error-text">{loginErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginForm.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={loginErrors.password ? 'input-error' : ''}
              disabled={isLoading}
            />
            {loginErrors.password && <span className="error-text">{loginErrors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="form-links">
            <a href="/forgot-password" className="forgot-password-link">Forgot Password?</a>
            <a href="/register" className="register-link">Create an Account</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { 
    state, 
    updateAdminLoginForm, 
    validateAdminLoginField, 
    adminLogin, 
    loading: contextLoading,
    setError: setContextError
  } = useRegister();
  
  // Create local state for admin login form if it doesn't exist in the context state
  const [adminLoginForm, setAdminLoginForm] = useState({ email: '', password: '' });
  const [adminLoginErrors, setAdminLoginErrors] = useState({ email: '', password: '' });
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  // Clear errors when component mounts
  useEffect(() => {
    setLocalError(null);
    setContextError(null);
  }, [setContextError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update local state
    setAdminLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    setAdminLoginErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    
    // If context functions exist, also update there
    if (updateAdminLoginForm) {
      updateAdminLoginForm({ [name]: value });
    }
    
    if (validateAdminLoginField) {
      validateAdminLoginField(name, value);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Email is invalid';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      default:
        break;
    }
    
    setAdminLoginErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };

  const handleDirectAdminLogin = async () => {
    try {
      // API URL and endpoint
      const API_URL = 'https://grant-api.onrender.com';
      const endpoint = '/api/auth/admin/login';
      
      console.log('Attempting direct admin login to:', `${API_URL}${endpoint}`);
      
      // Create request data
      const loginData = {
        email: adminLoginForm.email.toLowerCase(),
        password: adminLoginForm.password
      };
      
      // Make direct API call with explicit configuration
      const response = await axios({
        method: 'post',
        url: `${API_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: loginData
      });
      
      console.log('Admin login response received:', response.status);
      
      if (response.data && response.data.token) {
        // Store authentication data in localStorage with SAME KEYS as normal login
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify({
          id: response.data._id,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          role: response.data.role
        }));
        
        return true;
      } else {
        throw new Error('Invalid response from server - missing authentication token');
      }
    } catch (error) {
      console.error('Direct admin login error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    // Validate all fields before submission
    let isValid = true;
    const loginFields = ['email', 'password'];
    
    loginFields.forEach(field => {
      // Use either context validation or local validation
      if (validateAdminLoginField) {
        if (!validateAdminLoginField(field, adminLoginForm[field])) {
          isValid = false;
        }
      } else {
        if (!validateField(field, adminLoginForm[field])) {
          isValid = false;
        }
      }
    });
    
    if (!isValid) {
      return false;
    }
    
    try {
      setLocalLoading(true);
      
      // Try both login methods for redundancy
      let success = false;
      let directLoginError = null;
      
      // First attempt: Try context login method if available
      if (adminLogin) {
        try {
          console.log('Attempting admin login via context function');
          success = await adminLogin(e);
        } catch (contextError) {
          console.warn('Context admin login failed:', contextError);
        }
      }
      
      // Second attempt: If context login fails or doesn't exist, try direct API call
      if (!success) {
        try {
          console.log('Attempting direct API admin login as fallback');
          success = await handleDirectAdminLogin();
        } catch (error) {
          directLoginError = error;
          console.error('Direct admin login also failed:', error);
        }
      }
      
      if (success) {
        console.log('Admin login successful, redirecting to home page');
        // Redirect to home page on successful login
        navigate('/');
        return;
      }
      
      // If we get here, both login attempts failed
      const errorMessage = directLoginError?.response?.data?.message || 
                          'Admin login failed. Please check your credentials and try again.';
      
      setLocalError(errorMessage);
      if (setContextError) {
        setContextError(errorMessage);
      }
      
    } catch (err) {
      console.error("Admin login processing error:", err);
      const errorMessage = err.response?.data?.message || 
                          'An unexpected error occurred. Please try again later.';
      
      setLocalError(errorMessage);
      if (setContextError) {
        setContextError(errorMessage);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Determine if any type of loading is happening
  const isLoading = localLoading || contextLoading;

  return (
    <div className="login-container admin-login">
      <div className="login-form-container">
        <h2>Admin Login</h2>
        
        {/* Show error messages */}
        {(localError || state?.error) && (
          <div className="error-message">
            {localError || state?.error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              type="email"
              id="admin-email"
              name="email"
              value={adminLoginForm.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              className={adminLoginErrors.email ? 'input-error' : ''}
              disabled={isLoading}
            />
            {adminLoginErrors.email && <span className="error-text">{adminLoginErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              name="password"
              value={adminLoginForm.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              className={adminLoginErrors.password ? 'input-error' : ''}
              disabled={isLoading}
            />
            {adminLoginErrors.password && <span className="error-text">{adminLoginErrors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;