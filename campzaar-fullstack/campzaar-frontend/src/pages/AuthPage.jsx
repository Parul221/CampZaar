import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

const COLLEGES = [
  'Chitkara University',
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'BITS Pilani', 'NIT Trichy', 'Delhi University', 'DTU', 'NSUT',
  'Amity University', 'VIT Vellore', 'Manipal University', 'Pune University',
  'Mumbai University', 'Anna University', 'Other',
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', username: '', college: '',
  });

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.full_name || !form.username || !form.college) {
          setError('Please fill all fields');
          setLoading(false);
          return;
        }
        await register(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo" onClick={() => navigate('/')}>
          <div className="auth-logo-icon">C</div>
          <span>CampZaar</span>
        </div>

        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome back' : 'Join CampZaar'}
        </h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to your campus marketplace'
            : 'Create your student account today'}
        </p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="auth-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Aditya Sharma"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Username</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">@</span>
                  <input
                    type="text"
                    placeholder="adityasharma"
                    value={form.username}
                    onChange={e => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? '••••••••' : 'Min 6 characters'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label>College / University</label>
              <select value={form.college} onChange={e => update('college', e.target.value)} required>
                <option value="">Select your college</option>
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <button type="submit" className="auth-submit-btn btn-primary" disabled={loading}>
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <span>New to CampZaar? <button onClick={() => { setMode('register'); setError(''); }}>Create account</button></span>
          ) : (
            <span>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
