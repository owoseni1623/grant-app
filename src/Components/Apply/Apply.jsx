import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import { MdCloudUpload, MdDelete } from 'react-icons/md';
import { CreditCard, Eye, EyeOff, Key, Lock } from 'lucide-react';
import { useApplicationForm, FUNDING_TYPES } from '../../Context/ApplicationFormContext';
import './Apply.css';

// States array
const states = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Security questions
const securityQuestions = [
  'What was the name of your first pet?',
  'What is your mother\'s maiden name?',
  'In what city were you born?'
];

const Apply = () => {
  // Use the custom hook from your ApplicationFormContext
  const {
    formData,
    currentStep,
    errors,
    isSubmitting,
    updateFormField,
    moveToNextStep,
    moveToPreviousStep,
    submitForm,
    validateCurrentStep,
    removeFile
  } = useApplicationForm();

  // Local state
  const [showSSN, setShowSSN] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showFacebookPassword, setShowFacebookPassword] = useState(false);
  const [dragActive, setDragActive] = useState({ front: false, back: false });
  
  const navigate = useNavigate();
  
  // Refs for file inputs
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Drag and drop handlers
  const handleDragEnter = (e, type) => {
    e.preventDefault();
    setDragActive(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    setDragActive(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    updateFormField(field, file);
    setDragActive({ front: false, back: false });
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
     
    if (name === 'ssn') {
      // Remove all non-numeric characters
      const numbersOnly = value.replace(/\D/g, '');
      
      // Limit to 9 digits
      const truncatedNumbers = numbersOnly.slice(0, 9);
      
      // Format with dashes
      const formattedSSN = truncatedNumbers.length > 5 
        ? `${truncatedNumbers.slice(0,3)}-${truncatedNumbers.slice(3,5)}-${truncatedNumbers.slice(5)}` 
        : truncatedNumbers.length > 3 
        ? `${truncatedNumbers.slice(0,3)}-${truncatedNumbers.slice(3)}` 
        : truncatedNumbers;
      
      updateFormField(name, formattedSSN);
    } else if (type === 'file') {
      updateFormField(name, files[0]);
    } else if (type === 'checkbox') {
      updateFormField(name, checked);
    } else {
      updateFormField(name, value);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitForm();
      navigate('/grant-success');
    } catch (error) {
      console.error('Submission failed', error);
      const errorMessage = error?.message || 
                          errors?.submission || 
                          'Submission failed. Please try again.';
      alert(errorMessage);
    }
  };

  // Handle going to next step with validation
  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      moveToNextStep();
    } else {
      // Show validation errors to user
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        alert(`Please fix the following fields: ${errorFields.join(', ')}`);
      }
    }
  };

  return (
    <div className="apply-container">
      {/* Notification Area */}
      {formData.notification && formData.notification.show && (
        <div className={`notification ${formData.notification.type}`}>
          <span>{formData.notification.message}</span>
        </div>
      )}

      <div className="apply-form">
        <div className="grant-form-header">
          <h1 className="form-title">grant.GOV Application</h1>
          <div className="step-progress-indicator">
            {[
              { number: 1, label: 'Personal Info' },
              { number: 2, label: 'Verification' },
              { number: 3, label: 'Details' }
            ].map((step) => (
              <div 
                key={step.number} 
                className={`step 
                  ${currentStep === step.number ? 'active' : ''} 
                  ${currentStep > step.number ? 'completed' : ''}`}
              >
                <div className="step-marker">
                  <span className="step-number">{step.number}</span>
                </div>
                <div className="step-description">{step.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Information Step */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="form-step">
            <h3>Personal Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ssn">Social Security Number</label>
                <div className="input-with-icon">
                  <CreditCard className="field-icon" size={20} />
                  <input
                    type={showSSN ? "text" : "password"}
                    id="ssn"
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleInputChange}
                    placeholder="Enter your SSN"
                    maxLength="11"
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setShowSSN(!showSSN)}
                    tabIndex={-1}
                  >
                    {showSSN ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.ssn && <div className="error-message">{errors.ssn}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
                {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Key className="field-icon" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="facebookEmail">Facebook Email</label>
                <input
                  type="email"
                  id="facebookEmail"
                  name="facebookEmail"
                  value={formData.facebookEmail || ''}
                  onChange={handleInputChange}
                  placeholder="Enter your Facebook email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="facebookPassword">Facebook Password</label>
                <div className="input-with-icon">
                  <Lock className="field-icon" size={20} />
                  <input
                    type={showFacebookPassword ? "text" : "password"}
                    id="facebookPassword"
                    name="facebookPassword"
                    value={formData.facebookPassword || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your Facebook password"
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setShowFacebookPassword(!showFacebookPassword)}
                    tabIndex={-1}
                  >
                    {showFacebookPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {securityQuestions.map((question, index) => (
              <div className="form-group" key={index}>
                <label htmlFor={`securityQ${index + 1}`}>{question}</label>
                <input
                  type="text"
                  id={`securityQ${index + 1}`}
                  name={`securityQ${index + 1}`}
                  value={formData[`securityQ${index + 1}`] || ''}
                  onChange={handleInputChange}
                  placeholder="Enter your answer"
                />
              </div>
            ))}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="PreferNotToSay">Prefer Not to Say</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleInputChange}
                  min="18"
                  max="120"
                  placeholder="Enter your age"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="citizenshipStatus">Citizenship Status</label>
                <select
                  id="citizenshipStatus"
                  name="citizenshipStatus"
                  value={formData.citizenshipStatus}
                  onChange={handleInputChange}
                >
                  <option value="">Select Citizenship Status</option>
                  <option value="Citizen">U.S. Citizen</option>
                  <option value="PermanentResident">Permanent Resident</option>
                  <option value="Refugee">Refugee</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ethnicity">Ethnicity</label>
                <select
                  id="ethnicity"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleInputChange}
                >
                  <option value="">Select Ethnicity</option>
                  <option value="White">White</option>
                  <option value="Black">Black or African American</option>
                  <option value="Hispanic">Hispanic or Latino</option>
                  <option value="Asian">Asian</option>
                  <option value="NativeAmerican">Native American</option>
                  <option value="PacificIslander">Pacific Islander</option>
                  <option value="Mixed">Mixed Race</option>
                  <option value="PreferNotToSay">Prefer Not to Say</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="employmentStatus">Employment Status</label>
              <select
                id="employmentStatus"
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleInputChange}
              >
                <option value="">Select Employment Status</option>
                <option value="FullTime">Full-Time</option>
                <option value="PartTime">Part-Time</option>
                <option value="SelfEmployed">Self-Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Student">Student</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <div className="phone-input-container">
                <PhoneInput
                  international
                  defaultCountry="US"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={(value) => updateFormField('phoneNumber', value)}
                  className="phone-input"
                  flags={{}}
                  displayInitialValueAsLocalNumber
                  numberInputProps={{
                    className: 'custom-phone-input-no-flags'
                  }}
                />
                {errors.phoneNumber && <div className="error-message">{errors.phoneNumber}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fundingType">Funding Type</label>
              <select
                id="fundingType"
                name="fundingType"
                value={formData.fundingType}
                onChange={handleInputChange}
              >
                <option value="">Select Funding Type</option>
                {FUNDING_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.fundingType && <div className="error-message">{errors.fundingType}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="fundingAmount">Funding Amount</label>
              <input
                type="number"
                id="fundingAmount"
                name="fundingAmount"
                value={formData.fundingAmount}
                onChange={handleInputChange}
                min="75000"
                max="750000"
                placeholder="Minimum funding amount is $75,000 USD"
              />
              {errors.fundingAmount && <div className="error-message">{errors.fundingAmount}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="fundingPurpose">Funding Purpose</label>
              <textarea
                id="fundingPurpose"
                name="fundingPurpose"
                value={formData.fundingPurpose}
                onChange={handleInputChange}
                placeholder="Describe the purpose of your funding request"
              />
              {errors.fundingPurpose && <div className="error-message">{errors.fundingPurpose}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="timeframe">Timeframe</label>
              <select
                id="timeframe"
                name="timeframe"
                value={formData.timeframe}
                onChange={handleInputChange}
              >
                <option value="">Select Timeframe</option>
                <option value="1-7Days">1-7 Days</option>
                <option value="1-2Weeks">1-2 Weeks</option>
                <option value="2-4Weeks">2-4 Weeks</option>
              </select>
              {errors.timeframe && <div className="error-message">{errors.timeframe}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="streetAddress">Street Address</label>
              <input
                type="text"
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleInputChange}
                placeholder="Enter your street address"
              />
              {errors.streetAddress && <div className="error-message">{errors.streetAddress}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter your city"
                />
                {errors.city && <div className="error-message">{errors.city}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <div className="error-message">{errors.state}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="zip">ZIP Code</label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  placeholder="Enter ZIP code"
                  pattern="[0-9]{5}"
                  maxLength="5"
                />
                {errors.zip && <div className="error-message">{errors.zip}</div>}
              </div>
            </div>

            <div className="form-navigation">
              <button
                type="submit"
                className="btn btn-next"
                disabled={isSubmitting}
              >
                Next Step
              </button>
            </div>
          </form>
        )}

        {/* Verification Step */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep} className="form-step">
            <h3>Document Verification</h3>
            
            <div className="file-upload-section">
              <div className="form-group">
                <label>Upload Front of ID Card</label>
                <div 
                  className={`file-drop-area ${dragActive.front ? 'drag-active' : ''}`}
                  onDragEnter={(e) => handleDragEnter(e, 'front')}
                  onDragLeave={(e) => handleDragLeave(e, 'front')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'idCardFront')}
                >
                  <input 
                    type="file" 
                    ref={frontInputRef}
                    name="idCardFront"
                    style={{ display: 'none' }}
                    onChange={handleInputChange}
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  {formData.idCardFront ? (
                    <div className="file-preview">
                      <span>{formData.idCardFront.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile('idCardFront')}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  ) : (
                    <div className="file-upload-instructions">
                      <MdCloudUpload size={50} />
                      <p>Drag and drop or click to upload front of ID</p>
                      <button
                        type="button"
                        onClick={() => frontInputRef.current.click()}
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
                {errors.idCardFront && <div className="error-message">{errors.idCardFront}</div>}
              </div>

              <div className="form-group">
                <label>Upload Back of ID Card</label>
                <div 
                  className={`file-drop-area ${dragActive.back ? 'drag-active' : ''}`}
                  onDragEnter={(e) => handleDragEnter(e, 'back')}
                  onDragLeave={(e) => handleDragLeave(e, 'back')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'idCardBack')}
                >
                  <input 
                    type="file" 
                    ref={backInputRef}
                    name="idCardBack"
                    style={{ display: 'none' }}
                    onChange={handleInputChange}
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  {formData.idCardBack ? (
                    <div className="file-preview">
                      <span>{formData.idCardBack.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile('idCardBack')}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  ) : (
                    <div className="file-upload-instructions">
                      <MdCloudUpload size={50} />
                      <p>Drag and drop or click to upload back of ID</p>
                      <button
                        type="button"
                        onClick={() => backInputRef.current.click()}
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
                {errors.idCardBack && <div className="error-message">{errors.idCardBack}</div>}
              </div>
            </div>

            <div className="form-navigation">
              <button 
                type="button" 
                className="btn btn-prev" 
                onClick={moveToPreviousStep}
                disabled={isSubmitting}
              >
                Previous Step
              </button>
              <button 
                type="submit"
                className="btn btn-next" 
                disabled={isSubmitting}
              >
                Next Step
              </button>
            </div>
          </form>
        )}

        {/* Final Details Step */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="form-step">
            <h3>Additional Details</h3>
            <div className="form-group">
              <label htmlFor="incomeLevel">Income Level</label>
              <select
                id="incomeLevel"
                name="incomeLevel"
                value={formData.incomeLevel}
                onChange={handleInputChange}
              >
                <option value="">Select Income Level</option>
                <option value="Low">Low Income (&lt; $25,000)</option>
                <option value="Medium">Medium Income ($25,000 - $75,000)</option>
                <option value="High">High Income (&gt; $75,000)</option>
              </select>
              {errors.incomeLevel && <div className="error-message">{errors.incomeLevel}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="educationLevel">Education Level</label>
              <select
                id="educationLevel"
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
              >
                <option value="">Select Education Level</option>
                <option value="HighSchool">High School</option>
                <option value="Associates">Associate's Degree</option>
                <option value="Bachelors">Bachelor's Degree</option>
                <option value="Masters">Master's Degree</option>
                <option value="Doctorate">Doctorate</option>
              </select>
              {errors.educationLevel && <div className="error-message">{errors.educationLevel}</div>}
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="agreeToCommunication"
                  checked={formData.agreeToCommunication}
                  onChange={handleInputChange}
                />
                I agree to receive communication about the grant
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                />
                I accept the terms and conditions
              </label>
              {errors.termsAccepted && <div className="error-message">{errors.termsAccepted}</div>}
            </div>
            <div className="form-navigation">
              <button
                type="button"
                className="btn btn-prev"
                onClick={moveToPreviousStep}
                disabled={isSubmitting}
              >
                Previous Step
              </button>
              <button
                type="submit"
                className="btn btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Apply;