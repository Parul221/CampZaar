import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, MessageCircle, Sun, Moon, Plus, Menu, X, LogOut, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // ✅ Google login function
 const handleGoogleLogin = () => {
  window.location.href = "http://localhost:4000/api/auth/google";
};
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    
    // Close profile menu when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-menu-wrapper')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Feed', path: '/feed' },
    { label: 'Rentals', path: '/rentals' },
    { label: 'Startups', path: '/startups' },
  ];
  const avatarUrl = user?.avatar_url;
  const avatarInitials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '';

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => navigate('/')}>
            <div className="logo-icon"><span>C</span></div>
            <span className="logo-text">CampZaar</span>
          </button>

          <div className="nav-links">
            {navItems.map(item => (
              <button
                key={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >{item.label}</button>
            ))}
          </div>

          <div className="nav-actions">
            <button className="nav-icon-btn" onClick={() => navigate('/feed')}><Search size={18} /></button>

            {user ? (
              <>
                <button className="nav-icon-btn" onClick={() => navigate('/chat')}>
                  <MessageCircle size={18} />
                </button>
              </>
            ) : null}

            <button className="nav-icon-btn theme-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <>
                <button className="btn-sell" onClick={() => navigate('/add-listing')}>
                  <Plus size={16} /><span>Sell</span>
                </button>

                <div className="profile-menu-wrapper">
                  <button className="avatar-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)} title={user.full_name}>
                    {avatarUrl ? <img src={avatarUrl} alt={user.full_name} className="nav-avatar-image" /> : avatarInitials}
                  </button>
                  
                  {profileMenuOpen && (
                    <div className="profile-dropdown">
                      <button className="dropdown-item" onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }}>
                        <User size={16} /> View Profile
                      </button>
                      <button className="dropdown-item logout-item" onClick={() => { logout(); navigate('/'); setProfileMenuOpen(false); }}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // ❌ OLD: navigate('/auth')
              // ✅ NEW: Google login
              <button className="btn-sell" onClick={handleGoogleLogin}> {/* priyal */}
                Sign in with Google {/* priyal */}
              </button>
            )}

            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mobile-menu">
            {navItems.map(item => (
              <button key={item.path} className="mobile-nav-link"
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
              >{item.label}</button>
            ))}

            {user ? (
              <>
                <button className="mobile-nav-link" onClick={() => { navigate('/add-listing'); setMobileOpen(false); }}>+ Add Listing</button>
                <button className="mobile-nav-link" onClick={() => { navigate('/profile'); setMobileOpen(false); }}>👤 Profile</button>
                <button className="mobile-nav-link logout-link" onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}>🚪 Logout</button>
              </>
            ) : (
              <button className="mobile-nav-link" onClick={() => { handleGoogleLogin(); setMobileOpen(false); }}>Sign In with Google</button> // priyal
            )}
          </div>
        )}
      </nav>

      <div className="bottom-nav">
        {[
          { icon: '🏠', label: 'Home', path: '/' },
          { icon: '🔍', label: 'Feed', path: '/feed' },
          { icon: '➕', label: 'Sell', path: user ? '/add-listing' : null, special: true }, // priyal
          { icon: '💬', label: 'Chat', path: user ? '/chat' : null }, // priyal
          { icon: '👤', label: user ? 'Profile' : 'Login', path: user ? '/profile' : null }, // priyal
        ].map(item => (
          <button
            key={item.label}
            className={`bottom-nav-item ${item.special ? 'special' : ''} ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => {
              if (!user) handleGoogleLogin(); // priyal
              else navigate(item.path);
            }}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
