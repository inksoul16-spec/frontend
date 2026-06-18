import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar, Footer } from "./Layout";
import { useAuth } from "../App";
import { FiPlus, FiMinus, FiShoppingCart, FiShare2 } from "react-icons/fi";
import { cartKey, loadCart, saveCart, findItemIndex } from '../lib/cart.js';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/api/products/${id}`)
      .then(r => r.json())
      .then(data => { if (!mounted) return; setProduct(data.product); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    fetch(`${API_BASE}/api/products?category=${encodeURIComponent(product.category || '')}`)
      .then(r => r.json())
      .then(data => setRelated((data.products || []).filter(p => p._id !== product._id).slice(0,6)))
      .catch(() => setRelated([]));
  }, [product]);


  const addToCart = () => {
    if (!user) return navigate('/login');
    const cart = loadCart(user);
    const idx = findItemIndex(cart, product);
    if (idx !== -1) cart[idx].qty = (cart[idx].qty || 0) + qty;
    else cart.push({ ...product, qty });
    saveCart(user, cart);
    navigate('/');
  };

  const buyNow = async () => {
    if (!user) return navigate('/login');
    // save this product as the cart and go to checkout page so user can complete flow
    const cart = [{ ...product, qty }];
    saveCart(user, cart);
    navigate('/checkout');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)' }}>
              <div className="w-full h-96 flex items-center justify-center bg-white">
              <img src={product.image || product.img || `https://via.placeholder.com/1200x900.png?text=${encodeURIComponent(product.name)}`} alt={product.name} className="max-h-full object-contain" />
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-extrabold" style={{ color: 'var(--body-text)' }}>{product.name}</h1>
              <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{product.description}</p>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)' }}>
            <h3 className="font-bold mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>Category</div><div style={{ color:'var(--muted)' }}>{product.category || '—'}</div>
              <div>Seller</div><div style={{ color:'var(--muted)' }}>{product.seller || 'Unknown'}</div>
              <div>Availability</div><div style={{ color:'var(--muted)' }}>{product.isAvailable ? 'In Stock' : 'Out of Stock'}</div>
              <div>Item ID</div><div style={{ color:'var(--muted)' }}>#{product._id?.slice(-6)}</div>
              <div>Listed</div><div style={{ color:'var(--muted)' }}>{new Date(product.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Related Items</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {related.map(r => (
                  <Link key={r._id} to={`/product/${r._id}`} className="border rounded-2xl p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgba(0,0,0,0.06)' }}>
                    <div className="aspect-square overflow-hidden">
                      <img src={r.image || r.img} alt={r.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-gray-500">{r.category}</p>
                    <p className="text-sm font-semibold line-clamp-2" style={{ color:'var(--body-text)' }}>{r.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="p-6 rounded-2xl sticky top-20" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)' }}>
            <p className="text-sm text-gray-400">{product.category}</p>
            <h2 className="text-2xl font-extrabold my-3">RWF {(product.price || 0).toLocaleString()}</h2>
            <div className="flex items-center gap-3 my-4">
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="px-3 py-2 border rounded-lg"><FiMinus/></button>
              <div className="px-4 py-2 border rounded-lg">{qty}</div>
              <button onClick={() => setQty(q => q+1)} className="px-3 py-2 border rounded-lg"><FiPlus/></button>
            </div>
            <button onClick={buyNow} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mb-3"><FiShoppingCart/> Buy Now</button>
            <button onClick={addToCart} className="w-full border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2"><FiShoppingCart/> Add to Cart</button>

            <div className="mt-6 text-sm" style={{ color:'var(--muted)' }}>
              <p><strong>Delivery</strong><br/>Available across Kigali</p>
              <p className="mt-3"><strong>Return Policy</strong><br/>Contact seller for returns</p>
              <p className="mt-3"><strong>Payment</strong><br/>MoMo &amp; card accepted</p>
            </div>
          </div>

          <div className="mt-6 p-6 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--muted-border)' }}>
            <h4 className="font-bold mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {(product.tags || []).map(t => (
                <span key={t} className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: 'var(--muted-border)' }}>{t}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}
