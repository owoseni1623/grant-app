import React, { useState, useEffect } from 'react';
import { useRegister } from '../../Context/RegisterGrantContext';
import { FaUser, FaBell, FaSearch, FaSignOutAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  // Fix: Correctly destructure values from useRegister
  const { isAuthenticated, user, logout } = useRegister();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update body class when menu opens/closes
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('log001-mobile-menu-open');
    } else {
      document.body.classList.remove('log001-mobile-menu-open');
    }
    return () => {
      document.body.classList.remove('log001-mobile-menu-open');
    };
  }, [isMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    const backdrop = document.querySelector('.log001-mobile-menu-backdrop');
    backdrop?.classList.toggle('log001-active');
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    const backdrop = document.querySelector('.log001-mobile-menu-backdrop');
    backdrop?.classList.remove('log001-active');
  };

  const handleLogin = () => {
    navigate('/login');
    closeMenu();
  };

  const handleRegister = () => {
    navigate('/register');
    closeMenu();
  };

  // Navigation handler for mobile view
  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  // New function to navigate to profile
  const navigateToProfile = () => {
    navigate('/profile');
    closeMenu();
  };

  const renderUserSection = () => {
    if (isAuthenticated) {
      return (
        <div className="log001-user-section">
          <div className="log001-notifications">
            <FaBell className="log001-notification-icon" />
            {/* Safely check for notifications */}
            {user?.notifications && user.notifications.length > 0 && (
              <span className="log001-notification-badge">
                {user.notifications.length}
              </span>
            )}
          </div>
          <div 
            className="log001-user-profile"
            onClick={navigateToProfile}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label="Go to profile"
          >
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt="User Profile"
              className="log001-profile-image"
            />
            <span className="log001-user-name">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </span>
          </div>
          <button
            className="log001-logout-btn"
            onClick={() => {
              logout();
              closeMenu();
              navigate('/');
            }}
            aria-label="Logout"
          >
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
      );
    }
    return (
      <div className="log001-auth-buttons">
        <button className="log001-login-btn" onClick={handleLogin}>
          Login
        </button>
        <button className="log001-register-btn" onClick={handleRegister}>
          Register
        </button>
      </div>
    );
  };

  const renderSearchBar = () => (
    <div className="log001-search-container">
      <input
        type="text"
        placeholder="Search grants..."
        // Fix: Handle potential undefined searchQuery properly
        onChange={(e) => {
          // Check if the search function exists before calling it
          if (typeof window.searchGrants === 'function') {
            window.searchGrants(e.target.value);
          }
        }}
        className="log001-search-input"
      />
      <FaSearch className="log001-search-icon" />
    </div>
  );

  // Conditionally include "Apply" based on authentication status
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Home', path: '/' },
      { name: 'Grants', path: '/find-grants' }
    ];
    
    // Fix: Use directly destructured isAuthenticated instead of state.isAuthenticated
    if (isAuthenticated) {
      baseItems.push({ name: 'Apply', path: '/apply' });
      baseItems.push({ name: 'Profile', path: '/profile' });
    }
    
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className="log001-mobile-menu-backdrop" onClick={closeMenu}></div>
      <header className={`log001-grants-header ${scrolled ? 'log001-scrolled' : ''}`}>
        <div className="log001-header-container">
          <div className="log001-logo-section">
            <Link to="/" className="log001-logo-link" onClick={closeMenu}>
              <img
                src="/Images/grant logo0.png"
                alt="Grants.gov Logo"
                className="log001-header-logo"
              />
              <span className="log001-site-title">grant.GOV</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="log001-desktop-navigation">
            <ul className="log001-nav-links">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={closeMenu}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Header Actions */}
          <div className="log001-header-actions log001-desktop-only">
            {renderSearchBar()}
            {renderUserSection()}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`log001-mobile-menu-toggle ${isMenuOpen ? 'log001-open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Mobile Navigation */}
          <div className={`log001-mobile-navigation ${isMenuOpen ? 'log001-mobile-open' : ''}`}>
            <ul className="log001-nav-links">
              {navigationItems.map((item, index) => (
                <li
                  key={item.name}
                  style={{ '--item-index': index }}
                >
                  {/* Changed to button that calls navigation function */}
                  <button 
                    className="log001-mobile-nav-link"
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
            {renderSearchBar()}
            {renderUserSection()}
          </div>
        </div>
      </header>
      {/* Added header spacer to prevent content from being hidden under fixed header */}
      <div className="log001-header-spacer"></div>
    </>
  );
};

export default Header;