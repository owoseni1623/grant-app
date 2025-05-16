// src/services/adminApiService.js
import axios from 'axios';

// API configuration with base URL
const API_URL = process.env.REACT_APP_API_URL || 'https://grant-api.onrender.com';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Admin API Service
const adminApiService = {
  // Fetch all grant applications
  getApplications: async () => {
    try {
      // Try both potential endpoints
      let applications = [];
      
      try {
        // First try the dedicated admin applications endpoint
        const adminResponse = await axiosInstance.get('/api/admin/applications');
        
        if (adminResponse.data) {
          if (Array.isArray(adminResponse.data)) {
            applications = adminResponse.data;
          } else if (adminResponse.data.applications) {
            applications = adminResponse.data.applications;
          } else if (adminResponse.data.data) {
            applications = adminResponse.data.data;
          }
          
          console.log('Successfully fetched from admin endpoint:', applications);
          return applications;
        }
      } catch (adminError) {
        console.log('Admin endpoint failed:', adminError);
        
        // If admin endpoint fails, try the general applications route
        try {
          const response = await axiosInstance.get('/api/applications');
          
          if (response.data) {
            if (Array.isArray(response.data)) {
              applications = response.data;
            } else if (response.data.applications) {
              applications = response.data.applications;
            } else if (response.data.data) {
              applications = response.data.data;
            }
            
            console.log('Successfully fetched from general endpoint:', applications);
            return applications;
          }
        } catch (generalError) {
          console.log('General endpoint failed:', generalError);
        }
      }
      
      // Final fallback: try grant applications endpoint
      try {
        const grantResponse = await axiosInstance.get('/api/grant-applications');
        
        if (grantResponse.data) {
          if (Array.isArray(grantResponse.data)) {
            applications = grantResponse.data;
          } else if (grantResponse.data.applications) {
            applications = grantResponse.data.applications;
          } else if (grantResponse.data.data) {
            applications = grantResponse.data.data;
          }
          
          console.log('Successfully fetched from grant-applications endpoint:', applications);
          return applications;
        }
      } catch (grantError) {
        console.log('Grant applications endpoint failed:', grantError);
        throw new Error('Failed to fetch applications from any endpoint');
      }
      
      return applications;
    } catch (error) {
      console.error('Error in getApplications:', error);
      throw error;
    }
  },

  // Get single application details
  getApplicationDetails: async (applicationId) => {
    try {
      // Try multiple potential endpoints
      let applicationData = null;
      
      try {
        // First try admin-specific endpoint
        const adminResponse = await axiosInstance.get(`/api/admin/applications/${applicationId}`);
        if (adminResponse.data) {
          applicationData = adminResponse.data;
          return applicationData;
        }
      } catch (adminError) {
        console.log('Admin application details endpoint failed:', adminError);
        
        // Then try general applications endpoint
        try {
          const response = await axiosInstance.get(`/api/applications/${applicationId}`);
          if (response.data) {
            applicationData = response.data;
            return applicationData;
          }
        } catch (generalError) {
          console.log('General application details endpoint failed:', generalError);
        }
      }
      
      // Finally try grant-applications endpoint
      try {
        const grantResponse = await axiosInstance.get(`/api/grant-applications/${applicationId}`);
        if (grantResponse.data) {
          applicationData = grantResponse.data;
          return applicationData;
        }
      } catch (grantError) {
        console.log('Grant application details endpoint failed:', grantError);
        throw new Error('Failed to fetch application details from any endpoint');
      }
      
      return applicationData;
    } catch (error) {
      console.error('Error in getApplicationDetails:', error);
      throw error;
    }
  },

  // Update application status
  updateApplicationStatus: async (applicationId, newStatus) => {
    try {
      // Try multiple potential endpoints
      try {
        // First try admin-specific endpoint
        const adminResponse = await axiosInstance.patch(`/api/admin/applications/${applicationId}/status`, {
          status: newStatus
        });
        
        if (adminResponse.data) {
          return adminResponse.data;
        }
      } catch (adminError) {
        console.log('Admin status update endpoint failed:', adminError);
        
        // Then try general applications endpoint
        try {
          const response = await axiosInstance.patch(`/api/applications/${applicationId}/status`, {
            status: newStatus
          });
          
          if (response.data) {
            return response.data;
          }
        } catch (generalError) {
          console.log('General status update endpoint failed:', generalError);
        }
      }
      
      // Finally try grant-applications endpoint
      const grantResponse = await axiosInstance.patch(`/api/grant-applications/${applicationId}/status`, {
        status: newStatus
      });
      
      return grantResponse.data;
      
    } catch (error) {
      console.error('Error in updateApplicationStatus:', error);
      throw error;
    }
  },

  // Save admin notes
  saveAdminNotes: async (applicationId, notes) => {
    try {
      // Try multiple potential endpoints
      try {
        // First try admin-specific endpoint
        const adminResponse = await axiosInstance.patch(`/api/admin/applications/${applicationId}/notes`, {
          adminNotes: notes
        });
        
        if (adminResponse.data) {
          return adminResponse.data;
        }
      } catch (adminError) {
        console.log('Admin notes endpoint failed:', adminError);
        
        // Then try general applications endpoint
        try {
          const response = await axiosInstance.patch(`/api/applications/${applicationId}/notes`, {
            adminNotes: notes
          });
          
          if (response.data) {
            return response.data;
          }
        } catch (generalError) {
          console.log('General notes endpoint failed:', generalError);
        }
      }
      
      // Finally try grant-applications endpoint
      const grantResponse = await axiosInstance.patch(`/api/grant-applications/${applicationId}/notes`, {
        adminNotes: notes
      });
      
      return grantResponse.data;
      
    } catch (error) {
      console.error('Error in saveAdminNotes:', error);
      throw error;
    }
  }
};

export default adminApiService;