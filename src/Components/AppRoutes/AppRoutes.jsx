import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useRegister } from '../../Context/RegisterGrantContext';

// Layout Components
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import AdminLayout from '../AdminLayout/AdminLayout';

// Import the login components
import { UserLogin, AdminLogin } from '../Login/Login';

// ScrollToTop Component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Public Pages
import HomePage from '../Home/HomePage';
import Register from '../Register/Register';
import Apply from '../Apply/Apply';
import FindGrants from '../FindGrants/FindGrants';
import PersonalGrantPage from '../PersonalGrant/PersonalGrantPage';
import BusinessGrantPage from '../BusinessGrant/BusinessGrantPage';
import CommunityGrantPage from '../CommunityGrant/CommunityGrantPage';
import EducationGrantApp from '../EducationGrant/EducationGrantApp';
import RealEstateGrantPage from '../RealEstatePage/RealEstateGrantPage';
import HomeImprovementGrantPage from '../HomeImprovement/HomeImprovementGrantPage';
import InnovationGrantsPage from '../InnovationGrants/InnovationGrantsPage';
import MiscellaneousGrantPage from '../MiscellaneousGrant/MiscellaneousGrantPage';
import PrivacyPage from '../PrivacyPage/PrivacyPage';
import TermsPage from '../TermsPage/TermsPage';
import SitemapPage from '../SitemapPage/SitemapPage';
import HelpCenter from '../HelpCenter/HelpCenter';
import ContactUs from '../ContactUs/ContactUs';
import FAQPage from '../FAQPage/FAQPage';
import GrantAboutUs from '../AboutUs/GrantAboutUs';
import GrantResources from '../Resources/GrantResources';
import LatestNewsPage from '../LatestNews/LatestNewsPage';
import ForgotPasswordPage from '../ForgotPasswordPage/ForgotPasswordPage';
import GrantSuccessPage from '../SuccessPage/GrantSuccessPage';
import GrantInfoCenter from '../InfoPage/InfoPage';
import InfoSectionPage from '../InfoPage/InfoPage';

// Admin Pages
import AdminPanel from '../AdminPanel/AdminPanel';
import AdminDashboard from '../admin/AdminDashboard';

// User Dashboard
import UserDashboard from '../UserDashboard/UserDashboard';
import ProfilePage from '../ProfilePage/ProfilePage';

// Improved Protected Route component for admin access - using AuthContext
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useRegister();
  
  // Show loading state if auth state is still being determined
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // Redirect to admin login if not admin
  if (!isAdmin) {
    console.log('Admin check failed, redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }
  
  console.log('Admin check passed, rendering admin component');
  return children;
};

// Protected routes for direct admin content access
const ProtectedAdminContent = ({ element }) => {
  const { isAdmin, loading } = useRegister();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAdmin ? element : <Navigate to="/admin/login" replace />;
};

// Admin Access Component - Simple page to show admin links
const AdminAccess = () => {
  const { isAdmin, isAuthenticated } = useRegister();
  
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginTop: '50px'
    }}>
      <h2>Administrator Access</h2>
      
      {!isAuthenticated ? (
        <div>
          <p>Please log in with administrator credentials to access the admin panel.</p>
          <div style={{ marginTop: '30px' }}>
            <a 
              href="/admin/login" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
            >
              Admin Login
            </a>
          </div>
        </div>
      ) : isAdmin ? (
        <div>
          <p>Welcome, Administrator!</p>
          <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/admin/dashboard" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
            >
              Dashboard
            </a>
            <a 
              href="/admin/applications" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#17a2b8',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
            >
              Manage Applications
            </a>
            <a 
              href="/admin-panel" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#6f42c1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
            >
              Admin Panel
            </a>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: '#dc3545' }}>Access Denied. Administrator privileges required.</p>
          <div style={{ marginTop: '30px' }}>
            <a 
              href="/admin/login" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}
            >
              Admin Login
            </a>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p><strong>Available Admin Routes:</strong></p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>• /admin/login - Admin Login Page</li>
          <li>• /admin/dashboard - Admin Dashboard</li>
          <li>• /admin/applications - Application Management</li>
          <li>• /admin-panel - Direct Admin Panel Access</li>
        </ul>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Routes>
          {/* Admin routes with custom layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Access Hub - New route for easy admin access */}
          <Route path="/admin-access" element={
            <>
              <Header />
              <main>
                <AdminAccess />
              </main>
              <Footer />
            </>
          } />
          
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="applications" element={<AdminPanel />} />
          </Route>
          
          {/* Direct routes to admin components without layout */}
          <Route path="/admin-panel" element={<ProtectedAdminContent element={<AdminPanel />} />} />
          <Route path="/admin-dashboard" element={<ProtectedAdminContent element={<AdminDashboard />} />} />
          
          {/* Public routes with standard layout */}
          <Route path="/*" element={
            <>
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/apply" element={<Apply />} />
                  <Route path="/find-grants" element={<FindGrants />} />
                  <Route path="/personal-grant" element={<PersonalGrantPage />} />
                  <Route path="/business-grant" element={<BusinessGrantPage />} />
                  <Route path="/community-grant" element={<CommunityGrantPage />} />
                  <Route path="/education-grant" element={<EducationGrantApp />} />
                  <Route path="/real-estate-grant" element={<RealEstateGrantPage />} />
                  <Route path="/home-improvement" element={<HomeImprovementGrantPage />} />
                  <Route path="/grants-innovation" element={<InnovationGrantsPage />} />
                  <Route path="/grants-misc" element={<MiscellaneousGrantPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/sitemap" element={<SitemapPage />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/about" element={<GrantAboutUs />} />
                  <Route path="/resources" element={<GrantResources />} />
                  <Route path="/news" element={<LatestNewsPage />} />
                  <Route path="/login" element={<UserLogin />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/info-session" element={<GrantInfoCenter />} />
                  <Route path="/info-section" element={<InfoSectionPage />} />
                  <Route path="/grant-success" element={<GrantSuccessPage />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRoutes;