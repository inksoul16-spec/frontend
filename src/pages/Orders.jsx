import { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from './Layout';
import { showToast } from '../lib/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // fetch the current user's orders (server exposes /api/orders/my for customers)
        const res = await fetch(`${API_BASE}/api/orders/my`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message || 'Failed to fetch orders');
        setOrders(body.orders || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch orders');
      } finally { setLoading(false); }
    };
    if (user) fetchOrders();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">My Orders</h2>
          {orders.length === 0 && <div className="p-4 border rounded text-sm text-gray-500">You have no orders yet.</div>}
          <div className="space-y-4 mt-4">
            {orders.map(o => (
              <div key={o._id} className="p-4 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">Order #{o._id}</div>
                  <div className="text-sm text-gray-500">Total: RWF {Number(o.totalAmount||0).toLocaleString()} — Status: {o.status} — Payment: {o.paymentStatus || 'pending'}</div>
                  <div className="text-sm mt-2">{(o.items||[]).slice(0,3).map(i=> i.name).join(', ')}{(o.items||[]).length>3? '...' : ''}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => navigate(`/pay?orderId=${o._id}`)} className="px-3 py-2 bg-amber-500 text-white rounded">View / Pay</button>
                  <button onClick={async () => { navigator.clipboard?.writeText(window.location.origin + `/pay?orderId=${o._id}`); showToast('Share link copied', 'success'); }} className="px-3 py-2 border rounded">Copy link</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
