import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Clock, Eye, Filter, Search, X, XCircle } from 'lucide-react';
import axios from 'axios';
import './AdminPanel.css';
import { useNavigate } from 'react-router-dom';

// API configuration 
const API_URL = 'https://grant-api.onrender.com';
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
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

// Main Admin Panel Component
function AdminPanel() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSection, setExpandedSection] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [totalApplications, setTotalApplications] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination settings
  const itemsPerPage = 10;
  
  // Check authentication first
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          // Check if user is admin
          const isAdminUser = user.role === 'ADMIN' || (user.roles && user.roles.includes('ADMIN'));
          
          setIsAuthenticated(true);
          setIsAdmin(isAdminUser);
          
          if (!isAdminUser) {
            setError('Access denied. Admin privileges required.');
          }
        } else {
          // No token found - redirect to login
          navigate('/admin/login');
        }
      } catch (e) {
        console.error('Auth check error:', e);
        setError('Authentication error. Please log in again.');
        navigate('/admin/login');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Fetch applications from the backend
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAuthenticated || !isAdmin) return;
      
      setLoading(true);
      try {
        // Try multiple API endpoints to handle different backend routes
        let response;
        let applicationsData = [];
        
        // First try the admin applications endpoint
        try {
          response = await axiosInstance.get('/api/admin/applications');
          console.log('API Response from admin route:', response);
          
          if (response.data && (Array.isArray(response.data) || typeof response.data === 'object')) {
            if (Array.isArray(response.data)) {
              applicationsData = response.data;
            } else if (response.data.applications) {
              applicationsData = response.data.applications;
            } else if (response.data.data) {
              applicationsData = response.data.data;
            } else {
              applicationsData = Object.values(response.data).filter(item => 
                item && typeof item === 'object'
              );
            }
          }
        } catch (adminError) {
          console.log('Admin endpoint failed, trying alternative route');
          
          // If admin endpoint fails, try general applications endpoint
          try {
            response = await axiosInstance.get('/api/applications');
            console.log('API Response from general route:', response);
            
            if (Array.isArray(response.data)) {
              applicationsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
              if (response.data.applications) {
                applicationsData = response.data.applications;
              } else if (response.data.data) {
                applicationsData = response.data.data;
              } else {
                applicationsData = Object.values(response.data).filter(item => 
                  item && typeof item === 'object'
                );
              }
            }
          } catch (generalError) {
            console.error('Both endpoints failed:', generalError);
            throw new Error('Failed to fetch applications from any endpoint');
          }
        }

        // Process the applications to ensure they have consistent structure
        const processedApplications = applicationsData.map(app => {
          // Handle any data normalization here if needed
          return {
            ...app,
            _id: app._id || app.id || app.applicationId,
            status: app.status || 'PENDING',
            personalInfo: app.personalInfo || {},
            fundingInfo: app.fundingInfo || {},
            addressInfo: app.addressInfo || {},
            employmentInfo: app.employmentInfo || {},
            documents: app.documents || {},
            createdAt: app.createdAt || new Date().toISOString()
          };
        });

        console.log('Processed Applications:', processedApplications);
        setApplications(processedApplications);
        setTotalApplications(processedApplications.length);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err.response || err);
        
        const errorMsg = err.response?.data?.message || 
          'Failed to fetch applications. Please check your connection and try again.';
        
        setError(errorMsg);
        setLoading(false);
        
        // Handle 401 unauthorized errors by redirecting to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          navigate('/admin/login');
        }
      }
    };
    
    fetchApplications();
  }, [isAuthenticated, isAdmin, navigate]);
  
  // Filter applications based on search term and status filter
  const filteredApplications = applications.filter(app => {
    // Skip null or undefined applications
    if (!app) return false;
    
    // Safely access properties using optional chaining
    const matchesFilter = 
      filter === 'ALL' || 
      (app.status?.toUpperCase() === filter);
      
    const matchesSearch = 
      searchTerm === '' ||
      app.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app._id && app._id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.id && app.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.applicationId && app.applicationId.toString().toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesFilter && matchesSearch;
  });
  
  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Handle application selection
  const viewApplication = async (app) => {
    try {
      // First, check if we already have all the data we need
      if (app && app.personalInfo && app.fundingInfo && app.addressInfo) {
        // If the app object already has all necessary data, use it directly
        setSelectedApp(app);
        setAdminNotes(app.adminNotes || '');
        return;
      }
      
      // Otherwise, fetch the full application details
      const response = await axiosInstance.get(`/api/applications/${app._id}`);
      
      // Merge any additional data from the response with the existing app data
      const fullApplicationData = {
        ...app,
        ...response.data,
        _id: app._id || response.data._id || response.data.id || response.data.applicationId,
      };
      
      setSelectedApp(fullApplicationData);
      setAdminNotes(fullApplicationData.adminNotes || '');
    } catch (err) {
      console.error('Error fetching application details:', err);
      alert('Failed to load application details. Please try again.');
    }
  };
  
  // Handle status update
  const updateStatus = async (appId, newStatus) => {
  try {
    // Fix the API endpoint path - add '/admin' prefix
    await axiosInstance.patch(`/api/admin/applications/${appId}/status`, {
      status: newStatus
    });
    
    // Rest of the function remains the same
    const updatedApplications = applications.map(app =>
      app._id === appId ? { ...app, status: newStatus } : app
    );
    
    setApplications(updatedApplications);
    
    if (selectedApp && selectedApp._id === appId) {
      const updatedHistory = selectedApp.statusHistory ? [...selectedApp.statusHistory] : [];
      updatedHistory.push({
        status: newStatus,
        changedAt: new Date().toISOString()
      });
      
      setSelectedApp({
        ...selectedApp,
        status: newStatus,
        statusHistory: updatedHistory
      });
    }
    
    alert(`Application status updated to ${newStatus}`);
  } catch (err) {
    console.error('Error updating application status:', err);
    alert('Failed to update application status. Please try again.');
  }
};
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle admin notes
  const handleNotesChange = (e) => {
    setAdminNotes(e.target.value);
  };

  // Save admin notes
  const saveNotes = async () => {
    if (!selectedApp) return;
    
    try {
      // Update the application with the admin notes
      await axiosInstance.patch(`/api/applications/${selectedApp._id}/notes`, {
        adminNotes: adminNotes
      });
      
      // Update the selected app in the state
      setSelectedApp({
        ...selectedApp,
        adminNotes: adminNotes
      });
      
      alert('Notes saved successfully');
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes. Please try again.');
    }
  };

  // Export PDF
  const exportPDF = async () => {
    if (!selectedApp) return;
    
    try {
      const response = await axiosInstance.get(`/api/applications/${selectedApp._id}/export-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `application-${selectedApp._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/admin/login');
  };

  // Show login button if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="auth-redirect-container">
        <div className="auth-redirect-content">
          <h2>Authentication Required</h2>
          <p>Please log in to access the admin panel.</p>
          <button 
            className="login-button" 
            onClick={() => navigate('/admin/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show access denied if authenticated but not admin
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="auth-redirect-container">
        <div className="auth-redirect-content">
          <h2>Access Denied</h2>
          <p>You don't have admin privileges to access this area.</p>
          <button 
            className="back-button" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <header className="header">
          <div className="container">
            <h1 className="header-title">Grant.GOV Admin Panel</h1>
            <div className="header-actions">
              <a href="/" className="home-link">Home</a>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1 className="header-title">grant.GOV Admin Panel</h1>
          <div className="header-actions">
            <a href="/" className="home-link">Home</a>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </header>
      
      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li className="sidebar-item active">
                <a href="#" className="sidebar-link">
                  <span className="sidebar-icon">📋</span>
                  Applications
                </a>
              </li>
              <li className="sidebar-item">
                <a href="#" className="sidebar-link">
                  <span className="sidebar-icon">👤</span>
                  Users
                </a>
              </li>
              <li className="sidebar-item">
                <a href="#" className="sidebar-link">
                  <span className="sidebar-icon">⚙️</span>
                  Settings
                </a>
              </li>
              <li className="sidebar-item">
                <a href="#" className="sidebar-link">
                  <span className="sidebar-icon">📊</span>
                  Reports
                </a>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="content-area">
          {/* Application List */}
          <div className={`application-list ${selectedApp ? 'with-selected-app' : 'full-width'}`}>
            {/* Search and Filter Controls */}
            <div className="search-filter-bar">
              <div className="search-filter-container">
                <div className="search-input-container">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-dropdown">
                  <button className="filter-button">
                    <Filter className="filter-icon" /> 
                    <span>{filter}</span>
                  </button>
                  <div className="filter-dropdown-menu hidden">
                    <div className="filter-dropdown-content">
                      <button 
                        className="filter-dropdown-item"
                        onClick={() => setFilter('ALL')}
                      >
                        All
                      </button>
                      <button 
                        className="filter-dropdown-item"
                        onClick={() => setFilter('PENDING')}
                      >
                        Pending
                      </button>
                      <button 
                        className="filter-dropdown-item"
                        onClick={() => setFilter('APPROVED')}
                      >
                        Approved
                      </button>
                      <button 
                        className="filter-dropdown-item"
                        onClick={() => setFilter('REJECTED')}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${filter === 'ALL' ? 'filter-tab-active' : ''}`}
                  onClick={() => setFilter('ALL')}
                >
                  All
                </button>
                <button 
                  className={`filter-tab ${filter === 'PENDING' ? 'filter-tab-active filter-tab-pending' : ''}`}
                  onClick={() => setFilter('PENDING')}
                >
                  <Clock className="filter-tab-icon" /> Pending
                </button>
                <button 
                  className={`filter-tab ${filter === 'APPROVED' ? 'filter-tab-active filter-tab-approved' : ''}`}
                  onClick={() => setFilter('APPROVED')}
                >
                  <CheckCircle className="filter-tab-icon" /> Approved
                </button>
                <button 
                  className={`filter-tab ${filter === 'REJECTED' ? 'filter-tab-active filter-tab-rejected' : ''}`}
                  onClick={() => setFilter('REJECTED')}
                >
                  <XCircle className="filter-tab-icon" /> Rejected
                </button>
              </div>
            </div>
            
            {/* Applications List */}
            {error ? (
              <div className="error-container">
                <div className="error-content">
                  <AlertCircle className="error-icon" />
                  <p className="error-text">{error}</p>
                </div>
              </div>
            ) : currentApplications.length === 0 ? (
              <div className="empty-container">
                <div className="empty-content">
                  <p className="empty-text">No applications found</p>
                </div>
              </div>
            ) : (
              <div className="applications-container">
                <ul className="applications-list">
                  {currentApplications.map((app, index) => (
                    <li 
                      key={app._id || `app-${index}`}
                      className={`application-item ${selectedApp && selectedApp._id === app._id ? 'selected' : ''}`}
                      onClick={() => viewApplication(app)}
                    >
                      <div className="application-item-content">
                        <div className="application-details">
                          <h3 className="application-name">
                            {app.personalInfo?.firstName || 'Unknown'} {app.personalInfo?.lastName || ''}
                          </h3>
                          <p className="application-email">{app.personalInfo?.email || 'No email'}</p>
                          <p className="application-meta">
                            {formatDate(app.createdAt) || 'No date'} • {app.fundingInfo?.fundingType || 'N/A'}
                          </p>
                        </div>
                        <div className="application-status-container">
                          <span className={`status-badge ${(app.status || 'pending').toLowerCase()}`}>
                            {(!app.status || app.status === 'PENDING') && <Clock className="status-icon" />}
                            {app.status === 'APPROVED' && <CheckCircle className="status-icon" />}
                            {app.status === 'REJECTED' && <XCircle className="status-icon" />}
                            {app.status || 'PENDING'}
                          </span>
                          <p className="application-amount">
                            ${app.fundingInfo?.fundingAmount?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Pagination */}
            {filteredApplications.length > itemsPerPage && (
              <div className="pagination-container">
                <nav className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`pagination-button prev ${currentPage === 1 ? 'disabled' : ''}`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.ceil(filteredApplications.length / itemsPerPage) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`pagination-button page ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredApplications.length / itemsPerPage)}
                    className={`pagination-button next ${currentPage === Math.ceil(filteredApplications.length / itemsPerPage) ? 'disabled' : ''}`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
          
          {/* Application Detail */}
          {selectedApp && (
            <div className="application-detail">
              <div className="detail-header">
                <h2 className="detail-title">
                  Application Details
                </h2>
                <button
                  className="close-button"
                  onClick={() => setSelectedApp(null)}
                >
                  <X className="close-icon" />
                </button>
              </div>
              
              {/* Status Badge and Actions */}
              <div className="status-actions">
                <div className="status-container">
                  <span className={`detail-status-badge ${selectedApp.status?.toLowerCase()}`}>
                    {selectedApp.status === 'PENDING' && <Clock className="detail-status-icon" />}
                    {selectedApp.status === 'APPROVED' && <CheckCircle className="detail-status-icon" />}
                    {selectedApp.status === 'REJECTED' && <XCircle className="detail-status-icon" />}
                    {selectedApp.status}
                  </span>
                  <span className="app-id">
                    Application ID: {selectedApp._id}
                  </span>
                </div>
                
                <div className="action-buttons">
                  <button
                    className={`action-button approve ${selectedApp.status === 'APPROVED' ? 'disabled' : ''}`}
                    onClick={() => updateStatus(selectedApp._id, 'APPROVED')}
                    disabled={selectedApp.status === 'APPROVED'}
                  >
                    Approve
                  </button>
                  <button
                    className={`action-button reject ${selectedApp.status === 'REJECTED' ? 'disabled' : ''}`}
                    onClick={() => updateStatus(selectedApp._id, 'REJECTED')}
                    disabled={selectedApp.status === 'REJECTED'}
                  >
                    Reject
                  </button>
                </div>
              </div>
              
              {/* Application Details Accordion */}
              <div className="accordion">
                {/* Personal Information */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('personal')}
                  >
                    <h3 className="accordion-title">Personal Information</h3>
                    {expandedSection === 'personal' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'personal' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="info-grid">
                        <div className="info-item">
                          <p className="info-label">Name</p>
                          <p className="info-value">{selectedApp.personalInfo?.firstName} {selectedApp.personalInfo?.lastName}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Date of Birth</p>
                          <p className="info-value">{formatDate(selectedApp.personalInfo?.dateOfBirth)}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Email</p>
                          <p className="info-value">{selectedApp.personalInfo?.email}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Phone</p>
                          <p className="info-value">{selectedApp.personalInfo?.phoneNumber}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">SSN</p>
                          <p className="info-value">{selectedApp.personalInfo?.ssn}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Gender</p>
                          <p className="info-value">{selectedApp.personalInfo?.gender || 'Not specified'}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Ethnicity</p>
                          <p className="info-value">{selectedApp.personalInfo?.ethnicity || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Address Information */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('address')}
                  >
                    <h3 className="accordion-title">Address Information</h3>
                    {expandedSection === 'address' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'address' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="info-grid">
                        <div className="info-item full-width">
                          <p className="info-label">Street Address</p>
                          <p className="info-value">{selectedApp.addressInfo?.streetAddress}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">City</p>
                          <p className="info-value">{selectedApp.addressInfo?.city}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">State</p>
                          <p className="info-value">{selectedApp.addressInfo?.state}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">ZIP Code</p>
                          <p className="info-value">{selectedApp.addressInfo?.zip}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Employment Information */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('employment')}
                  >
                    <h3 className="accordion-title">Employment Information</h3>
                    {expandedSection === 'employment' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'employment' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="info-grid">
                        <div className="info-item">
                          <p className="info-label">Employment Status</p>
                          <p className="info-value">{selectedApp.employmentInfo?.employmentStatus || 'Not specified'}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Income Level</p>
                          <p className="info-value">{selectedApp.employmentInfo?.incomeLevel || 'Not specified'}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Education Level</p>
                          <p className="info-value">{selectedApp.employmentInfo?.educationLevel || 'Not specified'}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Citizenship Status</p>
                          <p className="info-value">{selectedApp.employmentInfo?.citizenshipStatus || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Funding Information */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('funding')}
                  >
                    <h3 className="accordion-title">Funding Information</h3>
                    {expandedSection === 'funding' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'funding' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="info-grid">
                        <div className="info-item">
                          <p className="info-label">Funding Type</p>
                          <p className="info-value">{selectedApp.fundingInfo?.fundingType}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Funding Amount</p>
                          <p className="info-value funding-amount">${selectedApp.fundingInfo?.fundingAmount?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Timeframe</p>
                          <p className="info-value">{selectedApp.fundingInfo?.timeframe || 'Not specified'}</p>
                        </div>
                        <div className="info-item full-width">
                          <p className="info-label">Funding Purpose</p>
                          <p className="info-value">{selectedApp.fundingInfo?.fundingPurpose}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Document Verification */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('documents')}
                  >
                    <h3 className="accordion-title">Identity Documents</h3>
                    {expandedSection === 'documents' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'documents' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="document-grid">
                        <div className="document-item">
                          <p className="document-label">ID Card Front</p>
                          <div className="document-container">
                            {selectedApp.documents?.idCardFront ? (
                              <img 
                                src={`${API_URL}/uploads/${selectedApp.documents.idCardFront.split('/').pop()}`} 
                                alt="ID Card Front" 
                                className="document-image" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  // Generate SVG placeholder inline to avoid 404 errors
                                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EID Card Front%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                            ) : (
                              <img 
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EID Card Front%3C/text%3E%3C/svg%3E" 
                                alt="ID Card Front Placeholder" 
                                className="document-image" 
                              />
                            )}
                            <div className="document-actions">
                              <button className="document-view-button">
                                <Eye className="document-view-icon" /> View Full
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="document-item">
                          <p className="document-label">ID Card Back</p>
                          <div className="document-container">
                            {selectedApp.documents?.idCardBack ? (
                              <img 
                                src={`${API_URL}/uploads/${selectedApp.documents.idCardBack.split('/').pop()}`} 
                                alt="ID Card Back" 
                                className="document-image" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EID Card Back%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                            ) : (
                              <img 
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EID Card Back%3C/text%3E%3C/svg%3E" 
                                alt="ID Card Back Placeholder" 
                                className="document-image" 
                              />
                            )}
                            <div className="document-actions">
                              <button className="document-view-button">
                                <Eye className="document-view-icon" /> View Full
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="document-item">
                          <p className="document-label">Address Proof</p>
                          <div className="document-container">
                            {selectedApp.documents?.proofOfAddress ? (
                              <img 
                                src={`${API_URL}/uploads/${selectedApp.documents.proofOfAddress.split('/').pop()}`} 
                                alt="Address Proof" 
                                className="document-image" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EAddress Proof%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                            ) : (
                              <img 
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EAddress Proof%3C/text%3E%3C/svg%3E" 
                                alt="Address Proof Placeholder" 
                                className="document-image" 
                              />
                            )}
                            <div className="document-actions">
                              <button className="document-view-button">
                                <Eye className="document-view-icon" /> View Full
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="document-item">
                          <p className="document-label">Income Verification</p>
                          <div className="document-container">
                            {selectedApp.documents?.incomeVerification ? (
                              <img 
                                src={`${API_URL}/uploads/${selectedApp.documents.incomeVerification.split('/').pop()}`} 
                                alt="Income Verification" 
                                className="document-image" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EIncome Verification%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                            ) : (
                              <img 
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' dominant-baseline='middle' text-anchor='middle'%3EIncome Verification%3C/text%3E%3C/svg%3E" 
                                alt="Income Verification Placeholder" 
                                className="document-image" 
                              />
                            )}
                            <div className="document-actions">
                              <button className="document-view-button">
                                <Eye className="document-view-icon" /> View Full
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Project Proposal */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('proposal')}
                  >
                    <h3 className="accordion-title">Project Proposal</h3>
                    {expandedSection === 'proposal' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'proposal' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="proposal-content">
                        <div className="proposal-section">
                          <h4 className="proposal-heading">Project Title</h4>
                          <p className="proposal-text">{selectedApp.projectProposal?.title || 'No project title provided'}</p>
                        </div>
                        
                        <div className="proposal-section">
                          <h4 className="proposal-heading">Executive Summary</h4>
                          <p className="proposal-text">{selectedApp.projectProposal?.summary || 'No executive summary provided'}</p>
                        </div>
                        
                        <div className="proposal-section">
                          <h4 className="proposal-heading">Budget Breakdown</h4>
                          {selectedApp.projectProposal?.budget ? (
                            <div className="budget-table-container">
                              <table className="budget-table">
                                <thead>
                                  <tr>
                                    <th>Item</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(selectedApp.projectProposal.budget) ? (
                                    selectedApp.projectProposal.budget.map((item, index) => (
                                      <tr key={index}>
                                        <td>{item.item}</td>
                                        <td>{item.description}</td>
                                        <td>${item.amount.toLocaleString()}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="3">Budget information not in expected format</td>
                                    </tr>
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colSpan="2"><strong>Total Budget</strong></td>
                                    <td>
                                      <strong>
                                        ${Array.isArray(selectedApp.projectProposal.budget) ? 
                                          selectedApp.projectProposal.budget
                                            .reduce((sum, item) => sum + (item.amount || 0), 0)
                                            .toLocaleString() : '0'}
                                      </strong>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          ) : (
                            <p className="proposal-text">No budget information provided</p>
                          )}
                        </div>
                        
                        <div className="proposal-section">
                          <h4 className="proposal-heading">Timeline</h4>
                          <p className="proposal-text">{selectedApp.projectProposal?.timeline || 'No timeline provided'}</p>
                        </div>
                        
                        <div className="proposal-section">
                          <h4 className="proposal-heading">Expected Outcomes</h4>
                          <p className="proposal-text">{selectedApp.projectProposal?.outcomes || 'No expected outcomes provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Application History */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('history')}
                  >
                    <h3 className="accordion-title">Application History</h3>
                    {expandedSection === 'history' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'history' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="history-timeline">
                        <div className="history-item">
                          <div className="history-dot"></div>
                          <div className="history-content">
                            <p className="history-date">{formatDate(selectedApp.createdAt)}</p>
                            <p className="history-text">Application submitted</p>
                          </div>
                        </div>
                        
                        {Array.isArray(selectedApp.statusHistory) && selectedApp.statusHistory.map((historyItem, index) => (
                          <div className="history-item" key={index}>
                            <div className={`history-dot ${historyItem.status.toLowerCase()}`}></div>
                            <div className="history-content">
                              <p className="history-date">{formatDate(historyItem.changedAt)}</p>
                              <p className="history-text">
                                Status changed to <span className={`history-status ${historyItem.status.toLowerCase()}`}>{historyItem.status}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Admin Notes */}
                <div className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleSection('notes')}
                  >
                    <h3 className="accordion-title">Admin Notes</h3>
                    {expandedSection === 'notes' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
                  </button>
                  
                  {(expandedSection === 'notes' || expandedSection === 'all') && (
                    <div className="accordion-content">
                      <div className="notes-container">
                        <textarea
                          className="admin-notes-textarea"
                          value={adminNotes}
                          onChange={handleNotesChange}
                          placeholder="Add your notes here..."
                          rows={6}
                        ></textarea>
                        <button
                          className="save-notes-button"
                          onClick={saveNotes}
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions Footer */}
              <div className="detail-footer">
                <button
                  className="footer-button export-button"
                  onClick={exportPDF}
                >
                  Export as PDF
                </button>
                <button
                  className="footer-button close-button"
                  onClick={() => setSelectedApp(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;