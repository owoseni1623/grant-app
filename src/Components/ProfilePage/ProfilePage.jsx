import React, { useState, useEffect } from 'react';
import { useRegister } from '../../Context/RegisterGrantContext';
import { Navigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
  const { state = {}, dispatch, updateForm, setError } = useRegister() || {};
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    primaryPhone: '',
    mobilePhone: '',
    avatar: null,
    bio: '',
    organization: '',
    position: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [memberSince, setMemberSince] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check authentication status from localStorage first
    const checkLocalAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          // Update the global state with user data from localStorage
          if (dispatch) {
            dispatch({ type: 'SET_AUTH_USER', payload: user });
          }
          return true;
        } catch (error) {
          console.error('Error parsing user data:', error);
          return false;
        }
      }
      return false;
    };
    
    const isLocallyAuthenticated = checkLocalAuth();
    setAuthChecked(true);
    
    // If locally authenticated, fetch profile data
    if (isLocallyAuthenticated) {
      fetchProfileData();
    }
  }, []); // Empty dependency array to run only once on mount

  // Initialize profile data from state when available
  useEffect(() => {
    if (state && state.user) {
      setProfileData(prevData => ({
        ...prevData,
        firstName: state.user.firstName || '',
        lastName: state.user.lastName || '',
        email: state.user.email || '',
        primaryPhone: state.user.primaryPhone || '',
        mobilePhone: state.user.mobilePhone || '',
        bio: state.user.bio || '',
        organization: state.user.organization || '',
        position: state.user.position || '',
      }));
      
      if (state.user.avatar) {
        setAvatarPreview(state.user.avatar);
      }
      
      // Format member since date if available
      if (state.user.memberSince) {
        const date = new Date(state.user.memberSince);
        setMemberSince(date.toLocaleDateString());
      } else {
        setMemberSince(new Date().toLocaleDateString());
      }
    }
  }, [state && state.user]);

  const fetchProfileData = async () => {
    try {
      setLocalLoading(true);
      // Use dispatch instead of calling setLoading directly
      if (dispatch) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Make API call to fetch complete profile data
      const response = await fetch('https://grant-api.onrender.com/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile data');
      }

      const data = await response.json();
      
      // Update local state with fetched profile data
      setProfileData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        primaryPhone: data.primaryPhone || '',
        mobilePhone: data.mobilePhone || '',
        avatar: data.avatar || null,
        bio: data.bio || '',
        organization: data.organization || '',
        position: data.position || '',
      });
      
      // Set avatar preview if available
      if (data.avatar) {
        setAvatarPreview(data.avatar);
      }
      
      // Format and set member since date
      if (data.memberSince) {
        const date = new Date(data.memberSince);
        setMemberSince(date.toLocaleDateString());
      }
      
      // Update global state with the fetched profile data
      if (updateForm) {
        updateForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          primaryPhone: data.primaryPhone,
          mobilePhone: data.mobilePhone,
          bio: data.bio,
          organization: data.organization,
          position: data.position,
          avatar: data.avatar,
          memberSince: data.memberSince
        }, true);
      }
      
      // Update userData in localStorage to persist profile data
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUserData = {
        ...userData,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        primaryPhone: data.primaryPhone,
        mobilePhone: data.mobilePhone,
        bio: data.bio,
        organization: data.organization,
        position: data.position,
        avatar: data.avatar,
        memberSince: data.memberSince || userData.memberSince
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
      if (setError) {
        setError('Failed to load profile data. Please try again later.');
      }
    } finally {
      setLocalLoading(false);
      // Use dispatch instead of calling setLoading directly
      if (dispatch) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setProfileData({
        ...profileData,
        avatar: file
      });
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset success message when entering edit mode
      setUpdateSuccess(false);
    } else {
      // If canceling edit, revert to stored profile data
      if (state && state.user) {
        setProfileData({
          firstName: state.user.firstName || '',
          lastName: state.user.lastName || '',
          email: state.user.email || '',
          primaryPhone: state.user.primaryPhone || '',
          mobilePhone: state.user.mobilePhone || '',
          avatar: null, // Don't restore file object
          bio: state.user.bio || '',
          organization: state.user.organization || '',
          position: state.user.position || '',
        });
        
        // Reset avatar preview to stored avatar
        if (state.user.avatar) {
          setAvatarPreview(state.user.avatar);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLocalLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Create FormData for file upload support
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (key === 'avatar' && profileData[key] instanceof File) {
          formData.append(key, profileData[key]);
        } else if (key !== 'avatar' || typeof profileData[key] === 'string') {
          formData.append(key, profileData[key]);
        }
      });
      
      // Make API call to update profile
      const response = await fetch('https://grant-api.onrender.com/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type when using FormData, the browser will set it with the correct boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update both states: context state and localStorage
      const updatedData = {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        primaryPhone: updatedUser.primaryPhone,
        mobilePhone: updatedUser.mobilePhone,
        bio: updatedUser.bio,
        organization: updatedUser.organization,
        position: updatedUser.position,
        avatar: updatedUser.avatar
      };
      
      // Update context state
      if (updateForm) {
        updateForm(updatedData, true);
      }
      
      // Update localStorage userData to persist changes
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUserData = { ...userData, ...updatedData };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setUpdateSuccess(true);
      setIsEditing(false);
      
      // Refresh profile data to ensure consistency
      await fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      if (setError) {
        setError(error.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Only redirect to login if authentication check is complete and user is not authenticated
  if (authChecked && !state?.isAuthenticated && !localStorage.getItem('token')) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!isEditing ? (
          <button className="edit-button" onClick={handleEditToggle}>
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <button className="cancel-button" onClick={handleEditToggle}>
            <FaTimes /> Cancel Editing
          </button>
        )}
      </div>
      
      {updateSuccess && (
        <div className="success-message">
          Profile updated successfully!
        </div>
      )}
      
      {state?.error && (
        <div className="error-message">
          {state.error}
        </div>
      )}
      
      {localLoading ? (
        <div className="loading-spinner">Loading profile data...</div>
      ) : (
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="avatar-container">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" />
                ) : (
                  <div className="default-avatar">
                    <FaUser />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="avatar-upload">
                  <label htmlFor="avatar-input" className="upload-button">
                    Change Photo
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
              )}
            </div>
            
            <div className="profile-status">
              <div className="status-item">
                <h3>Account Status</h3>
                <span className="active-status">Active</span>
              </div>
              <div className="status-item">
                <h3>Member Since</h3>
                <span>{memberSince}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-details">
            <form onSubmit={handleSubmit}>
              <div className="profile-section">
                <h2>Personal Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">
                      <FaEnvelope /> Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      disabled={true} // Email cannot be changed
                      required
                    />
                    {isEditing && (
                      <p className="field-note">Email cannot be changed</p>
                    )}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="primaryPhone">
                      <FaPhone /> Primary Phone
                    </label>
                    <input
                      type="tel"
                      id="primaryPhone"
                      name="primaryPhone"
                      value={profileData.primaryPhone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="mobilePhone">
                      <FaPhone /> Mobile Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      id="mobilePhone"
                      name="mobilePhone"
                      value={profileData.mobilePhone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h2>Professional Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="organization">Organization</label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={profileData.organization}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="position">Position/Title</label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={profileData.position}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Bio/About</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
              </div>
              
              {isEditing && (
                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={localLoading}>
                    {localLoading ? 'Saving...' : <><FaSave /> Save Changes</>}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;