import { useEffect, useState } from 'react';
import { safeParseResponse } from '../lib/safeResponse';
import { showToast } from '../lib/toast';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Pay() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState('momo');
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState('');
  const [notice, setNotice] = useState(null);

  function isValidPhone(p) {
    if (!p) return false;
    const s = String(p).trim();
    const s2 = s.startsWith('+') ? s.slice(1) : s;
    const cleaned = s2.replace(/[^0-9]/g, '');
    // Accept Rwandan formats: 07XXXXXXXX or 2507XXXXXXXX
    if (/^0?7\d{8}$/.test(cleaned)) return true;
    if (/^2507\d{8}$/.test(cleaned)) return true;
    return false;
  }

  function luhnCheck(num) {
    const cleaned = String(num).replace(/[^0-9]/g, '');
    let sum = 0;
    let alt = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let n = parseInt(cleaned.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function isValidCardNumber(c) {
    if (!c) return false;
    const cleaned = String(c).replace(/[^0-9]/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    return luhnCheck(cleaned);
  }
  const handleConfirmPayment = async (overrideMethod) => {
    try {
      const token = localStorage.getItem('token');
      // if overrideMethod is an event (from onClick), ignore it
      const usedMethod = (typeof overrideMethod === 'string' && overrideMethod) ? overrideMethod : method;
      const allowedMethods = ['momo', 'card', 'cod'];
      if (!allowedMethods.includes(usedMethod)) {
        setError('Invalid payment method selected');
        showToast('Invalid payment method selected', 'error');
        return;
      }
      // client-side validation to avoid server 400s
      if (usedMethod === 'momo' && !isValidPhone(phone)) {
        setError('Enter a valid phone number before submitting');
        return;
      }
      if (usedMethod === 'card' && !isValidCardNumber(card)) {
        setError('Enter a valid card number before submitting');
        return;
      }
      const body = { method: usedMethod };
      if (usedMethod === 'momo') body.phone = phone;
      if (usedMethod === 'card') body.card = card;

      // safe stringify to avoid throwing on circular objects (strip DOM nodes)
      const safeStringify = (obj) => {
        try {
          return JSON.stringify(obj);
        } catch (err) {
          const seen = new WeakSet();
          return JSON.stringify(obj, (k, v) => {
            try {
              if (v && (v instanceof Element || v instanceof Node)) return undefined;
            } catch (_) {}
            if (v && typeof v === 'object') {
              if (seen.has(v)) return undefined;
              seen.add(v);
            }
            return v;
          });
        }
      };

      console.debug('DEBUG payment body', body);
      if (!token) {
        setError('Authentication required');
        showToast('Please sign in to complete payment', 'error');
        return;
      }
      let bodyText;
      try {
        bodyText = safeStringify(body);
      } catch (err) {
        console.error('Failed to serialize payment body', err, body);
        showToast('Could not prepare payment data. Try again.', 'error');
        return;
      }

      const res = await fetch(`${API_BASE}/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: bodyText,
      });
      const data = await safeParseResponse(res);
      if (!res.ok) {
        // if order already paid, fetch order and show existing QR instead of error
        if (data && /already paid/i.test(data.message || data._text || '')) {
          const token2 = localStorage.getItem('token');
          const r2 = await fetch(`${API_BASE}/api/orders/${orderId}`, { headers: { ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) } });
          const d2 = await safeParseResponse(r2);
          if (r2.ok && d2.order) {
            setResult({ order: d2.order, qrCode: d2.order.qrCode, qrPayload: d2.order.qrPayload });
            return;
          }
        }
        throw new Error(data.message || 'Payment failed');
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Payment failed');
    }
  };

  useEffect(() => {
    if (!orderId) return setError('Missing orderId');
    const loadOrder = async () => {
      setLoading(true);
      try {
        // if navigation state already contains the order, use it to avoid refetch
        if (location && location.state && location.state.order) {
          setOrder(location.state.order);
          if (location.state.order && (location.state.order.paymentStatus === 'paid' || location.state.order.qrPayload)) {
            setResult({ order: location.state.order, qrCode: location.state.order.qrCode, qrPayload: location.state.order.qrPayload });
            setLoading(false);
            return;
          }
        }
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/orders/${orderId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await safeParseResponse(res);
        if (!res.ok) throw new Error(data.message || data._text || 'Failed to load order');
        setOrder(data.order);
        // if already paid, show QR/result instead of attempting to pay again
        if (data.order && (data.order.paymentStatus === 'paid' || data.order.qrPayload)) {
          setResult({ order: data.order, qrCode: data.order.qrCode, qrPayload: data.order.qrPayload });
          setLoading(false);
          return;
        }
        const qMethod = searchParams.get('method');
        const qPhone = searchParams.get('phone');
        const qCard = searchParams.get('card');
        if (qMethod) {
          setMethod(qMethod);
          // if query supplied phone/card, prefill
          if (qPhone) setPhone(qPhone);
          if (qCard) setCard(qCard);
          // only auto-confirm when required data is present and valid
          if (qMethod === 'momo') {
            if (qPhone && isValidPhone(qPhone)) {
              await handleConfirmPayment(qMethod);
            } else {
              setNotice('Enter a valid phone number to pay with Mobile Money.');
            }
          } else if (qMethod === 'card') {
            if (qCard && isValidCardNumber(qCard)) {
              await handleConfirmPayment(qMethod);
            } else {
              setNotice('Enter a valid card number to pay with card.');
            }
          } else {
            // don't auto-submit for other methods
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;
  if (!order) return null;

  

  if (result) {
    const payload = result.qrPayload;
    const encoded = encodeURIComponent(payload);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encoded}`;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h2 className="text-xl font-bold mb-4">Payment Successful</h2>
          <p className="text-sm text-gray-500 mb-4">Order ID: {result.order._id}</p>
          <img src={qrUrl} alt="QR code" className="w-full h-auto rounded-md mb-4" />
          <div className="text-sm text-gray-700 mb-4">
            <strong>Total:</strong> RWF {result.order.totalAmount.toLocaleString()}
          </div>
          <div className="flex gap-2">
            <a href={qrUrl} download={`order-${result.order._id}-qr.png`} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Download QR</a>
            <button onClick={() => navigate('/')} className="px-4 py-2 border rounded-lg">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--body-bg)', color: 'var(--body-text)' }}>
      <div className="max-w-2xl w-full bg-white rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
        <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
        <p className="text-sm text-gray-500 mb-4">Order ID: {order._id} — Total: RWF {order.totalAmount.toLocaleString()}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Choose payment method</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input type="radio" name="method" value="momo" checked={method==='momo'} onChange={() => setMethod('momo')} />
              Mobile Money (MTN/Airtel)
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="method" value="card" checked={method==='card'} onChange={() => setMethod('card')} />
              Card (Visa/Mastercard)
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="method" value="cod" checked={method==='cod'} onChange={() => setMethod('cod')} />
              Pay at Pickup
            </label>
          </div>
        </div>

        {method === 'momo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Mobile number for Mobile Money</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 250788123456" className="w-full border rounded px-3 py-2" />
          </div>
        )}
        {notice && <div className="mb-4 text-sm text-yellow-700">{notice}</div>}
        {method === 'card' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Card number</label>
            <input value={card} onChange={e => setCard(e.target.value)} placeholder="4242 4242 4242 4242" className="w-full border rounded px-3 py-2" />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => handleConfirmPayment()} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Pay / Place Order</button>
          <button onClick={() => navigate('/shop')} className="px-4 py-2 border rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}
