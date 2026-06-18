import { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Stores from "./pages/Stores";
import Shop from "./pages/Shop";
import Blog from "./pages/Blog";
import Product from "./pages/Product";
import Pay from "./pages/Pay";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/AdminDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import { showToast } from './lib/toast';

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [banner, setBanner] = useState(null); // {text,type}
  const [toasts, setToasts] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    // fetch authoritative user from server to ensure official username
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        const normalized = { ...data.user, role: (data.user.role || '').toLowerCase() };
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    // normalize role to lowercase to avoid casing issues
    const normalized = { ...userData, role: (userData.role || '').toLowerCase() };
    localStorage.setItem('user', JSON.stringify(normalized));
    setUser(normalized);
    // add welcome notification and dispatch a standardized toast
    const msg = `Welcome ${userData.name?.split(" ")[0] || userData.email}`;
    setNotifications(prev => [{ id: Date.now(), text: msg }, ...prev]);
    showToast(msg, 'success', 3500);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // dispatch standardized toast on logout
    showToast('You have been logged out', 'info', 3000);
  };

  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message: d.message || '', type: d.type || 'info' , duration: d.duration || 3500 }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), d.duration || 3500);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  const navigate = useNavigate ? undefined : undefined; // noop when used outside Router
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <AuthContext.Provider value={{ user, login, logout, notifications, setNotifications, setBanner }}>
      <Router>
        {banner && (
          <div className="vc-banner">
            <div className={`vc-banner-inner px-4 py-2 rounded-xl ${banner.type === 'success' ? 'vc-cta' : ''}`}>
              {banner.text}
            </div>
          </div>
        )}
        {/* Global toast container (standardized across app) */}
        <div className="vc-toast-container" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={`vc-toast ${t.type === 'error' ? 'vc-toast-error' : t.type === 'success' ? 'vc-toast-success' : 'vc-toast-info'}`}>{t.message}</div>
          ))}
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/pay" element={user ? <Pay /> : <Navigate to="/login" />} />
          <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to={user && (user.role === 'admin' || user.role === 'superadmin') ? '/admin' : (user && user.role === 'cashier') ? '/cashier' : '/'} />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to={user && (user.role === 'admin' || user.role === 'superadmin') ? '/admin' : (user && user.role === 'cashier') ? '/cashier' : '/'} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/cashier" element={user && user.role === 'cashier' ? <CashierDashboard /> : <Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;