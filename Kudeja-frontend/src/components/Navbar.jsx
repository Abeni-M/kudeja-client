import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useMessages } from '../context/MessageContext';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isStaff } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useMessages();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      {isMobileMenuOpen && (
        <div className="nav-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div className="navbar-inner container">
        <div className="navbar-brand">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
              <img 
                src="/src/images/kudeja logo.png" 
                alt="Kudeja Trading PLC" 
                className="nav-logo-img" 
              />
            </Link>
          </motion.div>

          {/* Hamburger Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
        </div>

        <nav className={`nav-links-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className="nav-link">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className="nav-link">
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className="nav-link">
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className="nav-link">
                Contact
              </NavLink>
            </li>
          </ul>

          <div className="nav-actions">
            <NavLink to="/cart" className="nav-cta nav-cta-secondary">
              Cart {cartCount ? <span className="nav-badge">{cartCount}</span> : null}
            </NavLink>

            {user ? (
              <>
                {isStaff && (
                  <NavLink to="/admin" className="nav-link nav-link-muted" style={{ marginRight: '0.5rem' }}>
                    Admin
                  </NavLink>
                )}
                
                <div 
                  className="nav-user-dropdown"
                  onMouseEnter={() => setShowUserMenu(true)}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="nav-link nav-user-trigger">
                    Profile
                    {unreadCount > 0 && <span className="nav-badge nav-badge-red dot" />}
                    <svg 
                      width="12" height="12" viewBox="0 0 24 24" fill="none" 
                      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      style={{ marginLeft: '5px', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>

                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="nav-dropdown-menu"
                    >
                      <div className="nav-dropdown-header">
                        <p className="user-name">{user.username || user.name}</p>
                        <p className="user-email">{user.email}</p>
                      </div>
                      
                      <div className="nav-dropdown-divider" />

                      <Link to="/profile" className="nav-dropdown-item" onClick={() => setShowUserMenu(false)}>
                        My Profile
                      </Link>
                      
                      <Link to="/orders" className="nav-dropdown-item" onClick={() => setShowUserMenu(false)}>
                        My Orders
                      </Link>
                      
                      <Link to="/my-messages" className="nav-dropdown-item" onClick={() => setShowUserMenu(false)}>
                        Messages
                        {unreadCount > 0 && (
                          <span className="nav-badge nav-badge-red">{unreadCount}</span>
                        )}
                      </Link>

                      <div className="nav-dropdown-divider" />
                      
                      <button type="button" className="nav-dropdown-item logout-btn" onClick={() => { logout(); setShowUserMenu(false); }}>
                        Logout
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link nav-link-muted">
                  Login
                </NavLink>
                <NavLink to="/register" className="nav-cta">
                  Sign Up
                </NavLink>
              </>
            )}

            <motion.button 
              whileHover={{ rotate: 180 }}
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              aria-label="Toggle Theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
            </motion.button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;