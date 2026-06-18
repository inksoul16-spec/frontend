import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { safeParseResponse } from "../lib/safeResponse";
import { FiZap } from "react-icons/fi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';

  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!token) setError('Missing reset token.'); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    // oldPassword is optional when using token-based reset; only validate if provided
    if (oldPassword && oldPassword.length < 6) return setError('Current password must be at least 6 characters if provided.');
    if (!password || password.length < 6) return setError('New password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password/${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, oldPassword })
      });
      const body = await safeParseResponse(res);
      if (!res.ok) setError(body.message || body._text || 'Failed to reset password.');
      else {
        setMessage(body.message || 'Password reset successful.');
        setTimeout(() => navigate('/login'), 1600);
      }
    } catch (err) {
      setError('Could not contact server.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)' }}>
        <Link to="/" className="inline-flex items-center gap-2 text-gray-900 font-bold text-xl mb-6">
          <FiZap className="text-amber-400 text-2xl" /> QuickCollect
        </Link>
        <h2 className="text-2xl font-bold mb-2">Choose a new password</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your new password below.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current password (optional)" className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none" />
          <p className="text-xs text-gray-400">If you remember your current password, enter it for extra verification; otherwise leave blank.</p>
          <button type="submit" disabled={loading || !token} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl">{loading ? 'Resetting…' : 'Reset password'}</button>
        </form>

        <p className="text-sm text-gray-500 mt-4">Back to <Link to="/login" className="text-amber-500 font-semibold">Sign in</Link></p>
      </div>
    </div>
  );
}
