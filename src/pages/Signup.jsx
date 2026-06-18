import { useState } from "react";
import { safeParseResponse } from "../lib/safeResponse";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../App";
import { FiZap, FiShoppingBag, FiTruck, FiShield, FiEye, FiEyeOff } from "react-icons/fi";

export default function Signup() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [supplierType, setSupplierType] = useState('none');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, supplierType }),
      });
      const data = await safeParseResponse(res);
      if (!res.ok) {
        setError(data.message || data._text || "Registration failed. Try again.");
      } else {
        login(data.user, data.token);
        if (data.user && (data.user.role === 'admin' || data.user.role === 'superadmin')) navigate('/admin');
        else if (data.user && data.user.role === 'cashier') navigate('/cashier');
        else navigate("/");
      }
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] px-14 py-10"
        style={{ background: "linear-gradient(160deg,#1a1f2e 0%,#12172a 100%)" }}
      >
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <FiZap className="text-amber-400 text-2xl" />
          QuickCollect
        </Link>

        {/* Hero copy */}
        <div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
            Join thousands<br />
            collecting{" "}
            <span className="text-amber-400">smarter.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mb-10">
            Create your free account and start ordering from local stores.
            Pick up everything at the counter with a QR code — fast, easy, secure.
          </p>

          {/* Feature list */}
          <ul className="flex flex-col gap-5">
            {[
              { icon: <FiShoppingBag />, text: "Stores and products near you" },
              { icon: <FiTruck />,       text: "Fast, reliable order processing" },
              { icon: <FiShield />,      text: "Secure payments, always protected" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-4 text-gray-300 text-sm">
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-base shrink-0">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer hint */}
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} QuickCollect. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 vc-body-text">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 vc-border-bottom">
          {/* Mobile logo only */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 font-bold text-lg vc-body-text">
            <FiZap className="text-amber-400 text-xl" />
            QuickCollect
          </Link>
          <span className="hidden lg:block" />
          <p className="text-sm vc-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-500 hover:text-amber-600 font-semibold">Sign in</Link>
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-1 vc-body-text">Create your account</h2>
              <p className="text-sm mb-8 vc-muted">
              Join to order products and collect with a QR code.
            </p>

            {/* Google SSO placeholder */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-gray-700 mb-5 vc-card"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="flex-1 h-px bg-[var(--muted-border)]" />
              <span className="text-xs uppercase tracking-widest vc-muted">or</span>
              <span className="flex-1 h-px bg-[var(--muted-border)]" />
            </div>

            {error && (
              <div className="rounded-xl mb-5 px-4 py-3 vc-card text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium vc-body-text">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="vc-input rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 pr-12 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 pr-12 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm vc-body-text">Register as supplier (optional)</label>
                <select value={supplierType} onChange={e => setSupplierType(e.target.value)} className="w-full vc-select rounded-xl">
                  <option value="none">None (buy only)</option>
                  <option value="electrical">Electrical Products Supplier</option>
                  <option value="building">Building Materials Supplier</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-60 disabled:cursor-not-allowed vc-btn vc-btn-primary flex items-center justify-center gap-2 mt-1 text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : "Create account"}
              </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-amber-500 hover:text-amber-600 font-semibold">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  © 2026 quickcollect · <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/contact" className="underline">Contact</Link>
                </p>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6 lg:hidden">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-500 hover:text-amber-600 font-semibold">
                  Log in
                </Link>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}