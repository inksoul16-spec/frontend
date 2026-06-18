import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../App";
import { FiZap, FiShoppingBag, FiTruck, FiShield, FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    try {
      const payload = { email: form.email.trim(), password: form.password };
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try parsing JSON error message, fallback to plain text or status
        let msg = `Login failed (${res.status})`;
        try {
          const body = await res.json();
          msg = body.message || msg;
        } catch (jsonErr) {
          try {
            const text = await res.text();
            if (text) msg = text;
          } catch (tErr) {
            /* ignore */
          }
        }
        setError(msg);
      } else {
        const data = await res.json();
        // normalize role and login
        const normalizedUser = { ...data.user, role: (data.user.role || '').toLowerCase() };
        login(normalizedUser, data.token);
        // Redirect based on normalized role
        if (normalizedUser.role === 'admin' || normalizedUser.role === 'superadmin') {
          navigate('/admin');
        } else if (normalizedUser.role === 'cashier') {
          navigate('/cashier');
        } else {
          navigate('/');
        }
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
            Products,<br />
            ready in{" "}
            <span className="text-amber-400">one scan.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mb-10">
            Browse local stores, place your order, and collect everything at the counter
            with a single QR code — no waiting, no hassle.
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
      <div className="flex-1 bg-white flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          {/* Mobile logo only */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-gray-900 font-bold text-lg">
            <FiZap className="text-amber-400 text-xl" />
            QuickCollect
          </Link>
          <span className="hidden lg:block" />
          <p className="text-sm text-gray-500">
            New here?{" "}
            <Link to="/signup" className="text-amber-500 hover:text-amber-600 font-semibold">
              Create account
            </Link>
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-8">
              Sign in to browse and order products near you.
            </p>

            {/* Google SSO placeholder */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
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
              <span className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Email or Username</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email or username"
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
                    placeholder="Enter your password"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 accent-amber-500"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-amber-500 hover:text-amber-600 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1 text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : "Sign In"}
              </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-amber-500 hover:text-amber-600 font-semibold">
                    Sign up for free
                  </Link>
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  © 2026 quickcollect · <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/contact" className="underline">Contact</Link>
                </p>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6 lg:hidden">
                New here?{' '}
                <Link to="/signup" className="text-amber-500 hover:text-amber-600 font-semibold">
                  Create account
                </Link>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}