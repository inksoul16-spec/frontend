import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import {
  FiZap, FiSearch, FiUser, FiShoppingCart, FiGrid, FiHome, FiShoppingBag,
  FiBookOpen, FiInstagram, FiChevronDown, FiX, FiBell, FiMenu,
} from "react-icons/fi";
import { useRef, useEffect } from "react";

import { loadCart } from '../lib/cart.js';
export function Navbar({ cart = [], onCartOpen, requireAuth }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [catsOpen, setCatsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(localStorage.getItem('selectedCategory') || '');
  const catsRef = useRef(null);
  const toggleRef = useRef(null);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [categories, setCategories] = useState([
    "Electrical Cables & Wires",
    "Switches & Sockets",
    "Circuit Breakers",
    "LED Lighting",
    "Solar & Inverters",
    "Batteries & Generators",
    "Electrical Panels",
    "Cement",
    "Bricks",
    "Sand & Gravel",
    "Roofing Sheets",
    "Tiles & Paint",
  ]);

  useEffect(() => {
    let mounted = true;
    fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + '/api/categories')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data && data.categories) setCategories(data.categories.map(c => c.name));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const effectiveCart = (cart && cart.length) ? cart : (user ? loadCart(user) : []);
  const cartCount = effectiveCart.reduce((s, i) => s + (i.qty || 0), 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const navLinks = [
    { label: "Home",   to: "/",        icon: <FiHome size={13} /> },
    { label: "Stores", to: "/stores",  icon: <FiShoppingBag size={13} /> },
    { label: "Shop",   to: "/shop",    icon: <FiShoppingCart size={13} /> },
    { label: "Blog",   to: "/blog",    icon: <FiBookOpen size={13} /> },
  ];

  const CategoryRow = ({ vertical = false }) => (
    <>
      <div className="relative" style={{ display: vertical ? 'block' : 'inline-block' }}>
        <button ref={toggleRef} onClick={() => setCatsOpen(v => !v)} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors mr-2" style={{ color: 'var(--header-text)', backgroundColor:'transparent' }}>
          <FiGrid size={13} /> All Categories <FiChevronDown size={11} />
        </button>
        {catsOpen && (
          <div ref={catsRef} className="absolute left-0 mt-2 w-56 rounded-xl shadow-lg p-2 vc-popup">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCatsOpen(false); setSelectedCategory(cat); localStorage.setItem('selectedCategory', cat); navigate(`/shop?category=${encodeURIComponent(cat)}`); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded ${selectedCategory===cat ? 'bg-amber-600 text-white' : 'vc-cat-btn'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {vertical ? (
        <nav className="flex gap-2 overflow-x-auto py-2">
          {navLinks.map(({ label, to, icon }) => {
            const isRoot = to === '/';
            const active = isRoot ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${active ? 'text-amber-400' : 'text-white hover:text-amber-300'}`}
              >
                {icon} <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      ) : (
        <>
          <nav className="flex items-center gap-1 flex-1 hidden sm:flex">
            {navLinks.map(({ label, to, icon }) => {
              const isRoot = to === '/';
              const active = isRoot ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    active ? "text-amber-400" : "text-white hover:text-amber-300"
                  }`}
                >
                  {icon} <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          {/* 'Shop (secured)' button removed as requested */}
        </>
      )}
    </>
  );

  function NotificationButton() {
    const { notifications, setNotifications } = useAuth();
    const [open, setOpen] = useState(false);

    const clearAll = () => setNotifications([]);

    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" style={{ color: 'var(--header-text)' }}>
          <FiBell size={18} />
          {notifications?.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{notifications.length}</span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg p-3 text-sm" style={{ backgroundColor: 'var(--header-bg)', border: '1px solid var(--muted-border)', color: 'var(--header-text)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Notifications</span>
              <button onClick={clearAll} className="text-xs text-amber-500">Clear</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.map((n,i) => (
                  <div key={n.id || i} className="py-2 border-b last:border-b-0" style={{ borderColor: 'var(--muted-border)' }}>{n.text}</div>
                ))
              ) : (
                <div className="text-gray-400">No notifications</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    const handler = (e) => {
      const el = catsRef.current;
      const tb = toggleRef.current;
      if (!el || !tb) return;
      if (catsOpen && !el.contains(e.target) && !tb.contains(e.target)) setCatsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catsOpen]);

  return (
    <header className="sticky top-0 z-40 vc-header">
      {/* Main nav */}
        <div className="vc-header-inner">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md sm:hidden" aria-label="Open menu"><FiMenu /></button>
              <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <FiZap className="text-amber-500 text-2xl" />
            <span className="font-extrabold text-xl vc-brand-text">QuickCollect</span>
            </Link>
            </div>

          <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, stores, suppliers..."
              className="flex-1 site-search-input rounded-l-xl text-sm placeholder-gray-400 focus:outline-none transition-colors vc-text"
            />
            <button type="submit" onClick={handleSearch} className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-5 py-2.5 rounded-r-xl text-sm transition-colors shrink-0">
              Search
            </button>
          </form>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <NotificationButton />
            {user ? (
              <>
                <span className="text-sm hidden sm:block" style={{ color: 'var(--header-text)' }}>Hi, {user.name?.split(" ")[0] || user.email}</span>
                <button onClick={() => navigate('/orders')} className="text-sm hover:text-gray-200 border border-transparent px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--header-text)' }}>My Orders</button>
                <button onClick={() => { logout(); navigate('/'); }} className="text-sm hover:text-gray-200 border border-transparent px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--header-text)' }}>Log out</button>
              </>
            ) : (
              <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--header-text)' }}>
                <FiUser size={16} /> Sign In
              </button>
            )}
            <button
              onClick={() => requireAuth ? requireAuth("view your cart", () => onCartOpen?.()) : onCartOpen?.()}
              className="relative p-2 rounded-lg transition-colors vc-icon-btn"
            >
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer and overlay */}
      {mobileOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`} role="dialog" aria-hidden={!mobileOpen}>
        <div className="p-4 relative">
          {/* Mobile drawer: show vertical route list for phones */}
          <nav className="flex flex-col gap-3 mt-2">
            {navLinks.map(({ label, to, icon }) => {
              const isRoot = to === '/';
              const active = isRoot ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 text-sm px-3 py-3 rounded-lg transition-colors ${active ? 'text-amber-400 bg-black/10' : 'text-white hover:text-amber-300'}`}
                >
                  <span className="text-lg text-amber-400">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute top-3 right-3 p-2 rounded-md text-gray-300 hover:text-white">×</button>
        </div>
      </div>

      {/* Category nav row */}
      <div style={{ borderBottom: "1px solid var(--muted-border)", backgroundColor: "var(--header-bg)" }}>
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-1">
          {/* Desktop category/horizontal nav (single source of truth) */}
          <CategoryRow vertical={false} />
        </div>
      </div>
    </header>
  );
}



export function Footer() {
  const [categories, setCategories] = useState([
    "Electrical Cables & Wires",
    "Switches & Sockets",
    "Circuit Breakers",
    "LED Lighting",
    "Solar & Inverters",
    "Batteries & Generators",
    "Electrical Panels",
    "Cement",
    "Bricks",
    "Sand & Gravel",
    "Roofing Sheets",
    "Tiles & Paint",
  ]);

  useEffect(() => {
    let mounted = true;
    fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + '/api/categories')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data && data.categories) setCategories(data.categories.map(c => c.name));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);
  return (
    <footer style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)' }} className="mt-10">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-1">
            <FiZap className="text-amber-500 text-xl" />
            <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--header-text)' }}>QuickCollect</span>
          </Link>
          <p className="text-xs text-amber-400 mb-4">Making Shopping Fast, Easy and Better</p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--header-text)' }}>
            Your favorite local marketplace. Discover amazing products from trusted sellers and get them delivered to your doorstep.
          </p>
          <div className="flex flex-col gap-2">
            <a href="#" className="flex items-center gap-3 bg-black border border-gray-700 rounded-xl px-4 py-2.5 hover:border-gray-500 transition-colors w-fit">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div>
                <p className="text-xs text-gray-400 leading-none">Available on the</p>
                <p className="text-sm font-semibold text-white leading-tight">App Store</p>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 bg-black border border-gray-700 rounded-xl px-4 py-2.5 hover:border-gray-500 transition-colors w-fit">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4CAF50" d="M1.22 0C.89 0 .58.24.58.65v22.7c0 .41.31.65.64.65l12.08-11.93L1.22 0z"/>
                <path fill="#FAB400" d="M15.97 7.09L3.9 0H3.9L14.75 12 15.97 7.09z"/>
                <path fill="#F43249" d="M15.97 16.91l-1.22-4.91L3.9 24h.01l12.06-7.09z"/>
                <path fill="#087ED8" d="M.58 23.35c0 .41.31.65.64.65h.01l12.08-12L1.22 0C.89 0 .58.24.58.65v22.7z"/>
              </svg>
              <div>
                <p className="text-xs text-gray-400 leading-none">GET IT ON</p>
                <p className="text-sm font-semibold text-white leading-tight">Google Play</p>
              </div>
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-5" style={{ color: 'var(--header-text)' }}>Shop</h4>
          <ul className="flex flex-col gap-3">
            {["All Products","Stores","Earn Money","Blog"].map(item => (
              <li key={item}>
                <Link to={`/${item.toLowerCase().replace(/\s+/g,"-")}`} className="text-sm hover:text-amber-400 transition-colors" style={{ color: 'var(--header-text)' }}>{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-5" style={{ color: 'var(--header-text)' }}>Support</h4>
          <ul className="flex flex-col gap-3">
            {["Contact Us","Terms of Use","Privacy Policy","Become a Seller"].map(item => (
              <li key={item}><a href="#" className="text-sm hover:text-amber-400 transition-colors" style={{ color: 'var(--header-text)' }}>{item}</a></li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-5" style={{ color: 'var(--header-text)' }}>Browse Categories</h4>
            <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Link key={cat} to={`/shop?category=${encodeURIComponent(cat)}`} className="text-xs border border-gray-700 px-3 py-1.5 rounded-full hover:border-amber-400 hover:text-amber-400 transition-colors" style={{ color: 'var(--header-text)' }}>
                {cat}
              </Link>
            ))}
            </div>
        </div>
      </div>

      {/* Payment row */}
      <div style={{ borderColor:"var(--muted-border)" }} className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest shrink-0" style={{ color: 'var(--header-text)' }}>We Accept</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-yellow-400 text-yellow-900 text-xs font-extrabold px-3 py-1.5 rounded-lg">MTN MoMo</div>
            <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor:'#0b1220', border:'1px solid #222840' }}><span className="text-blue-300 font-extrabold text-sm italic">VISA</span></div>
            <div className="px-3 py-1.5 rounded-lg flex items-center" style={{ backgroundColor:'#0b1220', border:'1px solid #222840' }}>
              <span className="w-4 h-4 rounded-full bg-red-500 inline-block" />
              <span className="w-4 h-4 rounded-full bg-yellow-400 -ml-2 inline-block" />
            </div>
            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">AMEX</div>
            <div className="bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Pay
            </div>
          </div>
        </div>
      </div>
      {/* Bottom bar */}
      <div style={{ borderColor:"var(--muted-border)", backgroundColor: 'var(--header-bg)' }} className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs" style={{ color: 'var(--header-text)' }}>© {new Date().getFullYear()} QuickCollect. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--header-text)' }}>
            <span>Follow us</span>
            <a href="#" className="hover:text-amber-500 transition-colors"><FiInstagram size={16} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}