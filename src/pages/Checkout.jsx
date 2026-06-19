import { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { loadCart, saveCart } from '../lib/cart.js';
import { safeParseResponse } from '../lib/safeResponse';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from './Layout';
import { showToast } from '../lib/toast';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddr, setShowAddr] = useState(false);
  const [newAddr, setNewAddr] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [method, setMethod] = useState('momo');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  useEffect(()=>{
    const c = loadCart(user);
    setCart(c);
    const a = JSON.parse(localStorage.getItem('addresses')||'[]');
    setAddresses(a);
    setSelectedAddress(a[0]||null);
  },[user]);

  const subtotal = cart.reduce((s,i)=>s + (i.price||0)*(i.qty||1),0);

  const addAddress = () => {
    if(!newAddr) return;
    const next = [{ id: Date.now(), text: newAddr }, ...addresses];
    setAddresses(next); setSelectedAddress(next[0]); setNewAddr(''); setShowAddr(false);
    localStorage.setItem('addresses', JSON.stringify(next));
  };

  const placeOrder = async () => {
    if(!selectedAddress) { showToast('Select or add a pickup location', 'error'); return; }
    if(cart.length===0) { showToast('Cart is empty', 'error'); return; }
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      // sanitize cart to avoid circular refs or unexpected non-serializable values
      const sanitizedCart = (cart || []).map(i => ({
        _id: i._id || i.id || null,
        name: i.name || i.title || null,
        price: Number(i.price || 0),
        qty: Number(i.qty || 1),
        sku: i.sku || null,
        image: i.image || i.img || null,
      }));
      const payload = { cart: sanitizedCart, instructions, address: selectedAddress ? selectedAddress.text : null, method };
      console.debug('DEBUG checkout payload', payload);
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify(payload)
      });
      const data = await safeParseResponse(res);
      if(!res.ok) throw new Error(data.message||data._text||'Checkout failed');
      // clear user's cart (items were ordered)
      saveCart(user, []);
      setCart([]);
      showToast('Order placed', 'success');
      // navigate to pay with method preselected so it auto-confirms
      // include a sanitized created order in navigation state to avoid passing any circular refs
      const ord = data.order || {};
      const safeOrder = {
        _id: ord._id || data.orderId,
        totalAmount: ord.totalAmount || ord.total || 0,
        paymentStatus: ord.paymentStatus || null,
        qrPayload: ord.qrPayload || null,
        qrCode: ord.qrCode || null,
        items: (ord.items || []).map(i => ({ name: i.name, price: i.price, qty: i.qty })),
        paymentDetails: ord.paymentDetails || null,
      };
      navigate(`/pay?orderId=${data.orderId}&method=${encodeURIComponent(method)}`, { state: { order: safeOrder } });
    }catch(err){ showToast(err.message || 'Failed', 'error'); }
    finally{ setLoading(false); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-6 vc-card">
            {/* Step indicator */}
            <div className="mb-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step===1?'bg-amber-500 text-white':'bg-gray-200 text-gray-600'}`}>1</div>
                    <div className="text-sm"><div className="font-semibold">Pickup</div><div className="text-xs text-gray-500">Choose location</div></div>
                  </div>
                <div className="w-24 h-0.5 bg-gray-200"></div>
                  <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step===2?'bg-amber-500 text-white':'bg-gray-200 text-gray-600'}`}>2</div>
                  <div className="text-sm"><div className="font-semibold">Instructions</div><div className="text-xs text-gray-500">Pickup notes</div></div>
                </div>
                <div className="w-24 h-0.5 bg-gray-200"></div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step===3?'bg-amber-500 text-white':'bg-gray-200 text-gray-600'}`}>3</div>
                  <div className="text-sm"><div className="font-semibold">Payment</div><div className="text-xs text-gray-500">Choose method</div></div>
                </div>
              </div>
            </div>

            {/* Pickup / Location selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3"><h3 className="font-bold">Pickup Location</h3><button onClick={()=>setShowAddr(true)} className="text-sm bg-amber-100 px-3 py-1 rounded">+ Add New</button></div>
              <div className="space-y-3">
                {addresses.length===0 && <div className="p-4 border rounded text-gray-500">No saved addresses yet.</div>}
                {addresses.map(a=> (
                  <label key={a.id} className={`block p-4 border rounded cursor-pointer ${selectedAddress && selectedAddress.id===a.id? 'border-amber-400 ring-1 ring-amber-200':''}`}>
                    <input type="radio" name="addr" checked={selectedAddress && selectedAddress.id===a.id} onChange={()=>setSelectedAddress(a)} className="mr-3" />
                    <span className="text-sm font-medium">{a.text}</span>
                  </label>
                ))}
                {selectedAddress && <div className="p-3 mt-2 text-sm text-gray-600">Selected: <strong>{selectedAddress.text}</strong></div>}
              </div>
              <div className="mt-4">
                <button onClick={()=>setStep(2)} className="px-4 py-2 bg-amber-500 text-white rounded">Continue →</button>
              </div>
            </div>

            {step>=2 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2">Pickup Instructions</h3>
                <textarea value={instructions} onChange={e=>setInstructions(e.target.value)} className="w-full p-3 border rounded" placeholder="Add any pickup instructions (who will collect, ID, stall number, etc.)" />
                <div className="mt-4"><button onClick={()=>setStep(3)} className="px-4 py-2 bg-amber-500 text-white rounded">Continue →</button></div>
              </div>
            )}

            {step>=3 && (
              <div>
                <h3 className="font-bold mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 border rounded ${method==='momo'? 'border-amber-400 ring-1 ring-amber-200':''}`}><input type="radio" name="pm" checked={method==='momo'} onChange={()=>setMethod('momo')} className="mr-2"/> <div><div className="font-medium">Mobile Money</div><div className="text-xs text-gray-500">MTN / Airtel</div></div></label>
                  <label className={`flex items-center gap-3 p-3 border rounded ${method==='card'? 'border-amber-400 ring-1 ring-amber-200':''}`}><input type="radio" name="pm" checked={method==='card'} onChange={()=>setMethod('card')} className="mr-2"/> <div><div className="font-medium">Card</div><div className="text-xs text-gray-500">Visa, Mastercard</div></div></label>
                  <label className={`flex items-center gap-3 p-3 border rounded ${method==='cod'? 'border-amber-400 ring-1 ring-amber-200':''}`}><input type="radio" name="pm" checked={method==='cod'} onChange={()=>setMethod('cod')} className="mr-2"/> <div><div className="font-medium">Pay at Pickup</div><div className="text-xs text-gray-500">Pay when you collect</div></div></label>
                </div>
                <div className="mt-6">
                  <button onClick={placeOrder} disabled={loading} className="px-6 py-3 bg-amber-500 text-white rounded-lg shadow">{loading? 'Placing…':'Place Order'}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="p-6 rounded-2xl sticky top-20 shadow-sm vc-card">
            <h4 className="font-bold mb-4">Order Summary</h4>
            <div className="space-y-3 mb-3">
              {cart.length === 0 ? <div className="text-sm text-gray-500">No items in cart</div> : (
                cart.flatMap(item => Array.from({ length: item.qty }, (_, i) => ({ ...item, instanceIndex: i }))).map((unit, idx) => (
                  <div key={(unit._id||unit.id) + '-' + idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={unit.image||unit.img||'https://via.placeholder.com/80'} className="w-14 h-14 object-cover rounded" alt=""/>
                      <div>
                        <div className="text-sm font-medium">{unit.name}</div>
                        <div className="text-xs text-gray-500">1 pc</div>
                      </div>
                    </div>
                      <div className="flex items-center gap-3">
                      <div className="font-semibold">RWF {( (unit.price||0) ).toLocaleString()}</div>
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
            <div className="pt-4 mt-4 vc-border-top">
              <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Subtotal</span><span>RWF {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Pickup Fee</span><span>RWF 0</span></div>
              <div className="flex justify-between text-lg font-bold mt-3"><span>Total</span><span className="text-amber-600">RWF {subtotal.toLocaleString()}</span></div>
            </div>
          </div>
        </aside>
      </div>

      <Footer />

      {showAddr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">New Pickup Location</h3><button onClick={()=>setShowAddr(false)}>×</button></div>
              <input value={newAddr} onChange={e=>setNewAddr(e.target.value)} className="w-full p-3 border rounded mb-3" placeholder="Stall, shop name or location" />
            <div className="flex justify-end gap-3"><button onClick={()=>setShowAddr(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={addAddress} className="px-4 py-2 bg-amber-500 text-white rounded">Save Address</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
