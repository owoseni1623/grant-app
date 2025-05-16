import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Clock, Eye, Filter, Search, X, XCircle } from 'lucide-react';
import './AdminDashboard.css';

// API configuration
const API_BASE_URL = '/api';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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

// Handle authentication errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect for explicit 401 errors from API responses
    // NOT for network errors or other issues
    if (error.response && error.response.status === 401) {
      // Check if we're already on the login page to prevent redirect loops
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Application List Component
const ApplicationList = ({ 
  applications, 
  onSelectApplication, 
  loading, 
  currentPage, 
  totalPages, 
  onPageChange,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm
}) => {
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="application-list">
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
      // Applications List
      {loading ? (
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading applications...</p>
          </div>
        </div>
      ) : (applications || []).length === 0 ? (
        <div className="empty-container">
          <div className="empty-content">
            <p className="empty-text">No applications found</p>
          </div>
        </div>
      ) : (
        <div className="applications-container">
          <ul className="applications-list">
            {(applications || []).map(app => (
              <li 
                key={app._id}
                className="application-item"
                onClick={() => onSelectApplication(app)}
              >
                <div className="application-item-content">
                  <div className="application-details">
                    <h3 className="application-name">
                      {app.personalInfo?.firstName} {app.personalInfo?.lastName}
                    </h3>
                    <p className="application-email">{app.personalInfo?.email}</p>
                    <p className="application-meta">
                      {formatDate(app.createdAt)} • {app.fundingInfo?.fundingType}
                    </p>
                  </div>
                  <div className="application-status-container">
                    <span className={`status-badge ${app.status?.toLowerCase()}`}>
                      {app.status === 'PENDING' && <Clock className="status-icon" />}
                      {app.status === 'APPROVED' && <CheckCircle className="status-icon" />}
                      {app.status === 'REJECTED' && <XCircle className="status-icon" />}
                      {app.status}
                    </span>
                    <p className="application-amount">
                      ${app.fundingInfo?.fundingAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <nav className="pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`pagination-button prev ${currentPage === 1 ? 'disabled' : ''}`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={`pagination-button page ${currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`pagination-button next ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

// Application Details Component
const ApplicationDetails = ({ application, onUpdateStatus }) => {
  const [expandedSection, setExpandedSection] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Handle admin notes
  const handleNotesChange = (e) => {
    setAdminNotes(e.target.value);
  };
  
  // Save admin notes
  const saveNotes = async () => {
    if (!application) return;
    
    try {
      // In a real app, you would have an API endpoint for notes
      await axiosInstance.post(`/applications/${application._id}/notes`, {
        notes: adminNotes
      });
      
      alert('Notes saved successfully');
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes. Please try again.');
    }
  };
  
  // Export PDF
  const exportPDF = async () => {
    if (!application) return;
    
    try {
      const response = await axiosInstance.get(`/applications/${application._id}/export-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `application-${application._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="application-detail">
      <div className="detail-header">
        <h2 className="detail-title">
          Application Details
        </h2>
        <button
          className="close-button"
          onClick={() => onUpdateStatus(null)}
        >
          <X className="close-icon" />
        </button>
      </div>
      
      {/* Status Badge and Actions */}
      <div className="status-actions">
        <div className="status-container">
          <span className={`detail-status-badge ${application.status?.toLowerCase()}`}>
            {application.status === 'PENDING' && <Clock className="detail-status-icon" />}
            {application.status === 'APPROVED' && <CheckCircle className="detail-status-icon" />}
            {application.status === 'REJECTED' && <XCircle className="detail-status-icon" />}
            {application.status}
          </span>
          <span className="app-id">
            Application ID: {application._id}
          </span>
        </div>
        
        <div className="action-buttons">
          <button
            className={`action-button approve ${application.status === 'APPROVED' ? 'disabled' : ''}`}
            onClick={() => onUpdateStatus(application._id, 'APPROVED', adminNotes)}
            disabled={application.status === 'APPROVED'}
          >
            Approve
          </button>
          <button
            className={`action-button reject ${application.status === 'REJECTED' ? 'disabled' : ''}`}
            onClick={() => onUpdateStatus(application._id, 'REJECTED', adminNotes)}
            disabled={application.status === 'REJECTED'}
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
                  <p className="info-value">{application.personalInfo?.firstName} {application.personalInfo?.lastName}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Date of Birth</p>
                  <p className="info-value">{formatDate(application.personalInfo?.dateOfBirth)}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Email</p>
                  <p className="info-value">{application.personalInfo?.email}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Phone</p>
                  <p className="info-value">{application.personalInfo?.phoneNumber}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">SSN</p>
                  <p className="info-value">{application.personalInfo?.ssn}</p>
                </div>
                {application.personalInfo?.gender && (
                  <div className="info-item">
                    <p className="info-label">Gender</p>
                    <p className="info-value">{application.personalInfo?.gender}</p>
                  </div>
                )}
                {application.personalInfo?.ethnicity && (
                  <div className="info-item">
                    <p className="info-label">Ethnicity</p>
                    <p className="info-value">{application.personalInfo?.ethnicity}</p>
                  </div>
                )}
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
                  <p className="info-value">{application.addressInfo?.streetAddress}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">City</p>
                  <p className="info-value">{application.addressInfo?.city}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">State</p>
                  <p className="info-value">{application.addressInfo?.state}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">ZIP Code</p>
                  <p className="info-value">{application.addressInfo?.zip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Employment Information */}
        {application.employmentInfo && (
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
                    <p className="info-value">{application.employmentInfo?.employmentStatus}</p>
                  </div>
                  <div className="info-item">
                    <p className="info-label">Income Level</p>
                    <p className="info-value">{application.employmentInfo?.incomeLevel}</p>
                  </div>
                  <div className="info-item">
                    <p className="info-label">Education Level</p>
                    <p className="info-value">{application.employmentInfo?.educationLevel}</p>
                  </div>
                  <div className="info-item">
                    <p className="info-label">Citizenship Status</p>
                    <p className="info-value">{application.employmentInfo?.citizenshipStatus}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Funding Information */}
        {application.fundingInfo && (
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
                    <p className="info-value">{application.fundingInfo?.fundingType}</p>
                  </div>
                  <div className="info-item">
                    <p className="info-label">Funding Amount</p>
                    <p className="info-value funding-amount">${application.fundingInfo?.fundingAmount?.toLocaleString()}</p>
                  </div>
                  <div className="info-item">
                    <p className="info-label">Timeframe</p>
                    <p className="info-value">{application.fundingInfo?.timeframe}</p>
                  </div>
                  <div className="info-item full-width">
                    <p className="info-label">Funding Purpose</p>
                    <p className="info-value">{application.fundingInfo?.fundingPurpose}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Document Verification */}
        {application.documents && (
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
                      {application.documents?.idCardFront ? (
                        <img 
                          src={`${API_BASE_URL}/uploads/${application.documents.idCardFront.split('/').pop()}`} 
                          alt="ID Card Front" 
                          className="document-image" 
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "/api/placeholder/300/200";
                          }}
                        />
                      ) : (
                        <img 
                          src="/api/placeholder/300/200" 
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
                      {application.documents?.idCardBack ? (
                        <img 
                          src={`${API_BASE_URL}/uploads/${application.documents.idCardBack.split('/').pop()}`} 
                          alt="ID Card Back" 
                          className="document-image" 
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "/api/placeholder/300/200";
                          }}
                        />
                      ) : (
                        <img 
                          src="/api/placeholder/300/200" 
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
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Additional Information */}
        <div className="accordion-item">
          <button
            className="accordion-header"
            onClick={() => toggleSection('additional')}
          >
            <h3 className="accordion-title">Additional Information</h3>
            {expandedSection === 'additional' ? <ChevronDown className="accordion-icon" /> : <ChevronRight className="accordion-icon" />}
          </button>
          
          {(expandedSection === 'additional' || expandedSection === 'all') && (
            <div className="accordion-content">
              <div className="info-grid">
                <div className="info-item">
                  <p className="info-label">Terms & Conditions</p>
                  <p className="info-value">{application.termsAccepted ? 'Accepted' : 'Not Accepted'}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Communication Opt-in</p>
                  <p className="info-value">{application.agreeToCommunication ? 'Yes' : 'No'}</p>
                </div>
                <div className="info-item full-width">
                  <p className="info-label">Application Submitted</p>
                  <p className="info-value">{formatDate(application.createdAt)}</p>
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
              <div className="history-container">
                <div className="history-item">
                  <div className="history-icon-container success">
                    <CheckCircle className="history-icon" />
                  </div>
                  <div className="history-details">
                    <p className="history-title">Application Created</p>
                    <p className="history-date">{formatDate(application.createdAt)}</p>
                  </div>
                </div>
                
                {application.statusHistory && application.statusHistory.length > 0 ? (
                  application.statusHistory.map((history, index) => (
                    <div key={index} className="history-item">
                      <div className={`history-icon-container ${history.status.toLowerCase()}`}>
                        {history.status === 'PENDING' && <Clock className="history-icon" />}
                        {history.status === 'APPROVED' && <CheckCircle className="history-icon" />}
                        {history.status === 'REJECTED' && <XCircle className="history-icon" />}
                      </div>
                      <div className="history-details">
                        <p className="history-title">Status updated to {history.status}</p>
                        <p className="history-date">{formatDate(history.changedAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-history">No status changes recorded</div>
                )}
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
              <textarea
                className="notes-textarea"
                rows="4"
                placeholder="Add notes about this application..."
                value={adminNotes}
                onChange={handleNotesChange}
              ></textarea>
              <div className="notes-actions">
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
      
      {/* Action Buttons */}
      <div className="detail-footer">
        <div>
          <button 
            className="export-button"
            onClick={exportPDF}
          >
            Export PDF
          </button>
        </div>
        <div className="footer-actions">
          {application.status === 'PENDING' && (
            <>
              <button
                className="action-button primary"
                onClick={() => onUpdateStatus(application._id, 'APPROVED', adminNotes)}
              >
                Approve
              </button>
              <button
                className="action-button secondary"
                onClick={() => onUpdateStatus(application._id, 'REJECTED', adminNotes)}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Report Generator Component
const ReportGenerator = () => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('week');
  const [generating, setGenerating] = useState(false);
  
  const handleGenerateReport = () => {
    setGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report for the last ${dateRange} would be generated here.`);
    }, 1500);
  };
  
  return (
    <div className="report-generator">
      <h3>Generate Reports</h3>
      <div className="report-options">
        <div className="report-option">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Report</option>
            <option value="status">Status Report</option>
            <option value="financial">Financial Report</option>
          </select>
        </div>
        
        <div className="report-option">
          <label>Time Period:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>
      
      <button 
        className="generate-report-button"
        onClick={handleGenerateReport}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
};

// Authentication check function
const checkAuthentication = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login page
    window.location.href = '/login';
    return false;
  }
  return true;
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verify token on page load/refresh - consolidated authentication check
  useEffect(() => {
  const verifyToken = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    try {
      // Call API to verify token
      // Add error handling that doesn't immediately redirect
      await axiosInstance.get('/auth/verify-token');
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Token verification failed:', err);
      // Check if it's actually an authentication error (401)
      if (err.response && err.response.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      } else {
        // For other errors like network issues, still consider the user authenticated
        // This prevents logout on network problems or API timeouts
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  verifyToken();
}, []);


  // Handle redirect after authentication check completes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Only redirect after loading is complete and we know auth failed
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);
  
  // Fetch applications from the backend
const fetchApplications = async (page = 1, status = filter, searchQuery = searchTerm) => {
  if (!isAuthenticated || isLoading) return;
  
  setLoading(true);
  try {
    // Format the status parameter - using the correct parameter name
    const statusParam = status === 'ALL' ? '' : status;
    
    // Call the applications endpoint matching backend route
    const response = await axiosInstance.get('/admin/applications', {
      params: {
        page,
        limit: 10,
        status: statusParam,
        search: searchQuery
      }
    });
    
    // Adjust to match backend response structure
    setApplications(response.data.applications);
    setTotalPages(response.data.pagination.pages); // Changed from totalPages to pagination.pages
    setCurrentPage(response.data.pagination.page); // Changed to match backend
    setError(null);
  } catch (err) {
    console.error('Error fetching applications:', err);
    setError('Failed to fetch applications. Please try again.');
    setApplications([]);
  } finally {
    setLoading(false);
  }
};
  
  // Effect to fetch applications on component mount and when dependencies change
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchApplications(currentPage, filter, searchTerm);
    }
  }, [currentPage, filter, searchTerm, isAuthenticated, isLoading]);
  
  // Handle page change in pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle application selection
  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
  };
  
  // Handle application status update
  const handleUpdateStatus = async (applicationId = null, status = null, notes = '') => {
    if (!applicationId) {
      // If no application ID is provided, just close the detail view
      setSelectedApplication(null);
      return;
    }
    
    try {
      // Call the API to update the application status
      await axiosInstance.patch(`/applications/${applicationId}/status`, {
        status,
        notes
      });
      
      // Update local state
      if (status) {
        // Update the status in our applications list
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app._id === applicationId ? { ...app, status } : app
          )
        );
        
        // Update the selected application if it's the one being updated
        if (selectedApplication && selectedApplication._id === applicationId) {
          setSelectedApplication(prev => ({ ...prev, status }));
        }
        
        // Show notification
        alert(`Application ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status. Please try again.');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  
  // Toggle reports section
  const toggleReports = () => {
    setShowReports(!showReports);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  // If not authenticated, don't render anything
  if (!isAuthenticated) {
    return null; // Will redirect via the useEffect
  }
  
  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="logo-container">
            <h1 className="dashboard-title">Admin Dashboard</h1>
          </div>
          <div className="admin-controls">
            <a href="/" className="home-link">Home</a>
            <button className="reports-button" onClick={toggleReports}>
              {showReports ? 'Hide Reports' : 'Show Reports'}
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Dashboard Content */}
      <div className="dashboard-content">
        {error && (
          <div className="error-container">
            <div className="error-message">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Reports Section */}
        {showReports && (
          <div className="reports-section">
            <ReportGenerator />
          </div>
        )}
        
        {/* Main Content */}
        <main className="main-content">
          {/* Left Panel - Applications List */}
          <div className={`list-panel ${selectedApplication ? 'with-detail' : ''}`}>
            <ApplicationList 
              applications={applications} 
              onSelectApplication={handleSelectApplication} 
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              filter={filter}
              setFilter={setFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
          
          {/* Right Panel - Application Details */}
          {selectedApplication && (
            <div className="detail-panel">
              <ApplicationDetails 
                application={selectedApplication} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </div>
          )}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} Funding Application System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;