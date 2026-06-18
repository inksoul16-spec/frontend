import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../App";
import { Navbar, Footer } from "./Layout";
import { FiSliders, FiChevronDown, FiX, FiShoppingCart } from "react-icons/fi";
import { cartKey, loadCart, saveCart, findItemIndex } from '../lib/cart.js';

const SORT_OPTIONS = ["Featured","Price: Low to High","Price: High to Low","Newest"];

// API base - match login requests which use port 5000
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sort, setSort] = useState("Featured");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const qParam = searchParams.get("q") || "";
  const catParam = searchParams.get("category") || "";

  const requireAuth = (action, cb) => {
    if (!user) { setShowModal(true); }
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

  const cartTotal = cart.reduce((s,i) => s+i.price*i.qty, 0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (catParam) params.set("category", catParam);
    if (qParam) params.set("search", qParam);
    fetch(`${API_BASE}/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setProducts(data.products || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [catParam, qParam]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (sort === "Price: Low to High") list.sort((a,b) => a.price-b.price);
    if (sort === "Price: High to Low") list.sort((a,b) => b.price-a.price);
    return list;
  }, [products, sort]);

  return (
    <div className="min-h-screen">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
           <div className="rounded-2xl p-8 max-w-sm w-full shadow-2xl vc-card vc-body-text">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-xl font-bold">Sign in required</h2>
                <p className="text-sm mt-1 vc-muted">You need an account to add items to cart.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200 text-2xl"><FiX/></button>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate("/login")} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors">Sign In</button>
              <button onClick={() => navigate("/signup")} className="w-full border border-gray-700 hover:bg-gray-900 text-gray-300 font-semibold py-3 rounded-xl transition-colors">Create account</button>
            </div>
          </div>
        </div>
      )}

      <Navbar cart={cart} onCartOpen={() => setCartOpen(true)} requireAuth={requireAuth} />

      {/* Breadcrumb + header */}
      <div className="vc-border-bottom">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <nav className="text-xs mb-3 flex items-center gap-1 vc-muted">
            <Link to="/" className="hover:text-amber-600">Home</Link>
            <span>/</span>
            <span className="font-medium vc-body-text">Shop</span>
            {catParam && <><span>/</span><span className="font-medium vc-body-text">{catParam}</span></>}
          </nav>
          <h1 className="text-2xl font-bold vc-body-text">{catParam || "All Products"}</h1>
          <p className="text-sm mt-0.5 vc-muted">{filtered.length.toLocaleString()} items available</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap vc-border-bottom">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <FiSliders size={14}/> Filters
        </button>
            <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
                className="appearance-none text-sm vc-select rounded-xl pr-8"
            >
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          </div>
        {catParam && (
          <Link to="/shop" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium vc-pill vc-muted">
            {catParam} <FiX size={11}/>
          </Link>
        )}
        {qParam && (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium vc-pill vc-muted">
            "{qParam}" <Link to="/shop"><FiX size={11}/></Link>
          </span>
        )}
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 vc-dashed vc-muted">
            <p className="font-medium mb-1">No products found</p>
            <p className="text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filtered.map(product => (
              <div key={product._id || product.id} className="rounded-2xl overflow-hidden transition-all group vc-card">
                <div className="relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
                  <span className="absolute top-2 left-2 z-10 text-xs font-bold px-2.5 py-1 rounded-lg bg-black/60 text-white">
                    RWF {(product.price || 0).toLocaleString()}
                  </span>
                  <Link to={`/product/${product._id || product.id}`} className="block w-full h-full">
                    <img src={product.image || product.img || `https://via.placeholder.com/800x800.png?text=${encodeURIComponent(product.name)}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  </Link>
                </div>
                <div className="p-3">
                  <p className="text-xs uppercase tracking-wide font-medium mb-0.5 vc-muted">{product.category}</p>
                  <Link to={`/product/${product._id || product.id}`} className="text-sm font-semibold line-clamp-2 mb-2 leading-snug block vc-body-text">{product.name}</Link>
                  <button onClick={() => addToCart(product)} className="w-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart sidebar */}
      {cartOpen && user && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)}/>
          <div className="relative w-80 flex flex-col h-full p-6 overflow-y-auto shadow-2xl" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--body-text)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-200"><FiX/></button>
            </div>
            {cart.length === 0 ? <p className="text-gray-400 text-sm">Your cart is empty.</p> : (
              <>
                <div className="flex-1 flex flex-col gap-3 mb-6">
                  {cart.length === 0 ? null : (
                    cart.flatMap(item => Array.from({ length: item.qty }, (_, i) => ({ ...item, instanceIndex: i }))).map((unit, idx) => (
                      <div key={(unit._id || unit.id) + '-' + idx} className="flex justify-between items-center rounded-xl px-4 py-3" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
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
                            const idxItem = findItemIndex(saved, unit);
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
                <div style={{ borderTop: "1px solid var(--muted-border)" }} className="pt-4">
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-400">Total</span>
                    <span className="font-bold">RWF {cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => {
                    localStorage.setItem('cart', JSON.stringify(cart));
                    setCartOpen(false);
                    navigate('/checkout');
                  }} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors">Checkout</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer/>
    </div>
  );
}