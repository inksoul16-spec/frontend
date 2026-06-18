import { useState, useEffect } from "react";
import { safeParseResponse } from "../lib/safeResponse";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../App";
import { Navbar, Footer } from "./Layout";
import {
  FiSearch, FiMapPin, FiShoppingBag, FiCreditCard,
  FiSmartphone, FiCheck, FiArrowRight, FiShield, FiX,
} from "react-icons/fi";
import { loadCart, saveCart, findItemIndex } from '../lib/cart.js';

export const CATEGORIES = [
  { label: "Electrical Cables & Wires", emoji: "🔌", color: "#fff0f0" },
  { label: "Switches & Sockets",       emoji: "🔘", color: "#f0f4ff" },
  { label: "Circuit Breakers",         emoji: "⚡", color: "#fff8f0" },
  { label: "LED Lighting",             emoji: "💡", color: "#f8f0ff" },
  { label: "Solar & Inverters",        emoji: "🔋", color: "#f0fff4" },
  { label: "Batteries & Generators",   emoji: "🛠️", color: "#fffdf0" },
  { label: "Electrical Panels",        emoji: "📟", color: "#f0f9ff" },
  { label: "Cement & Aggregates",      emoji: "🧱", color: "#f0fff8" },
  { label: "Roofing, Tiles & Paint",    emoji: "🏠", color: "#faf0ff" },
];

// popular products fetched from backend
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function AuthGateModal({ onClose, action }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="rounded-2xl p-8 max-w-sm w-full" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)', color: 'var(--body-text)' }}>
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-bold">Sign in required</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>You need an account to {action || "do that"}.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl leading-none"><FiX /></button>
        </div>
          <div className="flex flex-col gap-3">
          <button onClick={() => navigate("/login")} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors">Sign In</button>
          <button onClick={() => navigate("/signup")} className="w-full border text-sm font-semibold py-3 rounded-xl transition-colors" style={{ borderColor: 'var(--muted-border)', backgroundColor: 'var(--card-bg)', color: 'var(--body-text)' }}>Create account</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");
  const [popular, setPopular] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  const requireAuth = (action, cb) => {
    if (!user) { setModalAction(action); setShowModal(true); }
    else cb?.();
  };


  const addToCart = (product) => {
    requireAuth("add items to cart", () => {
      setCart(prev => {
        const next = [...prev];
        const idx = findItemIndex(next, product);
        if (idx !== -1) next[idx].qty = (next[idx].qty || 0) + 1;
        else next.push({ ...product, qty: 1 });
        saveCart(user, next);
        return next;
      });
    });
  };

  useEffect(() => {
    const saved = loadCart(user);
    if (saved && saved.length) setCart(saved);
  }, [user]);

  const cartTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) navigate(`/shop?q=${encodeURIComponent(heroSearch.trim())}`);
  };

  useEffect(() => {
    let mounted = true;
    setLoadingPopular(true);
    fetch(`${API_BASE}/api/products`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        setPopular((data.products || []).slice(0,5));
      })
      .catch(() => setPopular([]))
      .finally(() => setLoadingPopular(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingPromotions(true);
    fetch(`${API_BASE}/api/promotions`)
      .then(async r => {
        const data = await safeParseResponse(r);
        if (!mounted) return;
        if (r.ok) setPromotions(data.promotions || []);
        else setPromotions([]);
      })
      .catch(() => setPromotions([]))
      .finally(() => setLoadingPromotions(false));
    return () => { mounted = false; };
  }, []);

  const STATS = [
    { value: "21,343+", label: "Products" },
    { value: "50+", label: "Stores" },
    { value: "Same Day", label: "Delivery" },
  ];

  return (
    <div className="min-h-screen">
      {showModal && <AuthGateModal onClose={() => setShowModal(false)} action={modalAction} />}
      <Navbar cart={cart} onCartOpen={() => setCartOpen(true)} requireAuth={requireAuth} />

      {/* HERO */}
      <section className="overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2" style={{ border: '1px solid var(--muted-border)', color: 'var(--body-text)' }}>
              <FiMapPin size={13} /> Delivering across Kigali, Rwanda
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4" style={{ color: 'var(--body-text)' }}>
              Everything you need,{" "}
              <span className="text-amber-500">delivered today.</span>
            </h1>
            <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: 'var(--muted)' }}>
              Shop from trusted suppliers of electrical products and building materials — everything you need for projects and installations, delivered same day where available.
            </p>
            <form onSubmit={handleHeroSearch} className="flex mb-10 max-w-md shadow-sm">
              <div className="flex flex-1 items-center border rounded-l-xl px-4 gap-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgba(0,0,0,0.06)' }}>
                <FiSearch size={15} className="text-gray-400 shrink-0" />
                <input
                  value={heroSearch}
                  onChange={e => setHeroSearch(e.target.value)}
                  placeholder="What are you looking for?"
                  className="flex-1 site-search-input py-3 text-sm placeholder-gray-400 focus:outline-none bg-transparent" style={{ color:'var(--body-text)' }}
                />
              </div>
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-r-xl text-sm transition-colors shrink-0">
                Search
              </button>
            </form>
            <div className="flex items-center gap-8 flex-wrap">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold" style={{ color: 'var(--body-text)' }}>{value}</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end w-full max-w-lg">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden" style={{aspectRatio:"4/3"}}>
              <img
                src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=85"
                alt="Warehouse staff scanning QR code for order pickup"
                className="w-full h-full object-cover"
              />
                <div className="absolute bottom-4 left-4 rounded-2xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor:'var(--card-bg)', border:'1px solid rgba(0,0,0,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor:'var(--accent)', color:'#07221a' }}>
                    <FiCheck className="text-amber-400 text-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color:'var(--body-text)' }}>Order Ready</p>
                    <p className="text-xs" style={{ color:'var(--muted)' }}>Show QR code to collect</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMOTIONS BANNER */}
      {!loadingPromotions && promotions && promotions.length > 0 && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            {promotions.map((p, idx) => (
              <div key={p._id || idx} className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--muted-border)', backgroundColor: 'var(--card-bg)' }}>
                {p.image && <img src={p.image} alt={p.title} className="w-full h-44 object-cover" />}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-600">{p.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="py-10" style={{ borderBottom: '1px solid var(--muted-border)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              {icon:<FiShoppingBag/>, label:"Browse & order"},
              {icon:<FiCreditCard/>,  label:"Pay securely"},
              {icon:<FiSmartphone/>,  label:"Get QR code"},
              {icon:<FiCheck/>,       label:"Collect instantly"},
            ].map((step,i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor:'var(--card-bg)', border:'1px solid rgba(0,0,0,0.06)', color:'var(--accent)' }}>{step.icon}</div>
                <span className="text-sm" style={{ color:'var(--muted)' }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold" style={{ color:'var(--body-text)' }}>Shop by Category</h2>
              <p className="text-sm mt-1" style={{ color:'var(--muted)' }}>Browse our wide range of products and restaurant categories</p>
            </div>
            <Link to="/shop" className="text-amber-600 hover:text-amber-500 text-sm font-semibold flex items-center gap-1">View All <FiArrowRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {CATEGORIES.map(({label,emoji,color}) => (
              <Link key={label} to={`/shop?category=${encodeURIComponent(label)}`}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-all"
                style={{backgroundColor:color}}>
                <div className="w-12 h-12 flex items-center justify-center text-3xl">{emoji}</div>
                <span className="text-xs font-medium text-center leading-tight" style={{ color:'var(--body-text)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR RIGHT NOW */}
      <section className="py-12" style={{ borderTop: '1px solid var(--muted-border)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--body-text)' }}>Popular Right Now</h2>
              <p style={{ color: 'var(--muted)' }} className="text-sm mt-1">Top picks from trusted electrical and building material suppliers</p>
            </div>
            <Link to="/shop" className="text-amber-600 hover:text-amber-500 text-sm font-semibold flex items-center gap-1">View All <FiArrowRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {loadingPopular ? (
              <div className="col-span-full text-center py-10" style={{ color: 'var(--muted)' }}>Loading…</div>
            ) : (
              popular.map(product => (
                <div key={product._id || product.id} className="border rounded-2xl overflow-hidden transition-all group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgba(0,0,0,0.06)' }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
                    <span className="absolute top-2 left-2 z-10 text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      RWF {(product.price || 0).toLocaleString()}
                    </span>
                    <Link to={`/product/${product._id || product.id}`} className="block w-full h-full">
                      <img src={product.image || product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    </Link>
                  </div>
                  <div className="p-3">
                    <p className="text-xs uppercase tracking-wide font-medium mb-0.5" style={{ color: 'var(--muted)' }}>{product.category}</p>
                    <Link to={`/product/${product._id || product.id}`} className="text-sm font-semibold line-clamp-2 mb-2 leading-snug block" style={{ color: 'var(--body-text)' }}>{product.name}</Link>
                    <button onClick={() => addToCart(product)} className="w-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                      Add to cart
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* EXPLORE STORES BANNER */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-md">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color:'var(--body-text)' }}>
              Explore Our <span className="text-amber-500">Stores</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color:'var(--muted)' }}>
              Discover local sellers and shop unique products from trusted vendors across Kigali
            </p>
            <Link to="/stores" className="inline-flex items-center gap-2 mt-5 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors" style={{ backgroundColor:'var(--accent)', color:'#07221a' }}>
              Browse Stores <FiArrowRight size={14}/>
            </Link>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-3xl font-extrabold" style={{ color:'var(--body-text)' }}>50</p>
              <p className="text-xs font-semibold uppercase tracking-widest mt-0.5" style={{ color:'var(--muted)' }}>Verified Stores</p>
            </div>
            <div className="w-px h-12 bg-amber-200"/>
                <div className="text-center flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <FiShield className="text-green-500" size={18}/>
                <p className="text-3xl font-extrabold" style={{ color:'var(--body-text)' }}>50</p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--muted)' }}>Trusted Sellers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CART SIDEBAR */}
      {cartOpen && user && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)}/>
          <div className="relative w-80 flex flex-col h-full p-6 overflow-y-auto" style={{ backgroundColor:'var(--card-bg)', color:'var(--body-text)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-200"><FiX/></button>
            </div>
            {cart.length === 0 ? <p className="text-gray-400 text-sm">Your cart is empty.</p> : (
              <>
                <div className="flex-1 flex flex-col gap-3 mb-6">
                  {cart.length === 0 ? null : (
                    cart.flatMap(item => Array.from({ length: item.qty }, (_, i) => ({ ...item, instanceIndex: i }))).map((unit, idx) => (
                      <div key={(unit._id || unit.id) + '-' + idx} className="flex justify-between items-center rounded-xl px-4 py-3" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center gap-3">
                          <img src={unit.image||unit.img||'https://via.placeholder.com/80'} className="w-10 h-10 object-cover rounded" alt=""/>
                          <div>
                            <p className="text-sm font-medium">{unit.name}</p>
                            <p className="text-xs text-gray-400">1 pc</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">RWF {(unit.price).toLocaleString()}</span>
                          <button onClick={() => {
                            const saved = loadCart(user);
                            const idxItem = saved.findIndex(i => (i._id||i.id) === (unit._id||unit.id));
                            if (idxItem === -1) return;
                            if (saved[idxItem].qty > 1) saved[idxItem].qty -= 1;
                            else saved.splice(idxItem,1);
                            saveCart(user, saved);
                            setCart(saved);
                          }} className="text-xs text-amber-600 px-2 py-1 border rounded">Remove</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ borderTop: '1px solid var(--muted-border)' }} className="pt-4">
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-400">Total</span>
                    <span className="font-bold">RWF {cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => {
                    saveCart(user, cart);
                    setCartOpen(false);
                    navigate('/checkout');
                  }} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors">Checkout</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}