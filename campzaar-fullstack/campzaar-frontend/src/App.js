import React from 'react';
import LoginSuccess from "./pages/LoginSuccess"; // priyal
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import FeedPage from './pages/FeedPage';
import ProductPage from './pages/ProductPage';
import AddListingPage from './pages/AddListingPage';
import RentalsPage from './pages/RentalsPage';
import StartupsPage from './pages/StartupsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(240,90,40,0.2)', borderTopColor:'#f05a28', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login-success" element={<LoginSuccess />} /> // priyal
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/rentals" element={<RentalsPage />} />
        <Route path="/startups" element={<StartupsPage />} />
        <Route path="/add-listing" element={<ProtectedRoute><AddListingPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
