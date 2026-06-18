import { useState } from "react";
import { Link } from "react-router-dom";
import { safeParseResponse } from "../lib/safeResponse";
import { FiZap } from "react-icons/fi";

export default function ForgotPassword() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await safeParseResponse(res);
      if (!res.ok) {
        setError(body.message || body._text || "Failed to request reset.");
        setResetUrl("");
      } else {
        setMessage(body.message || 'Check your email for the reset link.');
        // show reset URL in dev mode if returned
        if (body.resetUrl) setResetUrl(body.resetUrl);
      }
    } catch (err) {
      setError("Could not reach server.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)' }}>
        <Link to="/" className="inline-flex items-center gap-2 text-gray-900 font-bold text-xl mb-6">
          <FiZap className="text-amber-400 text-2xl" /> QuickCollect
        </Link>
        <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
        <p className="text-sm text-gray-500 mb-6">Enter the email for your account and we'll provide a reset link.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl mb-4">{message}</div>}
        {resetUrl && (
          <div className="mb-4">
            <a href={resetUrl} target="_blank" rel="noreferrer" className="text-amber-500 underline break-words">{resetUrl}</a>
            <p className="text-xs text-gray-400 mt-2">Follow the link above or copy it into your browser to set a new password. The link expires in 1 hour.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none" />
          <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl">{loading ? 'Sending…' : 'Send reset link'}</button>
        </form>

        <p className="text-sm text-gray-500 mt-4">Remembered your password? <Link to="/login" className="text-amber-500 font-semibold">Sign in</Link></p>
      </div>
    </div>
  );
}
